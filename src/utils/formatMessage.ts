
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageRole } from '@/types/message';

export const createUserMessage = (content: string): Message => {
  return {
    id: uuidv4(),
    role: 'user',
    content,
    timestamp: new Date(),
    isStreaming: false
  };
};

export const createAssistantMessage = (content: string = ''): Message => {
  return {
    id: `temp-${uuidv4()}`,
    role: 'assistant',
    content,
    timestamp: new Date(),
    isStreaming: true
  };
};
