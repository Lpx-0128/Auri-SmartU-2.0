import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PredictionData {
  currentHour: number;
  currentDay: number;
  nextHour: number;
  trafficData: any[];
  liftData: any[];
  parkingData: any[];
  libraryData: any[];
  canteenData: any[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    const nextHour = (currentHour + 1) % 24;

    const [trafficResult, liftResult, parkingResult, libraryResult, canteenResult] = await Promise.all([
      supabase.from('poi_traffic').select('*').limit(10),
      supabase.from('lifts').select('*').limit(20),
      supabase.from('parking_lots').select('*'),
      supabase.from('library_seats').select('*'),
      supabase.from('food_stalls').select('*')
    ]);

    const data: PredictionData = {
      currentHour,
      currentDay,
      nextHour,
      trafficData: trafficResult.data || [],
      liftData: liftResult.data || [],
      parkingData: parkingResult.data || [],
      libraryData: libraryResult.data || [],
      canteenData: canteenResult.data || []
    };

    const isWeekday = data.currentDay >= 1 && data.currentDay <= 5;
    const dayType = isWeekday ? 'weekday' : 'weekend';

    const avgParkingOccupancy = data.parkingData.length > 0
      ? data.parkingData.reduce((sum, lot) => sum + ((lot.total_spaces - lot.available_spaces) / lot.total_spaces * 100), 0) / data.parkingData.length
      : 0;

    const avgLibraryOccupancy = data.libraryData.length > 0
      ? data.libraryData.reduce((sum: number, seat: any) => sum + ((seat.total_seats - seat.available_seats) / seat.total_seats * 100), 0) / data.libraryData.length
      : 0;

    const avgCanteenOccupancy = data.canteenData.length > 0
      ? data.canteenData.reduce((sum: number, stall: any) => sum + ((stall.total_seats - stall.available_seats) / stall.total_seats * 100), 0) / data.canteenData.length
      : 0;

    const avgLiftWaitTime = data.liftData.length > 0
      ? data.liftData.reduce((sum: number, lift: any) => sum + lift.estimated_wait_time, 0) / data.liftData.length
      : 0;

    const avgTrafficLevel = data.trafficData.length > 0
      ? data.trafficData.map((t: any) => t.traffic_level).join(', ')
      : 'unknown';

    const prompt = `You are a campus activity predictor for a Malaysian university. Analyze current campus data and predict what will happen in the NEXT HOUR.

Current Context:
- Current time: ${data.currentHour}:00 (${dayType})
- Next hour to predict: ${data.nextHour}:00
- Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][data.currentDay]}

Current Campus Status:
- Parking occupancy: ${avgParkingOccupancy.toFixed(1)}%
- Library occupancy: ${avgLibraryOccupancy.toFixed(1)}%
- Canteen occupancy: ${avgCanteenOccupancy.toFixed(1)}%
- Average lift wait time: ${avgLiftWaitTime.toFixed(0)} minutes
- Traffic levels to destinations: ${avgTrafficLevel}

Predict what will happen at ${data.nextHour}:00 (one hour from now). Consider:
1. Malaysian university patterns (classes typically 9am-5pm on weekdays)
2. Peak hours: 8-9am (arrival), 12-2pm (lunch), 5-6pm (departure)
3. Weekend vs weekday differences
4. Current trends showing acceleration or deceleration

Respond in EXACTLY this JSON format (no markdown):
{
  "message": "Brief specific prediction about what will happen at ${data.nextHour}:00",
  "severity": "high|medium|low",
  "icon": "traffic|lift|parking|general",
  "confidence": 0.0-1.0
}

Rules:
- Be specific about the NEXT hour (${data.nextHour}:00), not current conditions
- If conditions will improve, use "low" severity
- If conditions will worsen significantly, use "high" severity
- Message should be under 80 characters
- Focus on the most impactful prediction`;

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    console.log("OpenAI API Key present:", !!openaiApiKey);
    console.log("OpenAI API Key length:", openaiApiKey?.length || 0);
    
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY environment variable is not set");
      throw new Error("OPENAI_API_KEY not configured");
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a data analyst specializing in campus activity prediction. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const responseText = openaiData.choices[0].message.content?.trim() || '{}';
    const prediction = JSON.parse(responseText);

    const result = {
      message: prediction.message || 'Unable to generate prediction',
      severity: prediction.severity || 'low',
      icon: prediction.icon || 'general',
      confidence: prediction.confidence || 0.5
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Prediction error:', error);

    return new Response(
      JSON.stringify({
        message: 'AI prediction temporarily unavailable',
        severity: 'low',
        icon: 'general',
        confidence: 0
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});