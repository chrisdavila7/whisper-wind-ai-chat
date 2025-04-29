
import { Message } from "../types/message";

export function formatTimestamp(timestamp: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(timestamp);
}

export function generateMessageId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function sanitizeInput(input: string): string {
  return input.trim();
}

export function createSystemMessage(content: string): Message {
  return {
    id: generateMessageId(),
    role: 'system',
    content,
    timestamp: new Date(),
  };
}

export function createUserMessage(content: string): Message {
  return {
    id: generateMessageId(),
    role: 'user',
    content: sanitizeInput(content),
    timestamp: new Date(),
  };
}

export function createAssistantMessage(content: string = '', isStreaming: boolean = true): Message {
  return {
    id: generateMessageId(),
    role: 'assistant',
    content,
    timestamp: new Date(),
    isStreaming,
  };
}
