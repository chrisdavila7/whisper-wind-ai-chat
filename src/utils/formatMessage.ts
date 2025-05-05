import { v4 as uuidv4 } from 'uuid';
import { Message, MessageRole } from '@/types/message';

/**
 * Formats a timestamp into a human-readable string
 * @param date The date to format
 * @returns A formatted string representation of the date
 */
export const formatTimestamp = (date: Date): string => {
  // If the date is today, just show the time
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Otherwise show the full date
  return date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Creates a new user message object
 * @param content The content of the message
 * @returns A Message object with user role
 */
export const createUserMessage = (content: string): Message => {
  return {
    id: uuidv4(),
    role: 'user',
    content,
    timestamp: new Date(),
    isStreaming: false
  };
};

/**
 * Creates a new assistant message object
 * @param content The content of the message, defaults to empty string
 * @returns A Message object with assistant role
 */
export const createAssistantMessage = (content: string = ''): Message => {
  return {
    id: `temp-${uuidv4()}`,
    role: 'assistant',
    content,
    timestamp: new Date(),
    isStreaming: true
  };
};
