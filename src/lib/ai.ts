
import { AIServiceResponse, Message } from "../types/message";

// This is a mock implementation that simulates streaming responses
export async function streamResponse(
  messages: Message[],
  onChunk: (chunk: AIServiceResponse) => void,
  abortSignal?: AbortSignal
): Promise<void> {
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

  // Simulate streaming word by word with random delays
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

    // Random delay between 50-150ms for realistic typing effect
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
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
      
      onChunk({
        content: streamedText,
        isComplete: false
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
