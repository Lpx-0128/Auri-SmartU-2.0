import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, MapPin, Clock, Navigation, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

interface TrafficRoute {
  id: string;
  route_name: string;
  from_location: string;
  to_location: string;
  destination_latitude: number | null;
  destination_longitude: number | null;
  university_id: string | null;
  status?: string;
  estimated_time_minutes?: number;
  traffic_level?: 'low' | 'moderate' | 'heavy' | 'severe';
}

interface University {
  name?: string;
  latitude: string | number | null;
  longitude: string | number | null;
}

export function TrafficStatusPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<TrafficRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userUniversity, setUserUniversity] = useState<University | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchTrafficData();
    updateLiveTrafficData();
    const dataInterval = setInterval(fetchTrafficData, 30000);
    const updateInterval = setInterval(updateLiveTrafficData, 300000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(updateInterval);
    };
  }, []);

  const fetchTrafficData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('university_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.university_id) {
        const { data: uniData } = await supabase
          .from('universities')
          .select('name, latitude, longitude')
          .eq('id', profile.university_id)
          .maybeSingle();

        setUserUniversity(uniData);

        const { data: routesData } = await supabase
          .from('traffic_routes')
          .select('*')
          .eq('university_id', profile.university_id);

        const { data: trafficData } = await supabase
          .from('traffic_status')
          .select('*');

        if (routesData && trafficData) {
          const combined = routesData.map((route) => {
            const traffic = trafficData.find((t) => t.route_id === route.id);
            return {
              ...route,
              status: traffic?.status || 'unknown',
              estimated_time_minutes: traffic?.estimated_time_minutes || 0,
              traffic_level: mapStatusToLevel(traffic?.status || 'unknown'),
            };
          });
          setRoutes(combined);
        } else if (routesData) {
          setRoutes(routesData.map(route => ({
            ...route,
            traffic_level: 'low' as const,
            estimated_time_minutes: 0
          })));
        }
      }
    }
    setLoading(false);
  };

  const updateLiveTrafficData = async () => {
    try {
      setRefreshing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-traffic-data`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('Traffic data updated successfully');
        setLastUpdated(new Date());
        await fetchTrafficData();
      }
    } catch (error) {
      console.error('Error updating live traffic data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const mapStatusToLevel = (status: string): 'low' | 'moderate' | 'heavy' | 'severe' => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('light') || lowerStatus.includes('smooth')) return 'low';
    if (lowerStatus.includes('moderate')) return 'moderate';
    if (lowerStatus.includes('heavy')) return 'heavy';
    if (lowerStatus.includes('severe') || lowerStatus.includes('congestion')) return 'severe';
    return 'low';
  };

  const openInGoogleMaps = (route: TrafficRoute) => {
    if (!route.destination_latitude || !route.destination_longitude) {
      alert('Location coordinates not available for this destination');
      return;
    }

    if (!userUniversity?.latitude || !userUniversity?.longitude) {
      alert('University location not available');
      return;
    }

    const originLat = typeof userUniversity.latitude === 'string' ? parseFloat(userUniversity.latitude) : userUniversity.latitude;
    const originLng = typeof userUniversity.longitude === 'string' ? parseFloat(userUniversity.longitude) : userUniversity.longitude;
    const destLat = typeof route.destination_latitude === 'string' ? parseFloat(route.destination_latitude) : route.destination_latitude;
    const destLng = typeof route.destination_longitude === 'string' ? parseFloat(route.destination_longitude) : route.destination_longitude;

    console.log('Origin:', { lat: originLat, lng: originLng });
    console.log('Destination:', { lat: destLat, lng: destLng });
    console.log('Route:', route);

    const origin = `${originLat},${originLng}`;
    const destination = `${destLat},${destLng}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

    console.log('Maps URL:', mapsUrl);
    window.open(mapsUrl, '_blank');
  };

  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'heavy':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'severe':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  const getTrafficIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <TrendingUp className="text-green-600" size={20} />;
      case 'moderate':
        return <Clock className="text-yellow-600" size={20} />;
      case 'heavy':
        return <AlertTriangle className="text-orange-600" size={20} />;
      case 'severe':
        return <AlertTriangle className="text-red-600" size={20} />;
      default:
        return <Navigation className="text-slate-600" size={20} />;
    }
  };

  const getTrafficBadge = (level: string) => {
    switch (level) {
      case 'low':
        return { text: 'Light Traffic', color: 'bg-green-500' };
      case 'moderate':
        return { text: 'Moderate Traffic', color: 'bg-yellow-500' };
      case 'heavy':
        return { text: 'Heavy Traffic', color: 'bg-orange-500' };
      case 'severe':
        return { text: 'Severe Congestion', color: 'bg-red-500' };
      default:
        return { text: 'Unknown', color: 'bg-slate-500' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white shadow-xl">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Traffic Status</h1>
            <p className="text-blue-100">Real-time traffic conditions and ETA to popular destinations</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Live Traffic Updates</span>
              </h2>
              {userUniversity?.name && (
                <p className="text-sm text-slate-600 mt-2 ml-4">
                  Starting from: <span className="font-semibold text-blue-600">{userUniversity.name}</span>
                </p>
              )}
            </div>
            <button
              onClick={updateLiveTrafficData}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Updating...' : 'Refresh Live Data'}</span>
            </button>
          </div>
          {lastUpdated && (
            <div className="mb-4 text-sm text-slate-600">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          <div className="space-y-3">
            {routes.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>No traffic data available</p>
              </div>
            )}
            {routes.map((route) => {
              const badge = route.traffic_level ? getTrafficBadge(route.traffic_level) : { text: 'No Data', color: 'bg-slate-500' };
              return (
                <div
                  key={route.id}
                  onClick={() => openInGoogleMaps(route)}
                  className={`rounded-xl border-2 p-4 transition-all hover:shadow-lg cursor-pointer ${
                    route.traffic_level ? getTrafficColor(route.traffic_level) : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-white/80 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="text-blue-600" size={20} />
                      </div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-bold">{route.route_name}:</h3>
                        {route.estimated_time_minutes > 0 ? (
                          <>
                            <span className="text-lg font-bold">{route.estimated_time_minutes} min</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${badge.color} text-white`}>
                              {badge.text}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-500">No data available</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {route.traffic_level && getTrafficIcon(route.traffic_level)}
                      <Navigation className="text-blue-600" size={20} />
                    </div>
                  </div>
                  <div className="mt-2 ml-14 text-sm text-slate-600">
                    {route.from_location} → {route.to_location}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">Traffic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
              <div>
                <span className="font-semibold">Light Traffic:</span> Smooth flow, minimal delays
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1"></div>
              <div>
                <span className="font-semibold">Moderate Traffic:</span> Some slowdowns expected
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full mt-1"></div>
              <div>
                <span className="font-semibold">Heavy Traffic:</span> Significant delays likely
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
              <div>
                <span className="font-semibold">Severe Congestion:</span> Major delays, consider alternatives
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 text-xs text-blue-700">
            <span className="font-semibold">Live Updates:</span> Traffic data fetched from Google Maps every 5 minutes · Display refreshes every 30 seconds · Click any destination for turn-by-turn directions
          </div>
        </div>
      </div>
    </div>
  );
}
