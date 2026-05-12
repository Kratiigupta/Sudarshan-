import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Save, Camera, Loader2 } from 'lucide-react';
import { updateProfile, getProfile } from '../supabase';

const Profile = ({ user, setUser, isDark, userId }) => {
  const [formData, setFormData] = useState(user);
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch profile from Supabase on mount
  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      const { data } = await getProfile(userId);
      if (data) {
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          phone: data.phone || prev.phone,
          email: data.email || prev.email,
          dob: data.dob || prev.dob || '',
          address: data.address || prev.address || '',
          avatar: data.avatar_url || prev.avatar,
        }));
      }
    };
    fetchProfile();
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData({ ...formData, avatar: imageUrl });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Save to Supabase if userId exists
    if (userId) {
      await updateProfile(userId, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        dob: formData.dob || null,
        address: formData.address || null,
      });
    }

    setUser(formData);
    localStorage.setItem('sudarshan_user', JSON.stringify(formData));
    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      <div className={`p-6 rounded-3xl shadow-sm border flex justify-between items-center flex-wrap gap-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-blue-900 text-white rounded-full flex items-center justify-center text-3xl font-black shadow-inner overflow-hidden border-4 border-gray-50">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials(formData.name)
              )}
            </div>
            <input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg hover:bg-indigo-700 transition cursor-pointer">
              <Camera size={14} />
            </label>
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>My Profile</h2>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Manage your personal details and Digital ID.</p>
          </div>
        </div>
        {showSaved && <span className="bg-green-100 text-green-700 border border-green-300 px-4 py-2 rounded-xl font-bold text-sm animate-pulse">Saved Successfully! ✅</span>}
      </div>

      <div className={`rounded-3xl shadow-sm border p-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}><User size={16}/> Full Name</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-bold ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200 text-gray-800'}`} />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}><Phone size={16}/> Phone Number</label>
              <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} required className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-bold ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200 text-gray-800'}`} />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}><Mail size={16}/> Email Address</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-bold ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200 text-gray-800'}`} />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}><Calendar size={16}/> Date of Birth</label>
              <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-bold ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200 text-gray-800'}`} />
            </div>
          </div>
          <div>
            <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}><MapPin size={16}/> Residential Address</label>
            <textarea name="address" value={formData.address || ''} onChange={handleChange} rows="2" className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-bold ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200 text-gray-800'}`}></textarea>
          </div>

          <button type="submit" disabled={isSaving} className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 ml-auto disabled:opacity-70">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;