
import { NextResponse } from 'next/server';
import { Message } from '../../../types/message';

// This is a server-side mock for streaming responses
export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }

    // Get the last user message
    const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    
    // Create an encoder for text streaming
    const encoder = new TextEncoder();
    
    // Create a TransformStream for streaming the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Define response based on user input
    let response: string;
    if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
      response = "Hello! How can I help you today?";
    } else if (userMessage.toLowerCase().includes('help')) {
      response = "I'm here to help! Feel free to ask me anything, and I'll do my best to assist you.";
    } else if (userMessage.toLowerCase().includes('name')) {
      response = "I'm an AI assistant designed to help answer your questions and have conversations.";
    } else {
      response = `Thanks for your message: "${userMessage}". I'm an AI assistant ready to help with your questions.`;
    }
    
    // Stream response simulation
    const words = response.split(' ');
    
    // Start async streaming
    (async () => {
      try {
        for (let i = 0; i < words.length; i++) {
          const word = (i === 0 ? '' : ' ') + words[i];
          await writer.write(encoder.encode(word));
          // Random delay for realistic typing
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        }
      } catch (error) {
        console.error('Error streaming response:', error);
      } finally {
        await writer.close();
      }
    })();
    
    // Return the stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
    
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
