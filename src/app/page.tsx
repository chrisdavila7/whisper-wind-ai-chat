
'use client';

import { lazy, Suspense } from 'react';

// Dynamically import the NeuralBackground component to avoid server/client mismatches
const NeuralBackground = lazy(() => import('../components/NeuralBackground'));
const ChatWindow = lazy(() => import('../components/ChatWindow'));

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-0 relative">
      <Suspense fallback={<div className="absolute inset-0 bg-[#0F1520]"></div>}>
        <NeuralBackground />
        <div className="w-full h-[80vh] z-10 mx-6 relative">
          <ChatWindow />
        </div>
      </Suspense>
    </div>
  );
}
