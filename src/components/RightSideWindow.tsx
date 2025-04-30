
import { useEffect, useRef } from 'react';

interface RightSideWindowProps {
  isVisible: boolean;
}

const RightSideWindow = ({
  isVisible
}: RightSideWindowProps) => {
  const sideWindowRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={sideWindowRef} 
      className={`fixed top-0 right-0 h-[80vh] w-1/3 transform transition-transform duration-300 ${isVisible ? 'translate-x-0' : 'translate-x-full'}`} 
      style={{
        marginTop: '10vh'
      }}
    >
      <div className="flex-1 overflow-y-auto p-4 border-gray-500 border-l-4 border-r-4 border-b-4 rounded-b-15 border-t-4 rounded-t-15 h-full bg-white/10 backdrop-blur-md mx-4 sm:mx-8 md:mx-16 relative">
        <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 md:p-8 backdrop-blur-md rounded-15 bg-white/0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-2 sm:mb-3 md:mb-4 rounded-full bg-gradient-to-r from-ai-primary/80 to-ai-secondary/80 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-slate-500">Side Window</h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-[80%] sm:max-w-xs">
            This is the side window panel that can be used for additional content.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RightSideWindow;
