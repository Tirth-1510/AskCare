import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, User, History, LogOut, Activity,
  MessageSquare, AlertCircle, Plus, Menu, X,
  ChevronLeft, PanelLeftClose, PanelLeftOpen, Trash2, Edit3, Check, Trash
} from 'lucide-react';

function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  // States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Default welcome text generator
  const getWelcomeMessage = (userName) => ({
    id: 'welcome-' + Date.now(),
    sender: 'ai',
    text: `Hello ${userName || 'there'}! I am AskCare, your SLM-powered clinical query resolution assistant. What symptoms or medical questions can I clarify for you today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  // Conversations State
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('askcare_chats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse chats', e);
      }
    }
    return [
      {
        id: 'chat-1',
        title: 'Initial Consultation',
        messages: [getWelcomeMessage(user?.name)]
      }
    ];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const savedActive = localStorage.getItem('askcare_active_chat');
    return savedActive || 'chat-1';
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('askcare_chats', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('askcare_active_chat', activeChatId);
  }, [activeChatId]);

  // Autoscroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeChatId, isTyping]);

  // Helper: Get active chat object
  const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0] || { id: '', title: '', messages: [] };

  // 1. Create a New Chat
  const handleNewChat = () => {
    const newId = 'chat-' + Date.now();
    const newChatObj = {
      id: newId,
      title: 'New Consultation',
      messages: [getWelcomeMessage(user?.name)]
    };
    setConversations(prev => [newChatObj, ...prev]);
    setActiveChatId(newId);
    setMobileSidebarOpen(false);
  };

  // 2. Delete a Chat
  const handleDeleteChat = (idToDelete, e) => {
    e.stopPropagation(); // Prevent setting as active

    // Don't delete last chat completely; just reset it or create a new one
    if (conversations.length === 1) {
      const newId = 'chat-' + Date.now();
      setConversations([
        {
          id: newId,
          title: 'Initial Consultation',
          messages: [getWelcomeMessage(user?.name)]
        }
      ]);
      setActiveChatId(newId);
      return;
    }

    const filtered = conversations.filter(c => c.id !== idToDelete);
    setConversations(filtered);

    // If active chat is deleted, switch active chat
    if (activeChatId === idToDelete) {
      setActiveChatId(filtered[0].id);
    }
  };

  // 3. Start Rename Chat
  const startRenameChat = (chat, e) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  // 4. Save Chat Rename
  const saveRenameChat = (idToRename, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      setConversations(prev => prev.map(c => {
        if (c.id === idToRename) {
          return { ...c, title: editTitle.trim() };
        }
        return c;
      }));
    }
    setEditingChatId(null);
  };

  // 5. Send Message Logic
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userQuery = input.trim();
    setInput('');
    setIsTyping(true);

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update active chat's messages
    setConversations(prev => prev.map(c => {
      if (c.id === activeChatId) {
        // If it's a default/new title, auto-rename based on first user query
        const isDefaultTitle = c.title === 'New Consultation' || c.title === 'Initial Consultation';
        const updatedTitle = isDefaultTitle
          ? (userQuery.length > 25 ? userQuery.substring(0, 22) + '...' : userQuery)
          : c.title;

        return {
          ...c,
          title: updatedTitle,
          messages: [...c.messages, userMsg]
        };
      }
      return c;
    }));

    // Simulate clinical SLM response stream
    setTimeout(() => {
      setIsTyping(false);

      let aiResponseText = '';
      const lowercaseQuery = userQuery.toLowerCase();

      if (lowercaseQuery.includes('diabetes')) {
        aiResponseText = "Diabetes is a chronic metabolic condition characterized by elevated blood glucose levels. Typically, it arises either because the pancreas does not produce enough insulin (Type 1) or because cells become resistant to insulin (Type 2). Key symptoms include frequent urination, extreme thirst, and unexplained weight loss. We recommend tracking fasting blood sugar levels and consulting a physician for custom care.";
      } else if (lowercaseQuery.includes('pressure') || lowercaseQuery.includes('hypertension') || lowercaseQuery.includes('bp')) {
        aiResponseText = "Hypertension, or high blood pressure, refers to arterial pressures consistently exceeding 130/80 mmHg. It is often referred to as a 'silent killer' because it seldom displays overt symptoms until advanced stages. To manage it, reduce daily sodium intake to below 2,000 mg, engage in moderate cardiovascular exercise, and monitor readings twice daily.";
      } else if (lowercaseQuery.includes('fever')) {
        aiResponseText = "A fever indicates your body's immune system is responding to an infection. For adults, a mild fever (under 101°F / 38.3°C) usually does not require treatment unless uncomfortable. Rest and hydration are primary. If the fever exceeds 103°F (39.4°C), lasts more than 3 days, or is accompanied by severe head/neck aches, seek immediate professional evaluation.";
      } else {
        aiResponseText = `Thank you for your inquiry about "${userQuery}". As a clinical assistant running on a local Small Language Model (SLM), I have processed your input. Please maintain hydration, monitor physical symptoms, and speak with a licensed clinician for a formal diagnosis. Let me know if you would like me to detail standard clinical guidelines for similar presentations.`;
      }

      const aiMsg = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: [...c.messages, aiMsg]
          };
        }
        return c;
      }));
    }, 1600);
  };

  const handleLogout = () => {
    navigate('/', { state: { logout: true }, replace: true });
  };

  // Render standard sidebar content
  const renderSidebarContent = () => (
    <div className="h-full flex flex-col justify-between text-white">
      {/* Top Header */}
      <div className="p-4 border-b border-gray-800/80 shrink-0">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-neon/10 border border-brand-neon/30 text-brand-neon group-hover:scale-105 transition-transform duration-200">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-sm font-extrabold tracking-wide text-white font-sans">
              AskCare <span className="text-gray-500 font-light font-sans">Chat</span>
            </span>
          </Link>
          {/* Collapse sidebar on desktop */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white cursor-pointer"
          >
            <PanelLeftClose className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 py-3 shrink-0">
        <button
          onClick={handleNewChat}
          className="flex items-center justify-center gap-2 w-full bg-[#181B22] border border-gray-800 hover:border-brand-neon/40 text-xs font-bold text-white rounded-xl py-3 hover:bg-[#20232C] hover:text-brand-neon transition-all cursor-pointer shadow-md"
        >
          <Plus className="h-4.5 w-4.5 text-brand-neon" />
          <span>New Consultation</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-grow overflow-y-auto px-2 py-2 space-y-1 select-none">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2 font-sans">
          Recent Chats
        </div>

        {conversations.map(chat => {
          const isActive = chat.id === activeChatId;
          const isEditing = chat.id === editingChatId;

          return (
            <div
              key={chat.id}
              onClick={() => {
                setActiveChatId(chat.id);
                setMobileSidebarOpen(false);
              }}
              className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer transition-all ${isActive
                ? 'bg-brand-neon/15 text-brand-neon border border-brand-neon/20'
                : 'text-gray-400 hover:bg-[#181B22]/70 hover:text-white border border-transparent'
                }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-neon' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRenameChat(chat.id, e);
                      if (e.key === 'Escape') setEditingChatId(null);
                    }}
                    className="w-full bg-[#0B0E14] border border-brand-neon text-white rounded px-1.5 py-0.5 text-xs focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="truncate pr-2 font-sans font-medium">{chat.title}</span>
                )}
              </div>

              {/* Action Buttons */}
              {!isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => startRenameChat(chat, e)}
                    className="p-1 hover:bg-gray-800 text-gray-500 hover:text-gray-200 rounded cursor-pointer"
                    title="Rename conversation"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="p-1 hover:bg-red-950/80 text-gray-500 hover:text-red-400 rounded cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash className="h-3 w-3" />
                  </button>
                </div>
              )}

              {isEditing && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => saveRenameChat(chat.id, e)}
                    className="p-1 bg-brand-neon/20 hover:bg-brand-neon/30 text-brand-neon rounded cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Info & Static Page Links & Logout */}
      <div className="p-4 border-t border-gray-800/80 shrink-0 bg-[#0E121B]">
        {/* User Card */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon">
            <User className="h-4.5 w-4.5" />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-white truncate font-sans">{user?.name || 'Patient'}</h4>
            <p className="text-[10px] text-gray-500 truncate font-sans">{user?.email || 'patient@askcare.ai'}</p>
          </div>
        </div>

        {/* Secondary Links */}
        <div className="space-y-1 mb-4">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 text-xs text-gray-400 hover:text-white py-1.5 px-2 rounded-lg hover:bg-gray-800/40 transition-colors"
          >
            <User className="h-3.5 w-3.5 text-brand-neon" />
            <span className="font-sans">Profile Settings</span>
          </Link>
          <Link
            to="/history"
            className="flex items-center gap-2.5 text-xs text-gray-400 hover:text-white py-1.5 px-2 rounded-lg hover:bg-gray-800/40 transition-colors"
          >
            <History className="h-3.5 w-3.5 text-brand-neon" />
            <span className="font-sans">Consultation History</span>
          </Link>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full text-xs font-bold text-black bg-brand-neon hover:bg-[#c6f000] active:scale-[0.98] rounded-xl py-2.5 transition-all font-sans cursor-pointer shadow"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-white flex font-sans overflow-hidden relative">

      {/* 1. DESKTOP SIDEBAR (Collapsible) */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="hidden md:flex flex-col h-screen bg-[#07090D] border-r border-gray-900 shrink-0 overflow-hidden"
          >
            {renderSidebarContent()}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 2. MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#07090D] md:hidden border-r border-gray-900"
            >
              {renderSidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. MAIN CHAT CONTAINER */}
      <main className="flex-grow h-screen flex flex-col min-w-0 bg-[#0B0E14]">

        {/* Chat Window Header */}
        <header className="h-16 border-b border-gray-900 px-4 md:px-6 flex items-center justify-between bg-[#0E121B]/40 backdrop-blur-sm z-30 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Burger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Expand Toggle */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white cursor-pointer mr-2"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="h-4.5 w-4.5" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
                AskCare SLM Engine v1.0.2
              </span>
            </div>
          </div>

          <div className="text-[9px] md:text-[10px] text-gray-500 font-medium font-sans">
            Clinical Guidance System
          </div>
        </header>

        {/* Message Window Area */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-5 bg-[#0B0E14] relative z-10">
          <div className="max-w-4xl mx-auto space-y-5">
            <AnimatePresence initial={false}>
              {activeChat.messages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex w-full ${!isAI ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm font-sans leading-relaxed shadow-lg relative ${!isAI
                      ? 'bg-[#201947] text-white border border-[#4c3cc2]/20 rounded-tr-none'
                      : 'bg-[#11141C] text-gray-200 border border-gray-800/80 rounded-tl-none'
                      }`}>
                      {/* Bubble Metadata Header */}
                      <div className="flex items-center justify-between gap-6 mb-2 text-[10px] font-bold tracking-wider text-gray-500">
                        <span className="flex items-center gap-1">
                          {isAI && <Sparkles className="h-3.5 w-3.5 text-brand-neon" />}
                          {isAI ? 'ASKCARE AI' : 'YOU'}
                        </span>
                        <span className="font-light text-gray-500">{msg.timestamp}</span>
                      </div>

                      {/* Message Content */}
                      <p className="whitespace-pre-wrap text-[13px] sm:text-sm font-sans">{msg.text}</p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing Animation */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full justify-start"
                >
                  <div className="bg-[#11141C] text-gray-200 border border-gray-800/80 rounded-2xl rounded-tl-none p-4 shadow-lg">
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-sans font-semibold">
                      <div className="flex space-x-1.5 items-center py-1">
                        <div className="w-1.5 h-1.5 bg-brand-neon rounded-full animate-typing-dot" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-brand-neon rounded-full animate-typing-dot" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-brand-neon rounded-full animate-typing-dot" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-normal select-none">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Disclaimer Info Banner */}
        <div className="px-4 md:px-6 py-2.5 bg-[#11141C]/40 border-t border-gray-900 flex items-center gap-2 text-[9px] md:text-[10px] text-gray-500 font-sans select-none shrink-0 z-20">
          <AlertCircle className="h-3.5 w-3.5 text-brand-neon shrink-0" />
          <span className="leading-normal">
            AskCare provides educational query clarifications. It does not replace medical diagnostics or consultations from licensed clinical professionals.
          </span>
        </div>

        {/* Input Box Footer */}
        <footer className="p-4 border-t border-gray-900 bg-[#07090D]/50 backdrop-blur-sm shrink-0 z-20">
          <form
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto flex gap-2 relative items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about clinical symptoms, medications, or lab diagnostics..."
              className="w-full bg-[#11141C] border border-gray-800 rounded-xl px-4 py-4 pr-14 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 transition-all duration-200 font-sans"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 bg-brand-neon hover:bg-[#c6f000] disabled:bg-gray-800/40 text-black disabled:text-gray-600 font-extrabold rounded-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shadow shadow-brand-neon/10 disabled:shadow-none disabled:scale-100"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </footer>
      </main>

      {/* Self-contained styling for custom typing animation bouncing */}
      <style>{`
        @keyframes typing-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        .animate-typing-dot {
          animation: typing-bounce 1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default Chat;
