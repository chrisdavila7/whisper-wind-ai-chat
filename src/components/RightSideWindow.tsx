import React from 'react';

interface RightSideWindowProps {
  isVisible: boolean;
}

const RightSideWindow: React.FC<RightSideWindowProps> = ({ isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto p-4 border-ai-primary dark:border-ai-primary border-l-2 border-r-2 border-b-2 rounded-b-15 border-t-2 rounded-t-15 bg-ai-primary/10 dark:bg-ai-primary/20 backdrop-blur-sm relative shadow-xl">
      <div className="flex flex-col items-center justify-center text-center p-4 sm:p-6 md:p-8 backdrop-blur-sm rounded-15 bg-white/0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-2 sm:mb-3 md:mb-4 rounded-full bg-gradient-to-r from-ai-primary/80 to-ai-secondary/80 flex items-center justify-center shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-slate-700 dark:text-slate-300">Side Window</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-[80%] sm:max-w-xs">
          This is the side window panel that can be used for additional content.
        </p>
      </div>
    </div>
  );
};

export default RightSideWindow;
