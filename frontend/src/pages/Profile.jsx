import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, User, History, LogOut, ChevronRight, 
  MessageSquare, Mail, Calendar, ShieldCheck, KeyRound, ArrowLeft
} from 'lucide-react';

function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Extract a readable snippet of the JWT token
  const tokenSnippet = token 
    ? `${token.substring(0, 18)}...${token.substring(token.length - 12)}` 
    : 'No active session token';

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
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-400 hover:bg-[#181B22] hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <History className="h-4 w-4 text-brand-neon" />
              <span>Consultation History</span>
            </div>
            <ChevronRight className="h-3 w-3 text-gray-600" />
          </Link>

          <Link 
            to="/profile"
            className="flex items-center justify-between rounded-xl bg-[#181B22] px-3 py-2.5 text-xs font-semibold text-white transition-all border border-gray-800/60"
          >
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-brand-neon" />
              <span>Profile Settings</span>
            </div>
            <ChevronRight className="h-3 w-3 text-brand-neon" />
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

      {/* Profile Details Area */}
      <main className="flex-grow p-6 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link to="/chat" className="text-gray-400 hover:text-brand-neon transition-colors mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                Account Settings
              </h1>
            </div>
            <p className="text-xs text-gray-400 font-light pl-7">
              Manage your credentials, query parameters, and session JSON Web Tokens (JWT).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Box: Identity */}
            <div className="lg:col-span-7 space-y-6">
              <div className="border border-gray-800/80 bg-[#121620]/30 rounded-2xl p-6 sm:p-8 space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-3 flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-brand-neon" />
                  <span>Personal Credentials</span>
                </h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Patient Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={user?.name || 'Tirth Patel'}
                        disabled
                        className="w-full bg-[#0E121B] border border-gray-800 rounded-xl px-4 py-3 text-xs text-gray-300 font-sans font-medium"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        <User className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email || 'tirthmpatel151@gmail.com'}
                        disabled
                        className="w-full bg-[#0E121B] border border-gray-800 rounded-xl px-4 py-3 text-xs text-gray-300 font-sans font-medium"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        <Mail className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Tokens & Security status */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-gray-800/80 bg-[#121620]/30 rounded-2xl p-6 sm:p-8 space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-brand-neon" />
                  <span>Session Security</span>
                </h2>

                <div className="space-y-5">
                  <div className="flex items-center justify-between py-2 border-b border-gray-800/40">
                    <span className="text-xs text-gray-400 font-medium">Verification Status</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-green-950/50 text-green-400 border border-green-800/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-green-400" />
                      Verified Patient
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-800/40">
                    <span className="text-xs text-gray-400 font-medium">Session Provider</span>
                    <span className="text-xs font-semibold text-gray-300">Local Auth Server</span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Active JWT Token</span>
                    <div className="bg-[#0E121B] border border-gray-800 rounded-xl p-3 font-mono text-[10px] text-gray-400 flex items-center gap-2 overflow-x-auto break-all">
                      <KeyRound className="w-3.5 h-3.5 text-brand-neon shrink-0" />
                      <span className="select-all">{tokenSnippet}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

export default Profile;
