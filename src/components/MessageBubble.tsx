
import { memo } from 'react';
import { Message } from '../types/message';
import { formatTimestamp } from '../utils/formatMessage';

interface MessageBubbleProps {
  message: Message;
  autoPlayTTS?: boolean;
}

const MessageBubble = ({ message, autoPlayTTS = false }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  
  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in font-merriweather`}>
      <div className={`relative max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-15 ${
        isUser 
          ? 'chat-gradient bg-gradient-to-r from-ai-primary/80 to-ai-secondary/30 rounded-tr-none shadow-lg' 
          : 'bg-white/50 dark:bg-gray-800/70 backdrop-blur-sm shadow-md rounded-tl-none'
      }`}>
        <div className="flex flex-col">
          <div className="text-xs opacity-70 mb-1 merriweather-regular">
            {isUser ? 'You' : 'AI Assistant'} • {formatTimestamp(message.timestamp)}
          </div>
          
          <div className={`whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800 dark:text-gray-200'} merriweather-regular`}>
            {message.content}
            {isStreaming && (
              <span className="ml-1 inline-block w-2 h-4 bg-current opacity-70 animate-pulse rounded-sm"></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MessageBubble);
