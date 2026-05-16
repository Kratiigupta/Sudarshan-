import React, { useState, useEffect } from 'react';
import { Phone, User, Shield, Plus, Trash2, Activity, X, Loader2 } from 'lucide-react';
import { addEmergencyContact, getEmergencyContacts, deleteEmergencyContact } from '../supabase';

const EmergencyContacts = ({ isDark, userId }) => {
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', tracking: true });
  const [isLoading, setIsLoading] = useState(false);

  // Load contacts from Supabase
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setIsLoading(true);
      const { data } = await getEmergencyContacts(userId);
      if (data) setContacts(data);
      setIsLoading(false);
    };
    load();
  }, [userId]);

  const handleDelete = async (contactId) => {
    if (userId) {
      await deleteEmergencyContact(contactId);
    }
    setContacts(contacts.filter(c => c.id !== contactId));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (contacts.length >= 5) return;
    
    if (userId) {
      const { data } = await addEmergencyContact(userId, {
        name: newContact.name,
        phone: newContact.phone,
        email: newContact.email,
        tracking: newContact.tracking,
      });
      if (data) {
        setContacts([data, ...contacts]);
      }
    } else {
      setContacts([{ ...newContact, id: Date.now() }, ...contacts]);
    }
    
    setNewContact({ name: '', phone: '', email: '', tracking: true });
    setShowAddForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative pb-10">
      
      <div className={`rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 ${isDark ? 'bg-indigo-900/30 border-2 border-indigo-700' : 'bg-indigo-50 border-2 border-indigo-200'}`}>
        <div className="flex items-center gap-3">
          <Activity size={28} className="text-indigo-600 animate-pulse" />
          <div>
            <h3 className={`font-black ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>Live Tracking Sharing</h3>
            <p className={`text-sm font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>Opt-in to share your real-time GPS with selected contacts.</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" defaultChecked />
          <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div className={`rounded-3xl shadow-sm border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="bg-red-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-red-200" />
            <div>
              <h2 className="text-2xl font-black tracking-wider">Emergency Contacts</h2>
              <p className="text-red-100 text-sm">Authorities will contact them in case of an SOS.</p>
            </div>
          </div>
          <span className="bg-red-800 px-3 py-1 rounded-full text-xs font-bold">{contacts.length}/5 Added</span>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 rounded-2xl transition ${isDark ? 'border-slate-600 hover:border-red-700' : 'border-gray-100 hover:border-red-100'}`}>
                  <div className="flex items-center gap-4 mb-3 sm:mb-0">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                      <User size={24} />
                    </div>
                    <div>
                      <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{contact.name}</h4>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <p className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}><Phone size={12}/> {contact.phone}</p>
                        {contact.email && <p className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>📧 {contact.email}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {contact.tracking && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">Tracking ON</span>}
                    <button onClick={() => handleDelete(contact.id)} className="text-gray-400 hover:text-red-600 transition p-2"><Trash2 size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showAddForm && contacts.length < 5 && (
            <button 
              onClick={() => setShowAddForm(true)}
              className={`w-full mt-6 py-4 border-2 border-dashed rounded-2xl font-bold flex justify-center items-center gap-2 transition ${isDark ? 'border-slate-600 text-slate-400 hover:border-red-500 hover:text-red-400' : 'border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50'}`}
            >
              <Plus size={20} /> Add New Contact
            </button>
          )}

          {showAddForm && (
            <form onSubmit={handleAddSubmit} className={`mt-6 p-5 rounded-2xl border animate-fade-in ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h4 className={`font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>New Trusted Contact</h4>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input 
                  type="text" required placeholder="Full Name (e.g. Amit Kumar)" 
                  value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})}
                  className={`w-full border-2 rounded-xl p-3 focus:border-red-500 outline-none font-medium ${isDark ? 'bg-slate-600 border-slate-500 text-white' : 'border-gray-200'}`} 
                />
                <input 
                  type="tel" required placeholder="Phone Number" 
                  value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})}
                  className={`w-full border-2 rounded-xl p-3 focus:border-red-500 outline-none font-medium ${isDark ? 'bg-slate-600 border-slate-500 text-white' : 'border-gray-200'}`} 
                />
              </div>
              <div className="mb-4">
                <input 
                  type="email" required placeholder="Email Address (Gmail etc.)" 
                  value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})}
                  className={`w-full border-2 rounded-xl p-3 focus:border-red-500 outline-none font-medium ${isDark ? 'bg-slate-600 border-slate-500 text-white' : 'border-gray-200'}`} 
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <input 
                  type="checkbox" id="trackBox" 
                  checked={newContact.tracking} onChange={e => setNewContact({...newContact, tracking: e.target.checked})}
                  className="w-5 h-5 accent-red-600"
                />
                <label htmlFor="trackBox" className={`text-sm font-bold cursor-pointer ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Enable live location sharing for this contact</label>
              </div>
              <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition">Save Contact</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;