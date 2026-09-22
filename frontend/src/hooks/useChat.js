/**
 * useChat.js — Chat API Custom Hook
 *
 * Encapsulates all chat-related state and API operations in a single
 * reusable React hook. Components simply call useChat() to get access
 * to the conversations list, active chat, loading state, and all CRUD actions.
 *
 * State managed:
 *   conversations — Array of summarized chat session objects from /api/chat/history
 *   activeChat    — Full chat object (with all messages) currently being viewed
 *   loading       — true while any API request is in flight
 *   error         — Error message string from the last failed API call (or null)
 *
 * All async functions:
 *   - Set loading=true before the request, loading=false in finally
 *   - Set error=null at the start (clearing any previous error)
 *   - Set error to the server message if the request fails
 *   - Are wrapped in useCallback to prevent unnecessary re-renders in consumers
 *
 * API calls use the shared Axios instance from utils/api.js which
 * automatically attaches the JWT token to every request.
 */

import { useState, useCallback } from 'react';
import api from '../utils/api';

export const useChat = () => {
  const [conversations, setConversations] = useState([]);   // List of all chat summaries
  const [activeChat, setActiveChat] = useState(null);       // Currently open full chat session
  const [loading, setLoading] = useState(false);            // Global loading indicator
  const [error, setError] = useState(null);                 // Last error message (or null)

  // ════════════════════════════════════════════════════════════════════
  // 1. Fetch Chat History — GET /api/chat/history
  // ════════════════════════════════════════════════════════════════════
  /**
   * fetchHistory — Loads the list of all past chat sessions for the user.
   * Populates the `conversations` state with summarized session objects
   * (id, title, messageCount, lastMessage, timestamps).
   * Used by the History page and the Chat page sidebar.
   */
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
  }, []); // No dependencies — this function never needs to be recreated

  // ════════════════════════════════════════════════════════════════════
  // 2. Fetch Single Chat — GET /api/chat/:id
  // ════════════════════════════════════════════════════════════════════
  /**
   * fetchChatDetails — Loads the full message history for a specific chat.
   * Sets `activeChat` with the complete chat object (including all messages).
   * Called when the user clicks on a chat session to open it.
   * @param {string} chatId — The id of the chat session to load
   */
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

  // ════════════════════════════════════════════════════════════════════
  // 3. Send Message — POST /api/chat
  // ════════════════════════════════════════════════════════════════════
  /**
   * sendMessage — Sends a new message to the AI and updates the active chat.
   *
   * Flow:
   *   1. POST to /api/chat with { message, chatId }
   *   2. Server processes through RAG + AI and returns the updated chat object
   *   3. Update `activeChat` with the returned chat (includes AI reply)
   *   4. Refresh the conversation history list to reflect the updated timestamps
   *
   * If chatId is null → the server creates a new chat session.
   * If chatId is provided → the server appends to the existing session.
   *
   * @param {string} message  — The user's message text
   * @param {string|null} chatId — Existing chat id to continue, or null for new chat
   * @returns {Object|undefined} The updated chat object on success
   * @throws Re-throws errors so the Chat component can show inline error messages
   */
  const sendMessage = useCallback(async (message, chatId = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/chat', { message, chatId });
      if (response.data && response.data.success) {
        const updatedChat = response.data.chat;
        setActiveChat(updatedChat); // Replace active chat with the server's authoritative copy

        // Refresh history to keep list updated (new session title + updated timestamps)
        await fetchHistory();
        return updatedChat;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Connection issue. Failed to send message.');
      throw err; // Re-throw so Chat.jsx can handle it (e.g., show an error toast)
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]); // Depends on fetchHistory to refresh the sidebar list

  // ════════════════════════════════════════════════════════════════════
  // 4. Delete Chat — DELETE /api/chat/:id
  // ════════════════════════════════════════════════════════════════════
  /**
   * deleteChat — Permanently removes a chat session.
   * Also clears `activeChat` if the deleted chat was the one currently open.
   * Optimistically removes the chat from the `conversations` list on success.
   * @param {string} chatId — The id of the chat to delete
   * @returns {boolean} true if deleted successfully, false otherwise
   */
  const deleteChat = useCallback(async (chatId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/chat/${chatId}`);
      if (response.data && response.data.success) {
        // Remove deleted chat from the conversations list without a full refresh
        setConversations(prev => prev.filter(c => {
          const id = c.id || c._id; // Support both MongoDB and local db id formats
          return id !== chatId;
        }));
        // Clear activeChat if the deleted chat was the one being viewed
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
  }, [activeChat]); // Depends on activeChat to check if it was the deleted one

  // ════════════════════════════════════════════════════════════════════
  // 5. Rename Chat — PATCH /api/chat/:id
  // ════════════════════════════════════════════════════════════════════
  /**
   * renameChat — Updates the title of a chat session.
   * Applies the title change optimistically to both the conversations list
   * and the activeChat state (if it matches) without a full server round-trip.
   * @param {string} chatId — The id of the chat to rename
   * @param {string} title  — The new title string
   * @returns {boolean} true if renamed successfully, false otherwise
   */
  const renameChat = useCallback(async (chatId, title) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch(`/chat/${chatId}`, { title });
      if (response.data && response.data.success) {
        // Update the title in the conversations list (sidebar)
        setConversations(prev => prev.map(c => {
          const id = c.id || c._id;
          return id === chatId ? { ...c, title } : c; // Spread and override title only
        }));
        // Also update activeChat title if it's the renamed session
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

  // Expose all state and operations to consuming components
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
