
import NeuralBackground from "../components/NeuralBackground";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NeuralBackground />
      {/* Chat window is now invisible */}
      <div className="w-full max-w-4xl opacity-0 h-[80vh] z-10">
        {/* Content is invisible but still loaded */}
      </div>
    </div>
  );
};

export default Index;
