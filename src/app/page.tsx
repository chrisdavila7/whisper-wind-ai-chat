
'use client';

import { lazy, Suspense } from 'react';

// Dynamically import the NeuralBackground component to avoid server/client mismatches
const NeuralBackground = lazy(() => import('../components/NeuralBackground'));
const ChatWindow = lazy(() => import('../components/ChatWindow'));

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-0">
      <Suspense fallback={<div>Loading...</div>}>
        <NeuralBackground />
        <div className="w-full h-[80vh] z-10 mx-4">
          <ChatWindow />
        </div>
      </Suspense>
    </div>
  );
}
