
import ChatWindow from "../components/ChatWindow";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ai-background p-4">
      <div className="w-full max-w-4xl bg-white h-[80vh] rounded-xl shadow-lg overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
};

export default Index;
