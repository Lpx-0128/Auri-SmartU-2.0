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
        JSON.stringify({ error: 'Google Maps API key not configured' }),
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

    for (const route of routes as TrafficRoute[]) {
      const university = (universities as University[]).find(
        (u) => u.id === route.university_id
      );

      if (!university?.latitude || !university?.longitude) continue;
      if (!route.destination_latitude || !route.destination_longitude) continue;

      const origin = `${university.latitude},${university.longitude}`;
      const destination = `${route.destination_latitude},${route.destination_longitude}`;

      try {
        const mapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
          origin
        )}&destinations=${encodeURIComponent(
          destination
        )}&departure_time=now&traffic_model=best_guess&key=${googleMapsApiKey}`;

        const mapsResponse = await fetch(mapsUrl);
        const mapsData = await mapsResponse.json();

        if (
          mapsData.status === 'OK' &&
          mapsData.rows?.[0]?.elements?.[0]?.status === 'OK'
        ) {
          const element = mapsData.rows[0].elements[0];
          const durationInTraffic = element.duration_in_traffic || element.duration;
          const minutes = Math.ceil(durationInTraffic.value / 60);

          let status = 'Light';
          const durationRatio = durationInTraffic.value / element.duration.value;

          if (durationRatio >= 1.5) {
            status = 'Heavy';
          } else if (durationRatio >= 1.25) {
            status = 'Moderate';
          }

          updates.push({
            route_id: route.id,
            status,
            estimated_time_minutes: minutes,
          });
        }
      } catch (error) {
        console.error(`Error fetching traffic for route ${route.id}:`, error);
      }
    }

    if (updates.length > 0) {
      await supabase.from('traffic_status').delete().neq('route_id', '00000000-0000-0000-0000-000000000000');

      const { error: insertError } = await supabase
        .from('traffic_status')
        .insert(updates);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, updated: updates.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
