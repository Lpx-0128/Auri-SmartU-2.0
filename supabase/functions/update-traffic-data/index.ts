import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface TrafficRoute {
  id: string;
  from_location: string;
  to_location: string;
  destination_latitude: number;
  destination_longitude: number;
  university_id: string;
}

interface University {
  id: string;
  latitude: number;
  longitude: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!googleMapsApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured', message: 'Please add GOOGLE_MAPS_API_KEY to Supabase Edge Function secrets' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: routes, error: routesError } = await supabase
      .from('traffic_routes')
      .select('id, from_location, to_location, destination_latitude, destination_longitude, university_id');

    if (routesError) throw routesError;

    const { data: universities, error: uniError } = await supabase
      .from('universities')
      .select('id, latitude, longitude');

    if (uniError) throw uniError;

    const updates = [];
    const errors = [];

    for (const route of routes as TrafficRoute[]) {
      const university = (universities as University[]).find(
        (u) => u.id === route.university_id
      );

      if (!university?.latitude || !university?.longitude) {
        errors.push({ route: route.to_location, error: 'University location not found' });
        continue;
      }
      if (!route.destination_latitude || !route.destination_longitude) {
        errors.push({ route: route.to_location, error: 'Destination coordinates missing' });
        continue;
      }

      const origin = `${university.latitude},${university.longitude}`;
      const destination = `${route.destination_latitude},${route.destination_longitude}`;

      try {
        const mapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
          origin
        )}&destinations=${encodeURIComponent(
          destination
        )}&departure_time=now&mode=driving&traffic_model=best_guess&key=${googleMapsApiKey}`;

        const mapsResponse = await fetch(mapsUrl);
        const mapsData = await mapsResponse.json();

        if (mapsData.status !== 'OK') {
          errors.push({ route: route.to_location, error: `Google Maps API error: ${mapsData.status}`, detail: mapsData.error_message });
          continue;
        }

        if (
          mapsData.rows?.[0]?.elements?.[0]?.status === 'OK'
        ) {
          const element = mapsData.rows[0].elements[0];
          const durationInTraffic = element.duration_in_traffic || element.duration;
          const normalDuration = element.duration;
          const minutes = Math.ceil(durationInTraffic.value / 60);

          let status = 'Light';
          if (element.duration_in_traffic) {
            const durationRatio = durationInTraffic.value / normalDuration.value;
            if (durationRatio >= 2.0) {
              status = 'Severe';
            } else if (durationRatio >= 1.4) {
              status = 'Heavy';
            } else if (durationRatio >= 1.15) {
              status = 'Moderate';
            }
          }

          updates.push({
            route_id: route.id,
            status,
            estimated_time_minutes: minutes,
          });
        } else {
          errors.push({ route: route.to_location, error: `Route status: ${mapsData.rows?.[0]?.elements?.[0]?.status}` });
        }
      } catch (error) {
        errors.push({ route: route.to_location, error: error.message });
        console.error(`Error fetching traffic for route ${route.to_location}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (updates.length > 0) {
      await supabase.from('traffic_status').delete().neq('route_id', '00000000-0000-0000-0000-000000000000');

      const { error: insertError } = await supabase
        .from('traffic_status')
        .insert(updates);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updates.length, 
        total_routes: (routes as TrafficRoute[]).length,
        errors: errors.length > 0 ? errors : undefined 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
