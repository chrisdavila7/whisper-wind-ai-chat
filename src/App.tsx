import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
// import DebugMenu from "@/components/debug/DebugMenu";

// Pages
import Landing from "./pages/Landing";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Create a client instance outside the component function
const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Protected routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/chat/:id" element={<Chat />} />
                  </Route>
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              {/* {import.meta.env.DEV && <DebugMenu />} */}
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

export default App;
