
import NeuralBackground from "../components/NeuralBackground";
import ChatWindow from "../components/ChatWindow";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-0">
      <NeuralBackground />
      <div className="w-full h-[80vh] z-10 mx-4">
        <ChatWindow />
      </div>
    </div>
  );
};

export default Index;
