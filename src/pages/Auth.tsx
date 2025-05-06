
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import NeuralBackground from '@/components/NeuralBackground';

// Form validation schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (isLogin) {
        await signIn(data.email, data.password);
      } else {
        await signUp(data.email, data.password);
        // Stay on auth page after signup for login
        setIsLogin(true);
        return;
      }
      navigate('/');
    } catch (error) {
      console.error('Authentication error', error);
      // Error is handled in auth context
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    form.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NeuralBackground />
      <div className="w-full max-w-md z-10">
        <Card className="border-ai-primary dark:border-ai-primary shadow-lg backdrop-blur-sm bg-white/70 dark:bg-slate-900/70">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? 'Enter your credentials to sign in' 
                : 'Sign up for a new account to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@example.com" 
                          type="email" 
                          {...field} 
                          disabled={loading}
                          className="bg-ai-primary/10 dark:bg-ai-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="********" 
                          type="password" 
                          {...field} 
                          disabled={loading}
                          className="bg-ai-primary/10 dark:bg-ai-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <Button 
                variant="link" 
                onClick={toggleAuthMode}
                className="pl-1"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
