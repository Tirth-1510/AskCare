import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, User, History as HistoryIcon, LogOut, ChevronRight, 
  MessageSquare, Sparkles, Calendar, ArrowLeft, Filter, Trash2
} from 'lucide-react';

function History() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState([
    {
      id: 'cons-1',
      query: 'Fasting blood glucose readings are consistently 145mg/dL. Is this diabetic pre-stage?',
      category: 'Endocrinology',
      date: '2026-07-12',
      status: 'Resolved',
      modelUsed: 'BioSLM-Instruct (3B)',
    },
    {
      id: 'cons-2',
      query: 'Dull ache in neck and left arm during cardio session. Should I pause work?',
      category: 'Cardiology',
      date: '2026-07-10',
      status: 'Urgent Referral',
      modelUsed: 'CareSLM-Clinical (7B)',
    },
    {
      id: 'cons-3',
      query: 'Dosage recommendations for 500mg paracetamol in 8-year-old child weighing 25kg.',
      category: 'Pediatrics',
      date: '2026-07-05',
      status: 'Resolved',
      modelUsed: 'BioSLM-Instruct (3B)',
    },
    {
      id: 'cons-4',
      query: 'Fever of 101.5 F persisting for 48 hours. No other severe symptoms.',
      category: 'General Practice',
      date: '2026-07-02',
      status: 'Resolved',
      modelUsed: 'CareSLM-Clinical (7B)',
    }
  ]);

  const [filter, setFilter] = useState('All');

  const filteredConsultations = filter === 'All' 
    ? consultations 
    : consultations.filter(c => c.status === filter);

  const handleDelete = (id) => {
    setConsultations(prev => prev.filter(c => c.id !== id));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-white flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#0E121B] border-b md:border-b-0 md:border-r border-gray-800/80 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800/80">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-neon/10 border border-brand-neon/30 text-brand-neon group-hover:scale-105 transition-transform duration-200 shadow-sm shadow-brand-neon/20">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-sm font-extrabold tracking-wide text-white">
              AskCare <span className="text-gray-500 font-light">AI Chat</span>
            </span>
          </Link>
        </div>

        <div className="p-4 border-b border-gray-800/80 flex items-center gap-3 bg-[#131824]/40">
          <div className="h-10 w-10 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon">
            <User className="h-5 w-5" />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-white truncate">{user?.name || 'Patient'}</h4>
            <p className="text-[10px] text-gray-500 truncate">{user?.email || 'patient@askcare.ai'}</p>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-1">
          <Link 
            to="/chat"
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-400 hover:bg-[#181B22] hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-brand-neon" />
              <span>Back to Chat</span>
            </div>
            <ChevronRight className="h-3 w-3 text-gray-600" />
          </Link>
          
          <Link 
            to="/history"
            className="flex items-center justify-between rounded-xl bg-[#181B22] px-3 py-2.5 text-xs font-semibold text-white transition-all border border-gray-800/60"
          >
            <div className="flex items-center gap-3">
              <HistoryIcon className="h-4 w-4 text-brand-neon" />
              <span>Consultation History</span>
            </div>
            <ChevronRight className="h-3 w-3 text-brand-neon" />
          </Link>

          <Link 
            to="/profile"
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-400 hover:bg-[#181B22] hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-brand-neon" />
              <span>Profile Settings</span>
            </div>
            <ChevronRight className="h-3 w-3 text-gray-600" />
          </Link>
          
          <Link 
            to="/"
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-400 hover:bg-[#181B22] hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-brand-neon" />
              <span>Go to Public Home</span>
            </div>
            <ChevronRight className="h-3 w-3 text-gray-600" />
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800/80">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full text-xs font-extrabold text-black bg-brand-neon rounded-xl py-3 transition-all font-sans cursor-pointer shadow-md shadow-brand-neon/5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* History content */}
      <main className="flex-grow p-6 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link to="/chat" className="text-gray-400 hover:text-brand-neon transition-colors mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                  Consultation History
                </h1>
              </div>
              <p className="text-xs text-gray-400 font-light pl-7">
                Access, review, or clean up your past interactions with the local Small Language Model.
              </p>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-center pl-7 sm:pl-0 bg-[#0E121B] p-1 border border-gray-800 rounded-xl">
              {['All', 'Resolved', 'Urgent Referral'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => setFilter(btn)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    filter === btn 
                      ? 'bg-brand-neon text-black' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>

          {/* Consultation List */}
          <div className="space-y-4">
            {filteredConsultations.length === 0 ? (
              <div className="border border-gray-800/80 bg-[#121620]/30 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <Filter className="h-10 w-10 text-gray-600 mb-4" />
                <p className="text-sm font-semibold text-gray-400">No consultation records match the filter.</p>
                <button onClick={() => setFilter('All')} className="text-xs text-brand-neon font-semibold hover:underline mt-2 cursor-pointer">
                  Show all records
                </button>
              </div>
            ) : (
              filteredConsultations.map((cons) => (
                <div 
                  key={cons.id}
                  className="border border-gray-800/85 hover:border-gray-700 bg-gradient-to-r from-[#11141D] to-[#0E121B]/40 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:scale-[1.005] group"
                >
                  <div className="space-y-3 max-w-3xl">
                    {/* Categories and details */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-neon/10 text-brand-neon border border-brand-neon/20">
                        {cons.category}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                        cons.status === 'Resolved' 
                          ? 'bg-green-950/50 text-green-400 border border-green-800/30' 
                          : 'bg-red-950/50 text-red-400 border border-red-800/30'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${cons.status === 'Resolved' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        {cons.status}
                      </span>
                    </div>

                    {/* Query */}
                    <h3 className="text-sm font-medium leading-relaxed text-gray-200">
                      "{cons.query}"
                    </h3>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-brand-neon" />
                        {cons.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-brand-neon" />
                        Processed with: <span className="text-gray-400">{cons.modelUsed}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                      onClick={() => navigate('/chat', { state: { initialQuery: cons.query } })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#181B22] border border-gray-800 hover:border-brand-neon/30 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-brand-neon" />
                      <span>Re-Query</span>
                    </button>
                    <button
                      onClick={() => handleDelete(cons.id)}
                      className="p-2 border border-gray-800 hover:border-red-500/30 text-gray-500 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                      title="Delete consult"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default History;
