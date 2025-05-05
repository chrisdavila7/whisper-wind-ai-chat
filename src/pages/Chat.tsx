
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../integrations/supabase/client";
import ChatWindow from "../components/ChatWindow";
import NeuralBackground from "../components/NeuralBackground";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Conversation type definition
interface Conversation {
  id: string;
  title: string;
}

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch conversation details if an ID is provided
  useEffect(() => {
    const fetchConversation = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("conversations")
          .select("id, title")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) {
          throw error;
        }

        setConversation(data);
      } catch (error) {
        console.error("Error fetching conversation:", error);
        toast({
          title: "Error",
          description: "Could not load the conversation. Redirecting to home.",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [id, user, navigate, toast]);

  // Create a new conversation if none is specified
  useEffect(() => {
    const initializeConversation = async () => {
      if (id || !user || conversation) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("conversations")
          .insert([
            {
              user_id: user.id,
              title: `New conversation ${new Date().toLocaleString()}`,
            },
          ])
          .select("id, title")
          .single();

        if (error) throw error;

        // Update the URL to include the new conversation ID
        navigate(`/chat/${data.id}`, { replace: true });
        setConversation(data);
      } catch (error) {
        console.error("Error creating conversation:", error);
        toast({
          title: "Error",
          description: "Failed to start a new conversation. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initializeConversation();
    }
  }, [id, user, conversation, navigate, toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <NeuralBackground />
      
      {/* Header with back button */}
      <header className="p-4 z-10 relative">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          {conversation && (
            <h1 className="text-lg font-medium truncate max-w-md">
              {conversation.title}
            </h1>
          )}
        </div>
      </header>
      
      {/* Chat content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          conversation && <ChatWindow key={conversation.id} conversationId={conversation.id} />
        )}
      </div>
    </div>
  );
};

export default Chat;
