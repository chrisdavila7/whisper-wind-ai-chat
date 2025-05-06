import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, MessageSquarePlus, LogIn, User } from 'lucide-react';
import NeuralBackground from '@/components/NeuralBackground';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ThemeToggle from '@/components/ThemeToggle';

// Type for conversation data
interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

const Landing = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch recent conversations when user is logged in
  useEffect(() => {
    const fetchRecentConversations = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('conversations')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        setRecentConversations(data || []);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentConversations();
  }, [user]);

  // Navigate to auth page
  const handleAuthClick = () => {
    navigate('/auth');
  };

  // Start a new chat
  const handleNewChat = () => {
    navigate('/chat');
  };

  // Open an existing chat
  const handleOpenChat = (id: string) => {
    navigate(`/chat/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Neural Background - Ensure this is always rendered */}
      <NeuralBackground />
      
      {/* Theme Toggle - Added to top right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      {/* Content Container - Use relative position and z-10 to ensure it's above the background */}
      <div className="w-full max-w-4xl z-10 space-y-6 relative">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-2">
            Welcome to AI Chat
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Your personal AI assistant for meaningful conversations
          </p>
        </div>

        {/* Main content section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat section */}
          <Card className="backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 border-ai-primary dark:border-ai-primary shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Experience
              </CardTitle>
              <CardDescription>
                Start a new conversation or continue where you left off
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 justify-center"
              >
                <MessageSquarePlus className="h-5 w-5" />
                Start New Chat
              </Button>
              
              {user && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Recent Conversations</h3>
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : recentConversations.length > 0 ? (
                    <ul className="space-y-2">
                      {recentConversations.map((conversation) => (
                        <li key={conversation.id}>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-left truncate"
                            onClick={() => handleOpenChat(conversation.id)}
                          >
                            {conversation.title}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account section */}
          <Card className="backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 border-ai-primary dark:border-ai-primary shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account
              </CardTitle>
              <CardDescription>
                {user 
                  ? `Signed in as ${user.email}` 
                  : 'Sign in to save and manage your conversations'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-4">
                    <p className="text-sm font-medium">User Profile</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm">
                    Create an account to save your conversations and access them from anywhere.
                  </p>
                  <Button 
                    className="w-full flex items-center gap-2 justify-center"
                    onClick={handleAuthClick}
                  >
                    <LogIn className="h-5 w-5" />
                    Sign In / Sign Up
                  </Button>
                </>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Your data is securely stored and never shared.
            </CardFooter>
          </Card>
        </div>

        {/* Features section */}
        <Card className="mt-8 backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 border-gray-300 dark:border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-ai-primary/10 dark:bg-ai-primary/20 rounded-md">
                <h3 className="font-medium mb-2">Natural Conversations</h3>
                <p className="text-sm text-muted-foreground">Engage in human-like discussions with our advanced AI</p>
              </div>
              <div className="p-4 bg-ai-primary/10 dark:bg-ai-primary/20 rounded-md">
                <h3 className="font-medium mb-2">Conversation History</h3>
                <p className="text-sm text-muted-foreground">Save and revisit your conversations anytime</p>
              </div>
              <div className="p-4 bg-ai-primary/10 dark:bg-ai-primary/20 rounded-md">
                <h3 className="font-medium mb-2">Seamless Experience</h3>
                <p className="text-sm text-muted-foreground">Enjoy a beautiful interface that works across devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Landing;
