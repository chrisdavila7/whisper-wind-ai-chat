
import NeuralBackground from "../components/NeuralBackground";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NeuralBackground />
      {/* Chat window is now visible */}
      <div className="w-full max-w-4xl h-[80vh] z-10">
        {/* Content is now visible */}
      </div>
    </div>
  );
};

export default Index;
