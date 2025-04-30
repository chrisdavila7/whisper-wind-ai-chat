
import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, Volume, VolumeX } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
}

const ChatInput = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
  ttsEnabled,
  onToggleTTS
}: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={onToggleTTS}
        variant="ghost"
        size="icon"
        className="flex-shrink-0 text-gray-500 hover:text-gray-700 bg-white/30 rounded-15 mr-1"
        title={ttsEnabled ? "Disable auto text-to-speech" : "Enable auto text-to-speech"}
      >
        <span className="sr-only">{ttsEnabled ? "Disable TTS" : "Enable TTS"}</span>
        {ttsEnabled ? <Volume className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </Button>
      
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full bg-white/20 backdrop-blur-3xl rounded-15 p-2 shadow-md border border-white/20">
        <Input 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)} 
          placeholder="Type a message..." 
          disabled={isLoading} 
          className="flex-grow bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-15" 
        />

        {isLoading ? (
          <Button 
            onClick={onStopGeneration} 
            type="button" 
            variant="outline" 
            size="icon" 
            className="text-gray-500 hover:text-red-500 bg-white/30 rounded-15"
          >
            <span className="sr-only">Stop generation</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          </Button>
        ) : (
          <Button 
            type="submit" 
            disabled={!inputValue.trim()} 
            size="icon" 
            className="bg-ai-primary/80 hover:bg-ai-secondary/80 text-white rounded-15"
          >
            <span className="sr-only">Send message</span>
            <Send className="h-5 w-5" />
          </Button>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
