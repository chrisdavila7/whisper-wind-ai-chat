
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, Suspense, lazy } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";

// Lazy load pages to improve initial load time
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Create a loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
  </div>
);

const App = () => {
  // Create a client instance with optimized settings
  const [queryClient] = useState(() => 
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false, // Disable refetching when window regains focus
          staleTime: 60000, // Data remains fresh for 1 minute
          retry: 1, // Only retry once on failure
          // Removed suspense property as it's not supported in the current version
        },
      },
    })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
