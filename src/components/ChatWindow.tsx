import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useChat } from '../hooks/useChat';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
const ChatWindow = () => {
  const {
    messages,
    isLoading,
    sendMessage,
    stopStreaming,
    clearMessages
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [messages]);
  return <div className="flex flex-col h-full max-h-full">
      <div className="flex justify-between items-center pt-1 border-b border-white/20 bg-white/20 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-ai-text">AI Chat</h1>
        {messages.length > 0 && <Button variant="ghost" size="sm" onClick={clearMessages} className="text-gray-500 hover:text-red-500">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear chat
          </Button>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/20">
        {messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm rounded-lg bg-white/0">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-ai-primary/80 to-ai-secondary/80 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-ai-text">Welcome to AI Chat</h2>
            <p className="text-gray-500 max-w-sm">
              Start a conversation with the AI assistant by typing a message below.
            </p>
          </div> : messages.map(message => <MessageBubble key={message.id} message={message} />)}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-50/20 border-t border-white/20">
        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} onStopGeneration={stopStreaming} />
      </div>
    </div>;
};
export default ChatWindow;