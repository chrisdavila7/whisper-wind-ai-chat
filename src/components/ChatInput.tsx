import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
}

const ChatInput = ({
  onSendMessage,
  isLoading,
  onStopGeneration
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
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full bg-ai-primary/10 backdrop-blur-sm rounded-15 p-2 shadow-lg border-ai-primary/20">
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
          className="text-gray-500 hover:text-red-500 bg-ai-primary/20 rounded-15 shadow-sm"
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
          className="text-white rounded-15 bg-ai-primary hover:bg-ai-primary/80 shadow-sm"
        >
          <span className="sr-only">Send message</span>
          <Send className="h-5 w-5" />
        </Button>
      )}
    </form>
  );
};

export default ChatInput;
