
import ChatWindow from "../components/ChatWindow";
import NeuralBackground from "../components/NeuralBackground";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NeuralBackground />
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-sm h-[80vh] rounded-xl shadow-lg overflow-hidden z-10">
        <ChatWindow />
      </div>
    </div>
  );
};

export default Index;
