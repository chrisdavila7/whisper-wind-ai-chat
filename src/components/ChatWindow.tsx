import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useChat } from '../hooks/useChat';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { Progress } from './ui/progress';
import TabButton from './TabButton';
import SidePanel from './SidePanel';
import RightSideWindow from './RightSideWindow';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../integrations/supabase/client';
import { Message } from '../types/message';
import { useAuth } from '@/contexts/AuthContext';

interface ChatWindowProps {
  conversationId?: string;
}

const ChatWindow = ({ conversationId }: ChatWindowProps) => {
  const {
    messages,
    isLoading,
    sendMessage,
    stopStreaming,
    clearMessages,
    setMessages
  } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(68); // Fixed fake percentage
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isRightSideWindowVisible, setIsRightSideWindowVisible] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load existing messages when conversation ID changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId || !user) return;
      
      try {
        setIsLoadingHistory(true);
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Convert to Message format
          const formattedMessages: Message[] = data.map(msg => ({
            id: msg.id,
            content: msg.content,
            role: msg.is_user ? 'user' : 'assistant',
            timestamp: new Date(msg.created_at),
            isStreaming: false
          }));
          
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadMessages();
  }, [conversationId, user, setMessages]);

  // Save messages to Supabase
  const handleSendMessage = async (content: string) => {
    if (!conversationId || !user) return;
    
    // Add message to Supabase
    try {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        content: content,
        is_user: true
      });
      
      // Process the message through AI
      await sendMessage(content);
      
      // The AI response will be saved in a separate useEffect
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // Save assistant messages to Supabase when they complete streaming
  useEffect(() => {
    const saveAssistantMessage = async () => {
      if (!conversationId || !user) return;
      
      // Find the last assistant message that has finished streaming
      const lastAssistantMsg = [...messages].reverse().find(
        msg => msg.role === 'assistant' && !msg.isStreaming
      );
      
      if (lastAssistantMsg && lastAssistantMsg.content) {
        // Check if this message is already in the database (has an ID)
        if (!lastAssistantMsg.id.includes('temp-')) {
          return; // Skip if already saved
        }
        
        try {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            content: lastAssistantMsg.content,
            is_user: false
          });
        } catch (error) {
          console.error('Error saving assistant message:', error);
        }
      }
    };
    
    saveAssistantMessage();
  }, [messages, conversationId, user]);

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  const handleToggleTTS = () => {
    setTtsEnabled(prev => !prev);
  };

  return (
    <div className="flex flex-col h-full max-h-full">
      {/* Reinstate hamburger menu button and side panel */}
      <TabButton onClick={toggleSidePanel} isOpen={isSidePanelOpen} />
      <SidePanel isOpen={isSidePanelOpen} onClose={() => setIsSidePanelOpen(false)} />
      
      {/* Main two-column layout container - Re-added p-4 */}
      <div className="flex-1 flex gap-4 p-4">
        
        {/* Left Column: Chat Area */}
        <div className="w-9/12 flex flex-col h-full">
          {/* Container for Messages ONLY - Changed blur to sm */}
          <div className="flex-1 flex flex-col border-ai-primary dark:border-ai-primary border-2 rounded-15 relative dark:bg-gray-800/20 bg-white/20 backdrop-blur-sm shadow-xl overflow-hidden">
            {/* Message List Area - Scrollable, padded, now also flex for vertical centering */}
            <div className="flex-1 flex flex-col justify-center overflow-y-auto p-4"> 
              {isLoadingHistory ? (
                <div className="flex items-center justify-center"> 
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ai-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                // Show welcome message if no messages exist
                <div className="flex flex-col items-center justify-center text-center"> 
                  <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-ai-primary/80 to-ai-secondary/80 flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-300">Welcome to AI Chat</h2>
                  <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                    Start a conversation with the AI assistant by typing a message below.
                  </p>
                </div>
              ) : (
                // Otherwise, display messages - Centered horizontally
                <div className="flex flex-col items-center space-y-4"> 
                  {messages.map((msg, index) => (
                    <MessageBubble key={msg.id || index} message={msg} autoPlayTTS={ttsEnabled} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Chat Input Area - Moved outside/below messages, added mt-4 */}
          <div className="mt-4 p-2 flex items-center gap-2"> 
            {/* Theme Toggle Button */}
            <ThemeToggle />
            {/* TTS Toggle Button */}
            <Button 
              type="button" 
              onClick={handleToggleTTS} 
              variant="ghost" 
              size="icon" 
              title={ttsEnabled ? "Disable auto text-to-speech" : "Enable auto text-to-speech"} 
              className="flex-shrink-0 dark:text-gray-300 text-gray-700 dark:hover:text-gray-100 hover:text-gray-900 rounded-15 bg-ai-primary/10 dark:bg-ai-primary/20 hover:bg-ai-primary/20 dark:hover:bg-ai-primary/30 backdrop-blur-sm shadow-sm"
            >
              <span className="sr-only">{ttsEnabled ? "Disable TTS" : "Enable TTS"}</span>
              {ttsEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
              )}
            </Button>
            {/* Input Field - Takes remaining space */}
            <div className="flex-grow"> 
              <ChatInput 
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onStopGeneration={stopStreaming}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Side Window - Should align with bordered message container */}
        <div className="w-3/12 h-full">
          <RightSideWindow isVisible={isRightSideWindowVisible} />
        </div>

      </div>
    </div>
  );
};

export default ChatWindow;
