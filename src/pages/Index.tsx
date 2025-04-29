
import NeuralBackground from "../components/NeuralBackground";
import ChatWindow from "../components/ChatWindow";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NeuralBackground />
      <div className="w-full max-w-4xl h-[80vh] z-10">
        <ChatWindow />
      </div>
    </div>
  );
};

export default Index;
