
import { useCallback, useEffect, useRef, useState } from "react";
import { streamResponse } from "../lib/ai";
import { Message } from "../types/message";
import { createAssistantMessage, createUserMessage } from "../utils/formatMessage";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    try {
      setError(null);
      
      // Add user message
      const userMessage = createUserMessage(content);
      
      // Create a placeholder for the assistant's response
      const assistantMessage = createAssistantMessage();
      
      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setIsLoading(true);
      
      // Create a new AbortController
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      // Get all messages to send to AI (including the new user message)
      const messagesForAI = [...messages, userMessage];
      
      // Stream the response
      await streamResponse(
        messagesForAI,
        (chunk) => {
          setMessages(currentMessages => {
            // Find the assistant message we're currently updating
            const lastIndex = currentMessages.length - 1;
            const updatedMessages = [...currentMessages];
            
            // Update the content of the assistant message
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              content: chunk.content,
              isStreaming: !chunk.isComplete
            };
            
            return updatedMessages;
          });
          
          if (chunk.isComplete) {
            setIsLoading(false);
          }
        },
        abortControllerRef.current.signal
      );
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error in sendMessage:', err);
      
      // Update the assistant message to show an error
      setMessages(currentMessages => {
        const lastIndex = currentMessages.length - 1;
        if (lastIndex >= 0 && currentMessages[lastIndex].role === 'assistant') {
          const updatedMessages = [...currentMessages];
          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            content: 'Sorry, there was an error processing your request.',
            isStreaming: false
          };
          return updatedMessages;
        }
        return currentMessages;
      });
    }
  }, [messages]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      
      // Mark the current assistant message as no longer streaming
      setMessages(currentMessages => {
        const lastIndex = currentMessages.length - 1;
        if (lastIndex >= 0 && currentMessages[lastIndex].role === 'assistant' && currentMessages[lastIndex].isStreaming) {
          const updatedMessages = [...currentMessages];
          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            isStreaming: false
          };
          return updatedMessages;
        }
        return currentMessages;
      });
      
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    stopStreaming();
    setMessages([]);
  }, [stopStreaming]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
    setMessages // Expose setMessages for loading from database
  };
}
