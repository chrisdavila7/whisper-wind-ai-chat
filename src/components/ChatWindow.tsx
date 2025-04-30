
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
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isRightSideWindowVisible, setIsRightSideWindowVisible] = useState(true);

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
    <div className="flex flex-col h-full max-h-full rounded-15 my-[-5vh]">
      <TabButton onClick={toggleSidePanel} isOpen={isSidePanelOpen} />
      <SidePanel isOpen={isSidePanelOpen} onClose={() => setIsSidePanelOpen(false)} />
      <RightSideWindow isVisible={isRightSideWindowVisible} />
      
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-screen-xl px-4">
        <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-15 p-3 shadow-sm mx-auto md:ml-[-20%] lg:ml-[-30%]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Status</span>
            <div className="w-24 sm:w-28 md:w-32">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-xs text-slate-900 dark:text-slate-200">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 border-gray-500 dark:border-gray-600 border-l-4 border-r-4 border-b-4 rounded-b-15 border-t-4 rounded-t-15 mt-[5vh] mb-[15vh] ml-[4%] relative max-w-none w-[calc(70%-2rem)] px-3 sm:px-4 md:px-5 dark:bg-gray-800/20 bg-white/20 backdrop-blur-sm">
        {messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 md:p-8 backdrop-blur-md rounded-15 bg-white/10 dark:bg-slate-800/10 border-15 mx-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-2 sm:mb-3 md:mb-4 rounded-full bg-gradient-to-r from-ai-primary/80 to-ai-secondary/80 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-slate-700 dark:text-slate-300">Welcome to AI Chat</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-[80%] sm:max-w-sm">
              Start a conversation with the AI assistant by typing a message below.
            </p>
          </div> : messages.map(message => <MessageBubble key={message.id} message={message} autoPlayTTS={ttsEnabled} />)}
        <div ref={messagesEndRef} />
      </div>

      <div className="w-[calc(70%-2rem)] ml-[4%] relative px-4 pb-3 pt-3 my-[-15vh]">
        <div className="flex items-center gap-3">
          <ThemeToggle className="mr-1" />
          <Button type="button" onClick={handleToggleTTS} variant="ghost" size="icon" title={ttsEnabled ? "Disable auto text-to-speech" : "Enable auto text-to-speech"} className="flex-shrink-0 dark:text-gray-300 text-gray-700 dark:hover:text-gray-100 hover:text-gray-900 rounded-15 bg-white/20 dark:bg-slate-700/30 hover:bg-gray-200/50 dark:hover:bg-slate-600/50 backdrop-blur-sm">
            <span className="sr-only">{ttsEnabled ? "Disable TTS" : "Enable TTS"}</span>
            {ttsEnabled ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>}
          </Button>
          <div className="flex-grow">
            <ChatInput onSendMessage={sendMessage} isLoading={isLoading} onStopGeneration={stopStreaming} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
