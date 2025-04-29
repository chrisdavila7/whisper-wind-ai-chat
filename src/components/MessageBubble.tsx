
import { memo } from 'react';
import { Message } from '../types/message';
import { formatTimestamp } from '../utils/formatMessage';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  
  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`relative max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl ${
        isUser 
          ? 'chat-gradient backdrop-blur-sm bg-gradient-to-r from-ai-primary/80 to-ai-secondary/80 rounded-tr-none' 
          : 'bg-white/30 backdrop-blur-sm shadow-sm rounded-tl-none'
      }`}>
        <div className="flex flex-col">
          <div className="text-xs opacity-70 mb-1">
            {isUser ? 'You' : 'AI Assistant'} • {formatTimestamp(message.timestamp)}
          </div>
          
          <div className={`whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}>
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
