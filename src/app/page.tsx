
'use client';

import { lazy, Suspense } from 'react';

// Dynamically import the ChatWindow component to avoid server/client mismatches
const NeuralBackground = lazy(() => import('../components/NeuralBackground'));

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <NeuralBackground />
        {/* Chat window is now invisible */}
        <div className="w-full max-w-4xl opacity-0 h-[80vh] z-10">
          {/* Content is invisible but still loaded */}
        </div>
      </Suspense>
    </div>
  );
}
