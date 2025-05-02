
import { AIServiceResponse, Message } from "../types/message";

// Optimized mock implementation that simulates streaming responses
export async function streamResponse(
  messages: Message[],
  onChunk: (chunk: AIServiceResponse) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  // Early abort check
  if (abortSignal?.aborted) return;

  const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  
  // Demo responses based on user input
  let response: string;
  if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
    response = "Hello! How can I help you today?";
  } else if (userMessage.toLowerCase().includes('help')) {
    response = "I'm here to help! Feel free to ask me anything, and I'll do my best to assist you.";
  } else if (userMessage.toLowerCase().includes('name')) {
    response = "I'm an AI assistant designed to help answer your questions and have conversations.";
  } else {
    response = `Thanks for your message: "${userMessage}". I'm a mock AI service right now, but I can be replaced with a real AI service like OpenAI, Anthropic, or others. How else can I assist you today?`;
  }

  // Split the response into words for streaming simulation
  const words = response.split(' ');
  let streamedResponse = '';
  
  // Performance optimization - determine delay based on device capabilities
  // Safely check for connection property using type assertion
  const baseDelay = (
    'connection' in navigator && 
    (navigator as any).connection?.effectiveType === '4g'
  ) ? 50 : 80;
  
  // Stream words with adaptive timing
  for (let i = 0; i < words.length; i++) {
    if (abortSignal?.aborted) {
      return;
    }

    // Add the next word to the streaming response
    streamedResponse += (i === 0 ? '' : ' ') + words[i];
    
    onChunk({
      content: streamedResponse,
      isComplete: i === words.length - 1
    });

    // Use more efficient setTimeout with requestAnimationFrame for better performance
    if (i < words.length - 1) {
      await new Promise(resolve => {
        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
          setTimeout(resolve, baseDelay + Math.random() * 30);
        });
      });
    }
  }
}

// For real implementation with OpenAI (commented out as we're using mock)
/*
export async function streamResponse(
  messages: Message[],
  onChunk: (chunk: AIServiceResponse) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  try {
    // Early abort check
    if (abortSignal?.aborted) return;
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Ensure the response is a ReadableStream
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamedText = '';
    let isComplete = false;

    while (!isComplete && !abortSignal?.aborted) {
      const { done, value } = await reader.read();
      
      if (done) {
        isComplete = true;
        break;
      }

      // Decode and process the chunk
      const chunk = decoder.decode(value, { stream: true });
      streamedText += chunk;
      
      // Use requestAnimationFrame for smoother UI updates
      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => {
          onChunk({
            content: streamedText,
            isComplete: false
          });
          resolve();
        });
      });
    }

    if (!abortSignal?.aborted) {
      onChunk({
        content: streamedText,
        isComplete: true
      });
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Request aborted');
    } else {
      console.error('Error streaming response:', error);
      throw error;
    }
  }
}
*/
