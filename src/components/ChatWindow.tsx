import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useChat } from '../hooks/useChat';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { Progress } from './ui/progress';
const ChatWindow = () => {
  const {
    messages,
    isLoading,
    sendMessage,
    stopStreaming,
    clearMessages
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(68); // Fixed fake percentage

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [messages]);
  return <div className="flex flex-col h-full max-h-full rounded-15">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/30 backdrop-blur-sm rounded-15 p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ai-text">Status</span>
            <div className="w-32">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-xs text-slate-900">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center p-4 rounded-t-15 border-gray-500 border-t-2 border-l-2 border-r-2">
        {messages.length > 0 && <Button variant="ghost" size="sm" onClick={clearMessages} className="text-gray-500 hover:text-red-500">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear chat
          </Button>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 border-gray-500 border-l-2 border-r-2 border-b-1">
        {messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center p-8 backdrop-blur-md \\\\nrounded-15 bg-white/0 border my-0 mx-[25px] py-0 rounded-none">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-ai-primary/80 to-ai-secondary/80 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-slate-500">Welcome to AI Chat</h2>
            <p className="text-gray-500 max-w-sm">
              Start a conversation with the AI assistant by typing a message below.
            </p>
          </div> : messages.map(message => <MessageBubble key={message.id} message={message} />)}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-500 rounded-b-15 border-l-2 border-b-2 border-r-2">
        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} onStopGeneration={stopStreaming} />
      </div>
    </div>;
};
export default ChatWindow;