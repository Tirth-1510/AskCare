import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, User, History, LogOut, Activity,
  MessageSquare, AlertCircle, Plus, Menu, X,
  PanelLeftClose, PanelLeftOpen, Edit3, Check, Trash,
  Zap, Cpu, ShieldCheck, ChevronDown
} from 'lucide-react';
import MarkdownMessage from '../components/MarkdownMessage';
import ModelSelectorModal from '../components/ModelSelectorModal';
import ThemeToggle from '../components/ThemeToggle';

function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  // States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [hasAttemptedAutoSelect, setAttemptedAutoSelect] = useState(false);

  // Model Selection Modal & Toast States
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [modelToast, setModelToast] = useState(null);


  // Use Custom Chat Hook
  const {
    conversations,
    activeChat,
    setActiveChat,
    fetchUserMemory,
    availableModels,
    selectedModel,
    setSelectedModel,
    fetchAvailableModels,
    loading,
    error,
    setError,
    fetchHistory,
    fetchChatDetails,
    sendMessage,
    deleteChat,
    renameChat
  } = useChat();





  // Auto-dismiss model switch feedback toast
  useEffect(() => {
    if (modelToast) {
      const timer = setTimeout(() => setModelToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [modelToast]);

  // Storage key uniquely scoped to the authenticated user ID
  const userStorageKey = user ? `askcare_active_chat_${user.id || user._id}` : 'askcare_active_chat';

  const [activeChatId, setActiveChatId] = useState(() => {
    return localStorage.getItem(userStorageKey) || null;
  });

  // When user changes (login/logout/switch), update activeChatId from scoped storage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`askcare_active_chat_${user.id || user._id}`);
      setActiveChatId(saved || null);
    }
  }, [user]);

  // Load history, available models, and persistent clinical memory on mount
  useEffect(() => {
    fetchHistory().then(() => setHistoryLoaded(true));
    fetchUserMemory();
    fetchAvailableModels();
  }, [fetchHistory, fetchUserMemory, fetchAvailableModels]);


  // Load specific chat when activeChatId changes (avoids redundant re-fetch if already in state)
  useEffect(() => {
    if (activeChatId) {
      const currentLoadedId = activeChat ? (activeChat.id || activeChat._id) : null;
      if (currentLoadedId !== activeChatId) {
        fetchChatDetails(activeChatId);
      }
      localStorage.setItem(userStorageKey, activeChatId);
    } else {
      setActiveChat(null); // Clear the activeChat details so welcome screen renders
      localStorage.removeItem(userStorageKey);
    }
  }, [activeChatId, fetchChatDetails, setActiveChat, userStorageKey]);

  // Auto-select first chat or load saved chat only ONCE after history has loaded
  useEffect(() => {
    if (historyLoaded && !hasAttemptedAutoSelect) {
      if (conversations.length > 0) {
        const savedActive = localStorage.getItem(userStorageKey);
        const exists = conversations.some(c => (c.id || c._id) === savedActive);
        if (savedActive && exists) {
          setActiveChatId(savedActive);
        } else {
          setActiveChatId(conversations[0].id || conversations[0]._id);
        }
      } else {
        setActiveChatId(null);
      }
      setAttemptedAutoSelect(true);
    }
  }, [historyLoaded, conversations, hasAttemptedAutoSelect, userStorageKey]);

  // Autoscroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat, loading]);

  // Welcome message template for empty state
  const welcomeMessage = {
    id: 'welcome',
    _id: 'welcome',
    sender: 'ai',
    model: selectedModel,
    content: `Hello ${user?.name || 'there'}! I am AskCare, your clinical query resolution assistant powered by **Mistral 7B**. What symptoms or medical questions can I clarify for you today? (You can switch models anytime using the engine selector above.)`,
    timestamp: new Date().toISOString(),
  };

  // Helper to format ISO timestamps nicely
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timestamp;
    }
  };

  // Get active model object
  const currentModelObj = availableModels.find(m => m.id === selectedModel) || availableModels[0] || {
    id: 'open-mistral-7b',
    name: 'Mistral 7B Instruct',
    provider: 'Mistral AI',
    badge: 'Recommended',
    speed: 'Ultra Fast',
    contextWindow: '32k'
  };

  // Helper for model icons
  const getModelIcon = (modelId, className = "h-4 w-4") => {
    if (!modelId) return <Zap className={className} />;
    const id = modelId.toLowerCase();
    if (id.includes('7b')) return <Zap className={className} />;
    if (id.includes('8b')) return <Cpu className={className} />;
    if (id.includes('small') || id.includes('moe')) return <Brain className={className} />;
    if (id.includes('smollm') || id.includes('medical') || id.includes('custom')) return <ShieldCheck className={className} />;
    return <Sparkles className={className} />;
  };

  // Helper for model badge rendering on message bubbles
  const getModelBadge = (modelId) => {
    if (!modelId) return { label: 'Mistral 7B', color: 'text-amber-300 bg-amber-500/10 border-amber-500/25', icon: Zap };
    const id = modelId.toLowerCase();
    if (id.includes('7b')) {
      return { label: 'Mistral 7B', color: 'text-amber-300 bg-amber-500/10 border-amber-500/25', icon: Zap };
    }
    if (id.includes('8b')) {
      return { label: 'Ministral 8B', color: 'text-sky-300 bg-sky-500/10 border-sky-500/25', icon: Cpu };
    }
    if (id.includes('small') || id.includes('moe')) {
      return { label: 'Mistral Small 4', color: 'text-purple-300 bg-purple-500/10 border-purple-500/25', icon: Brain };
    }
    if (id.includes('smollm') || id.includes('medical') || id.includes('custom')) {
      return { label: 'AskCare SLM', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25', icon: ShieldCheck };
    }
    return { label: 'Clinical AI', color: 'text-brand-neon bg-brand-neon/10 border-brand-neon/25', icon: Sparkles };
  };

  // Get messages list to render (fallback to welcome if empty/new)
  const messagesToRender = (activeChat && activeChat.messages && activeChat.messages.length > 0)
    ? activeChat.messages
    : [welcomeMessage];

  // 1. Create a New Chat Session (Local trigger, resets active session)
  const handleNewChat = () => {
    setActiveChatId(null);
    setActiveChat(null);
    setMobileSidebarOpen(false);
    setError(null);
  };

  // 2. Delete a Chat Session
  const handleDeleteChat = async (idToDelete, e) => {
    e.stopPropagation(); // Prevent setting as active
    
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      const success = await deleteChat(idToDelete);
      if (success) {
        if (activeChatId === idToDelete) {
          const remaining = conversations.filter(c => {
            const id = c.id || c._id;
            return id !== idToDelete;
          });
          if (remaining.length > 0) {
            const nextId = remaining[0].id || remaining[0]._id;
            setActiveChatId(nextId);
          } else {
            setActiveChatId(null);
          }
        }
      }
    }
  };

  // 3. Start Rename Chat
  const startRenameChat = (chat, e) => {
    e.stopPropagation();
    const id = chat.id || chat._id;
    setEditingChatId(id);
    setEditTitle(chat.title);
  };

  // 4. Save Chat Rename
  const saveRenameChat = async (idToRename, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await renameChat(idToRename, editTitle.trim());
    }
    setEditingChatId(null);
  };

  // 5. Send Message Logic (interacts with backend with model selection)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput('');
    setError(null);

    try {
      // Send message to backend with currently selected model (auto creates chat if activeChatId is null)
      const updatedChat = await sendMessage(userQuery, activeChatId, selectedModel);
      if (updatedChat) {
        const newId = updatedChat.id || updatedChat._id;
        if (activeChatId !== newId) {
          setActiveChatId(newId);
        }
      }
      // Re-fetch clinical memory in background to immediately synchronize any newly extracted facts
      fetchUserMemory();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(userStorageKey);
    logout();
    navigate('/login');
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
          const chatActualId = chat.id || chat._id;
          const isActive = chatActualId === activeChatId;
          const isEditing = chatActualId === editingChatId;

          return (
            <div
              key={chatActualId}
              onClick={() => {
                setActiveChatId(chatActualId);
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
                      if (e.key === 'Enter') saveRenameChat(chatActualId, e);
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
                    onClick={(e) => handleDeleteChat(chatActualId, e)}
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
                    onClick={(e) => saveRenameChat(chatActualId, e)}
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

        {/* Secondary Links & Theme Toggle */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-gray-800/50 pb-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-sans">Theme</span>
            <ThemeToggle showLabel compact />
          </div>
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

            {/* Prominent Header Model Selector Button */}
            <button
              onClick={() => setModelModalOpen(true)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#151926] to-[#111520] hover:from-[#1A2030] hover:to-[#161C2A] border border-gray-800 hover:border-brand-neon/50 text-xs text-white transition-all cursor-pointer shadow-md hover:shadow-brand-neon/10 group"
              title="Click to view and switch clinical AI engines"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-neon"></span>
              </span>

              <span className="flex items-center justify-center h-5 w-5 rounded-lg bg-amber-400/15 text-amber-300 border border-amber-400/30 group-hover:scale-110 transition-transform">
                {getModelIcon(currentModelObj?.id, "h-3.5 w-3.5 text-amber-400")}
              </span>

              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-tight text-white font-sans">
                  {currentModelObj?.name || 'Mistral 7B Instruct'}
                </span>
                {currentModelObj?.badge && (
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-brand-neon/15 text-brand-neon border border-brand-neon/30">
                    {currentModelObj.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] text-gray-500 font-mono hidden lg:inline">
                {currentModelObj?.speed}
              </span>

              <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-brand-neon transition-colors" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#11141C] border border-gray-800 text-[11px] font-medium text-gray-400 select-none">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="hidden sm:inline font-sans">AskCare AI Active</span>
            </div>
          </div>
        </header>


        {/* Message Window Area */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-5 bg-[#0B0E14] relative z-10">
          <div className="max-w-4xl mx-auto space-y-5">
            
            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-950/40 border border-red-800/30 text-red-200 rounded-xl text-xs font-sans">
                <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
                <span className="flex-grow">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-[10px] uppercase font-extrabold tracking-wider text-red-400 hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-red-900/30"
                >
                  Dismiss
                </button>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messagesToRender.map((msg, index) => {
                const isAI = msg.sender === 'ai';
                const messageId = msg._id || msg.id || `msg-${index}`;
                return (
                  <motion.div
                    key={messageId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex w-full ${!isAI ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`rounded-2xl leading-relaxed shadow-xl relative transition-all ${!isAI
                      ? 'max-w-[85%] md:max-w-[75%] p-4 bg-[#201947] text-white border border-[#4c3cc2]/30 rounded-tr-none'
                      : 'max-w-[95%] sm:max-w-[90%] md:max-w-[85%] p-5 sm:p-6 bg-[#0E121A] text-gray-100 border border-gray-800/90 rounded-tl-none shadow-black/40'
                      }`}>
                      {/* Bubble Metadata Header */}
                      <div className="flex items-center justify-between gap-4 mb-3 text-[11px] font-bold tracking-wider text-gray-400 border-b border-gray-800/50 pb-2">
                        <span className="flex items-center gap-2 flex-wrap">
                          {isAI ? (
                            <>
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-neon/10 border border-brand-neon/30 text-brand-neon">
                                <Sparkles className="h-3 w-3" />
                              </span>
                              <span className="text-gray-200 tracking-wide font-bold">ASKCARE CLINICAL AI</span>

                              {/* Model Inference Badge */}
                              {(() => {
                                const badgeInfo = getModelBadge(msg.model || (activeChat?.model || selectedModel));
                                const BadgeIcon = badgeInfo.icon;
                                return (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1.5 shadow-sm ${badgeInfo.color}`}>
                                    <BadgeIcon className="h-2.5 w-2.5" />
                                    <span>{badgeInfo.label}</span>
                                  </span>
                                );
                              })()}
                            </>
                          ) : (
                            <>
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                                <User className="h-3 w-3" />
                              </span>
                              <span className="text-purple-200 tracking-wide font-bold">YOU</span>
                            </>
                          )}
                        </span>
                        <span className="font-normal text-[11px] text-gray-500 shrink-0">{formatTime(msg.timestamp)}</span>
                      </div>

                      {/* Message Content */}
                      <MarkdownMessage content={msg.content} isAI={isAI} />
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing Animation (shown during API loads) */}
              {loading && (
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
        <footer className="p-3 sm:p-4 border-t border-gray-900 bg-[#07090D]/60 backdrop-blur-md shrink-0 z-20">
          <form
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto"
          >
            {/* Integrated Input Container with Model Switcher on Left */}
            <div className="relative flex items-center w-full bg-[#11141C] border border-gray-800 focus-within:border-brand-neon focus-within:ring-1 focus-within:ring-brand-neon/30 rounded-2xl p-1.5 sm:p-2 transition-all duration-200 shadow-xl">
              
              {/* Left-Side Model Switcher Button - Minimal & Compact */}
              <button
                type="button"
                onClick={() => setModelModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161B26] hover:bg-[#1E2535] border border-gray-700/50 hover:border-brand-neon/50 text-white transition-all cursor-pointer shrink-0 group active:scale-95"
                title="Switch clinical AI model"
              >
                <span className="text-[11px] sm:text-xs font-semibold text-gray-300 group-hover:text-white font-sans max-w-[120px] sm:max-w-none truncate transition-colors">
                  {currentModelObj?.name || 'Mistral 7B Instruct'}
                </span>

                <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-brand-neon transition-colors shrink-0" />
              </button>

              {/* Elegant Divider */}
              <div className="h-6 w-px bg-gray-800/80 mx-1.5 sm:mx-2 shrink-0" />

              {/* Message Typing Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about clinical symptoms, medications, or lab diagnostics..."
                className="w-full bg-transparent px-1.5 sm:px-2 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none font-sans min-w-0"
                disabled={loading}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex items-center justify-center h-10 w-10 shrink-0 bg-brand-neon hover:bg-[#c6f000] disabled:bg-gray-800/40 text-black disabled:text-gray-600 font-extrabold rounded-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shadow shadow-brand-neon/10 disabled:shadow-none disabled:scale-100 ml-1.5"
                title="Send consultation query"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </div>
          </form>
        </footer>
      </main>

      {/* Floating Model Switch Feedback Toast */}
      <AnimatePresence>
        {modelToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-[#141824]/95 border border-brand-neon/40 text-white rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold"
          >
            <Sparkles className="h-4 w-4 text-brand-neon animate-pulse" />
            <span>{modelToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. CLINICAL MODEL SELECTOR MODAL (Production-Grade Multi-Model Selection) */}
      <ModelSelectorModal
        isOpen={modelModalOpen}
        onClose={() => setModelModalOpen(false)}
        availableModels={availableModels}
        selectedModel={selectedModel}
        onSelectModel={(newModelId) => {
          setSelectedModel(newModelId);
          const target = availableModels.find(m => m.id === newModelId);
          setModelToast(`Active engine switched to ${target?.name || newModelId}`);
          setModelModalOpen(false);
        }}
      />



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
