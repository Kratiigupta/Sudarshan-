import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const getModel = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set in .env.local');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

const RakshaAI = ({ weather, location, disasters, isDark = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    { 
      text: "Namaste! 🙏 I am Raksha, your AI safety companion. I have access to real-time weather and global alerts to keep you safe. How can I assist you today?", 
      isBot: true,
      timestamp: new Date()
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setApiStatus('ready');
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    const userMsg = { text: userMessage, isBot: false, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let model;
      try {
        model = getModel();
      } catch (_err) {
        throw new Error('API Key not configured.');
      }

      const context = `You are Raksha AI, a specialized safety companion for travelers in India. 
Your primary goal is user safety, emergency response, and proactive travel guidance.

CURRENT LIVE DATA:
- Weather: ${weather?.temp || 'Unknown'}°C, ${weather?.condition || 'Unknown'}
- Location: ${location ? `${location.lat}, ${location.lon}` : 'Accessing GPS...'}
- Nearby Global Alerts: ${disasters?.slice(0, 3).map(d => `${d.type} in ${d.country}`).join(', ') || 'No critical alerts nearby.'}

STRICT RULES:
1. If the user is in DANGER (help, emergency, accident), provide these numbers FIRST:
   - National Emergency: 112
   - Police: 100
   - Women Helpline: 1091
2. Use the LIVE DATA provided above to give specific advice (e.g., if there's an earthquake in the disasters list, mention it).
3. Keep responses concise (under 3 sentences unless critical).
4. Do not engage in casual talk (jokes/coding). Stay professional.

User's query: ${userMessage}

Response:`;
      
      const result = await model.generateContent(context);
      const botReply = result?.response?.text();

      if (!botReply) throw new Error('No response');

      const botMsg = { text: botReply, isBot: true, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Gemini Error:", error);
      
      const errorMsg = { 
        text: "Error: Unable to process request. The AI engine is unreachable. Please verify your VITE_GEMINI_API_KEY in the environment settings or check your network connection.", 
        isBot: true, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(); 
    }
  };

  return (
    <>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-tr from-emerald-600 to-teal-600 text-white p-2.5 rounded-xl shadow-md hover:scale-105 transition-all animate-pulse flex items-center gap-2 group"
        >
          <Bot size={20} />
          <span className="font-bold text-xs uppercase tracking-wider">Ask Raksha</span>
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed bottom-[80px] right-6 z-[5500] w-[350px] sm:w-[400px] h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border ${
            isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <div className="bg-emerald-700 p-4 flex justify-between items-center text-white shrink-0 relative z-10">
            <div className="flex items-center gap-3">
              <Bot size={24} />
              <div>
                <span className="font-bold">Raksha AI</span>
                <p className="text-[10px] opacity-80">Safety & Rescue Engine</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-1 hover:bg-white/10" aria-label="Close chat">
              <X size={20} />
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.isBot
                      ? isDark
                        ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow-sm'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                      : 'bg-emerald-600 text-white shadow-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`text-[10px] animate-pulse ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Raksha is analyzing safety data...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={`p-4 border-t shrink-0 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div
              className={`flex items-center gap-2 rounded-xl p-2 ${
                isDark ? 'bg-slate-800 border border-slate-600' : 'bg-gray-100 border border-transparent'
              }`}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask something..."
                className={`flex-1 bg-transparent p-1 outline-none text-sm min-w-0 ${
                  isDark ? 'text-slate-100 placeholder:text-slate-400' : 'text-gray-900 placeholder:text-gray-500'
                }`}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="text-emerald-600 p-1 disabled:opacity-40 shrink-0"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RakshaAI;