import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User, Mail, Phone, Building2, Save, LogOut, Clock, RotateCcw } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  university_id: string | null;
}

interface University {
  id: string;
  name: string;
  code: string;
}

export function AccountPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    university_id: '',
  });
  const [timeOverride, setTimeOverride] = useState<string>('');

  useEffect(() => {
    fetchProfile();
    fetchUniversities();

    const saved = localStorage.getItem('timeOverride');
    if (saved) {
      setTimeOverride(saved);
    }
  }, []);

  const handleTimeOverride = (time: string) => {
    setTimeOverride(time);
    if (time) {
      localStorage.setItem('timeOverride', time);
    } else {
      localStorage.removeItem('timeOverride');
    }
  };

  const resetTime = () => {
    setTimeOverride('');
    localStorage.removeItem('timeOverride');
  };

  const fetchUniversities = async () => {
    const { data } = await supabase.from('universities').select('*').order('name');
    if (data) setUniversities(data);
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setIsAdmin(data.email === 'admin@campus.demo');
        setFormData({
          name: data.name,
          email: data.email,
          phone_number: data.phone_number,
          university_id: data.university_id || '',
        });
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    const updateData: any = {
      name: formData.name,
      email: formData.email,
      phone_number: formData.phone_number,
    };

    if (isAdmin && formData.university_id) {
      updateData.university_id = formData.university_id;
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, ...updateData });
      setEditMode(false);
      window.location.reload();
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Account</h1>
              <p className="text-blue-100 text-sm">Manage your profile information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Profile Information</h2>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditMode(false);
                      if (profile) {
                        setFormData({
                          name: profile.name,
                          email: profile.email,
                          phone_number: profile.phone_number,
                          university_id: profile.university_id || '',
                        });
                      }
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save size={18} />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center space-x-2">
                  <User size={18} />
                  <span>Full Name</span>
                </div>
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-800 font-medium">
                  {profile?.name || <span className="text-slate-400 italic">Not set - click Edit to add</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Mail size={18} />
                  <span>Email Address</span>
                </div>
              </label>
              {editMode ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your.email@university.edu"
                />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-800 font-medium">
                  {profile?.email || <span className="text-slate-400 italic">Not set</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Phone size={18} />
                  <span>Phone Number</span>
                </div>
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+60123456789"
                />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-800 font-medium">
                  {profile?.phone_number || <span className="text-slate-400 italic">Not set - click Edit to add</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Building2 size={18} />
                  <span>University</span>
                  {isAdmin && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Admin Can Change</span>}
                </div>
              </label>
              {editMode && isAdmin ? (
                <select
                  value={formData.university_id}
                  onChange={(e) => setFormData({ ...formData, university_id: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select your university</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-800 font-medium">
                  {universities.find(u => u.id === profile?.university_id)?.name || 'Not set'}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all flex items-center justify-center space-x-2"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-700">
            <div className="flex items-center space-x-3">
              <Clock className="text-yellow-400" size={24} />
              <div>
                <h3 className="text-xl font-bold text-white">Developer Tools</h3>
                <p className="text-slate-300 text-sm">Time Override for Testing Alerts</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Override Current Time
              </label>
              <div className="flex space-x-2">
                <input
                  type="time"
                  value={timeOverride}
                  onChange={(e) => handleTimeOverride(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={resetTime}
                  className="px-4 py-3 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300 transition-all flex items-center space-x-2"
                  title="Reset to Real Time"
                >
                  <RotateCcw size={18} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>How it works:</strong> Set a specific time to see how the dashboard alert system responds throughout the day. The alert on the dashboard will update based on your chosen time.
              </p>
            </div>

            {timeOverride && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Active Override:</strong> Dashboard is now showing alerts for <span className="font-bold">{timeOverride}</span>. Return to dashboard to see the prediction.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Changes to your profile will be saved to your account and reflected across all campus services.
          </p>
        </div>
      </div>
    </div>
  );
}
