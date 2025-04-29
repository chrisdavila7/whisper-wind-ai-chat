
'use client';

import dynamic from 'next/dynamic';

// Dynamically import the ChatWindow component to avoid server/client mismatches
const ChatWindow = dynamic(() => import('../components/ChatWindow'), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ai-background p-4">
      <div className="w-full max-w-4xl bg-white h-[80vh] rounded-xl shadow-lg overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}
