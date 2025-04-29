
'use client';

import { lazy, Suspense } from 'react';

// Dynamically import the NeuralBackground component to avoid server/client mismatches
const NeuralBackground = lazy(() => import('../components/NeuralBackground'));
const ChatWindow = lazy(() => import('../components/ChatWindow'));

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <NeuralBackground />
        <div className="w-full max-w-4xl h-[80vh] z-10">
          <ChatWindow />
        </div>
      </Suspense>
    </div>
  );
}
