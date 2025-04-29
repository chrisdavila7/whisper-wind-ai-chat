
'use client';

import { lazy, Suspense } from 'react';

// Dynamically import the ChatWindow component to avoid server/client mismatches
const ChatWindow = lazy(() => import('../components/ChatWindow'));
const NeuralBackground = lazy(() => import('../components/NeuralBackground'));

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <NeuralBackground />
        <div className="w-full max-w-4xl bg-white/90 backdrop-blur-sm h-[80vh] rounded-xl shadow-lg overflow-hidden z-10">
          <ChatWindow />
        </div>
      </Suspense>
    </div>
  );
}
