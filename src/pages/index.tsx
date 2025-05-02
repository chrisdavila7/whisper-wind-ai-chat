
import { Suspense, lazy } from "react";
import NeuralBackground from "../components/NeuralBackground";
// Use lazy loading for ChatWindow to improve initial load time
const ChatWindow = lazy(() => import("../components/ChatWindow"));

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-0">
      <NeuralBackground />
      <div className="w-full h-[80vh] z-10 mx-6">
        <Suspense fallback={<div className="flex items-center justify-center h-full">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>}>
          <ChatWindow />
        </Suspense>
      </div>
    </div>
  );
};

export default Index;
