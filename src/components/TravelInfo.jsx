import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Building, Save, ArrowRight, Loader2, Hotel, Car, Train, CheckCircle2 } from 'lucide-react';
import { getItinerary, upsertItinerary, createBooking, getUserBookings } from '../supabase';

const TravelInfo = ({ itinerary, setItinerary, isDark, userId }) => {
  const [activeTab, setActiveTab] = useState('itinerary');
  const [formData, setFormData] = useState(itinerary);
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Bookings State
  const [myBookings, setMyBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // New Booking Form State
  const [bookingType, setBookingType] = useState('hotel');
  const [bookingForm, setBookingForm] = useState({ name: '', date: '', guests: 1, extra: '' });

  // Load itinerary & bookings from Supabase
  useEffect(() => {
    if (!userId) return;
    
    const loadData = async () => {
      // Load Itinerary
      const { data: itData } = await getItinerary(userId);
      if (itData) {
        const mapped = {
          source: itData.source || '',
          dest: itData.destination || '',
          startDate: itData.start_date || '',
          endDate: itData.end_date || '',
          people: itData.total_people || '',
          hotel: itData.hotel || '',
        };
        setFormData(mapped);
        setItinerary(mapped);
      }

      // Load Bookings
      fetchBookings();
    };
    
    loadData();
  }, [userId]);

  const fetchBookings = async () => {
    if (!userId) return;
    const { data } = await getUserBookings(userId);
    if (data) setMyBookings(data);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBookingChange = (e) => {
    setBookingForm({ ...bookingForm, [e.target.name]: e.target.value });
  };

  const handleSaveItinerary = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    if (userId) {
      await upsertItinerary(userId, {
        source: formData.source,
        destination: formData.dest,
        start_date: formData.startDate,
        end_date: formData.endDate,
        total_people: parseInt(formData.people) || 1,
        hotel: formData.hotel,
      });
    }
    setItinerary(formData);
    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("Please login to make a booking.");
      return;
    }
    setBookingLoading(true);
    
    const details = {
      ...bookingForm,
      type: bookingType,
      bookedAt: new Date().toISOString()
    };
    
    const { error } = await createBooking(userId, bookingType, details);
    
    if (!error) {
      alert(`✅ ${bookingType.toUpperCase()} Booking Confirmed!`);
      setBookingForm({ name: '', date: '', guests: 1, extra: '' });
      fetchBookings();
      setActiveTab('my_bookings');
    } else {
      alert("Booking failed: " + error.message);
    }
    setBookingLoading(false);
  };

  return (
    <div className={`max-w-5xl mx-auto rounded-3xl shadow-sm border overflow-hidden animate-fade-in ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      <div className="bg-blue-900 p-6 text-white flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <MapPin size={28} className="text-blue-300" />
          <div>
            <h2 className="text-2xl font-black tracking-wider">Travel & Bookings</h2>
            <p className="text-blue-200 text-sm">Manage your journey and reservations</p>
          </div>
        </div>
        {showSaved && <span className="bg-green-500 text-white border border-green-400 px-4 py-2 rounded-xl font-bold text-sm animate-pulse">Saved Successfully! ✅</span>}
      </div>

      <div className={`flex border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
        <button onClick={() => setActiveTab('itinerary')} className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'itinerary' ? 'border-b-4 border-blue-600 text-blue-600' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800')}`}>Plan Itinerary</button>
        <button onClick={() => setActiveTab('book')} className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'book' ? 'border-b-4 border-blue-600 text-blue-600' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800')}`}>New Booking</button>
        <button onClick={() => setActiveTab('my_bookings')} className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'my_bookings' ? 'border-b-4 border-blue-600 text-blue-600' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800')}`}>My Bookings ({myBookings.length})</button>
      </div>

      {activeTab === 'itinerary' && (
        <form onSubmit={handleSaveItinerary} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div>
              <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Source (From)</label>
              <input type="text" name="source" value={formData.source} onChange={handleChange} required className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
            </div>
            <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 translate-y-2 text-gray-300">
              <ArrowRight size={24} />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Destination (To)</label>
              <input type="text" name="dest" value={formData.dest} onChange={handleChange} required className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}><Calendar size={16}/> Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}><Calendar size={16}/> End Date</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}><Users size={16}/> Total People</label>
              <input type="number" name="people" value={formData.people} onChange={handleChange} min="1" required className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}><Building size={16}/> Default Hotel Name</label>
            <input type="text" name="hotel" value={formData.hotel} onChange={handleChange} required className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
          </div>

          <button type="submit" disabled={isSaving} className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 ml-auto disabled:opacity-70">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Itinerary
          </button>
        </form>
      )}

      {activeTab === 'book' && (
        <div className="p-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button onClick={() => setBookingType('hotel')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${bookingType === 'hotel' ? 'border-blue-600 bg-blue-50 text-blue-700' : (isDark ? 'border-slate-600 hover:bg-slate-700 text-white' : 'border-gray-200 hover:bg-gray-50')}`}>
              <Hotel size={32} /> <span className="font-bold">Hotel</span>
            </button>
            <button onClick={() => setBookingType('cab')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${bookingType === 'cab' ? 'border-blue-600 bg-blue-50 text-blue-700' : (isDark ? 'border-slate-600 hover:bg-slate-700 text-white' : 'border-gray-200 hover:bg-gray-50')}`}>
              <Car size={32} /> <span className="font-bold">Cab/Taxi</span>
            </button>
            <button onClick={() => setBookingType('train_bus')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${bookingType === 'train_bus' ? 'border-blue-600 bg-blue-50 text-blue-700' : (isDark ? 'border-slate-600 hover:bg-slate-700 text-white' : 'border-gray-200 hover:bg-gray-50')}`}>
              <Train size={32} /> <span className="font-bold">Train/Bus</span>
            </button>
          </div>

          <form onSubmit={handleCreateBooking} className="space-y-6">
            <div>
              <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {bookingType === 'hotel' ? 'Select Hotel' : bookingType === 'cab' ? 'Pickup Location' : 'Source & Destination'}
              </label>
              <input type="text" name="name" value={bookingForm.name} onChange={handleBookingChange} required placeholder={bookingType === 'hotel' ? 'e.g., The Taj Palace' : 'Enter location details...'} className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Date</label>
                <input type="date" name="date" value={bookingForm.date} onChange={handleBookingChange} required className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Passengers / Guests</label>
                <input type="number" name="guests" min="1" value={bookingForm.guests} onChange={handleBookingChange} required className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
              </div>
            </div>
            
            <button type="submit" disabled={bookingLoading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
              {bookingLoading ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />} Confirm {bookingType.toUpperCase()} Booking
            </button>
          </form>
        </div>
      )}

      {activeTab === 'my_bookings' && (
        <div className="p-8">
          {myBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">🎫</div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>No active bookings</h3>
              <p className={isDark ? 'text-slate-500' : 'text-gray-400'}>Your confirmed reservations will appear here.</p>
              <button onClick={() => setActiveTab('book')} className="mt-6 px-6 py-2 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 transition">Book Now</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myBookings.map((b) => (
                <div key={b.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-black uppercase rounded-lg">
                      {b.booking_type.replace('_', ' ')}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black uppercase rounded-lg flex items-center gap-1">
                      <CheckCircle2 size={12}/> Confirmed
                    </span>
                  </div>
                  <h4 className={`font-black text-lg mb-1 truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{b.details.name}</h4>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}><Calendar size={14} className="inline mr-1"/> {b.details.date}</p>
                  <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}><Users size={14} className="inline mr-1"/> {b.details.guests} People</p>
                  <p className={`text-[10px] font-mono text-gray-400 mt-4 pt-2 border-t ${isDark ? 'border-slate-600' : 'border-gray-200'}`}>ID: {b.id}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TravelInfo;