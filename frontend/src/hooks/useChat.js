import { useState, useCallback } from 'react';
import api from '../utils/api';

export const useChat = () => {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch chat history (GET /api/chat/history)
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/chat/history');
      if (response.data && response.data.success) {
        setConversations(response.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError(err.response?.data?.message || 'Failed to load consultation history.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch specific chat by ID (GET /api/chat/:id)
  const fetchChatDetails = useCallback(async (chatId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/chat/${chatId}`);
      if (response.data && response.data.success) {
        setActiveChat(response.data.chat);
      }
    } catch (err) {
      console.error('Error fetching chat details:', err);
      setError(err.response?.data?.message || 'Failed to retrieve conversation details.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Send message (POST /api/chat)
  const sendMessage = useCallback(async (message, chatId = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/chat', { message, chatId });
      if (response.data && response.data.success) {
        const updatedChat = response.data.chat;
        setActiveChat(updatedChat);
        // Refresh history to keep list updated
        await fetchHistory();
        return updatedChat;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Connection issue. Failed to send message.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  // 4. Delete chat (DELETE /api/chat/:id)
  const deleteChat = useCallback(async (chatId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/chat/${chatId}`);
      if (response.data && response.data.success) {
        setConversations(prev => prev.filter(c => {
          const id = c.id || c._id;
          return id !== chatId;
        }));
        if (activeChat) {
          const currentActiveId = activeChat.id || activeChat._id;
          if (currentActiveId === chatId) {
            setActiveChat(null);
          }
        }
        return true;
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      setError(err.response?.data?.message || 'Failed to delete conversation.');
    } finally {
      setLoading(false);
    }
    return false;
  }, [activeChat]);

  // 5. Rename chat (PATCH /api/chat/:id)
  const renameChat = useCallback(async (chatId, title) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch(`/chat/${chatId}`, { title });
      if (response.data && response.data.success) {
        setConversations(prev => prev.map(c => {
          const id = c.id || c._id;
          return id === chatId ? { ...c, title } : c;
        }));
        if (activeChat) {
          const currentActiveId = activeChat.id || activeChat._id;
          if (currentActiveId === chatId) {
            setActiveChat(prev => ({ ...prev, title }));
          }
        }
        return true;
      }
    } catch (err) {
      console.error('Error renaming chat:', err);
      setError(err.response?.data?.message || 'Failed to rename conversation.');
    } finally {
      setLoading(false);
    }
    return false;
  }, [activeChat]);

  return {
    conversations,
    setConversations,
    activeChat,
    setActiveChat,
    loading,
    error,
    setError,
    fetchHistory,
    fetchChatDetails,
    sendMessage,
    deleteChat,
    renameChat
  };
};
export default useChat;
