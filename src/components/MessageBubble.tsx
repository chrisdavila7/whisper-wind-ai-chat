
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
          ? 'bg-gradient-to-r from-ai-primary to-ai-secondary text-white shadow-md dark:shadow-lg backdrop-blur-sm' 
          : 'bg-white/90 dark:bg-gray-800/90 shadow-sm backdrop-blur-sm text-gray-800 dark:text-gray-200'
      } ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'} border border-white/10 dark:border-white/5`}>
        {/* Header with role and timestamp */}
        <div className="flex flex-col">
          <div className="text-xs opacity-70 mb-1 merriweather-regular">
            {isUser ? 'You' : 'AI Assistant'} • {formatTimestamp(message.timestamp)}
          </div>
          
          {/* Message content */}
          <div className="whitespace-pre-wrap merriweather-regular">
            {message.content}
            {/* Typing indicator when message is streaming */}
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
