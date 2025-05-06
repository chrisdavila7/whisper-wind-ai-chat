import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@supabase/supabase-js';

const DebugMenu: React.FC = () => {
  const { setDebugUser } = useAuth();

  // Only render the menu in development mode
  if (!import.meta.env.DEV || !setDebugUser) {
    return null;
  }

  const handleLoginBypass = () => {
    console.log("Login Bypass clicked - Attempting to set debug user...");
    // Create a fake user object conforming to Supabase's User type structure
    const fakeUserId = crypto.randomUUID(); // Generate a valid UUID
    console.log(`Generated debug user ID: ${fakeUserId}`); // Log the generated UUID
    const fakeUser: User = {
      id: fakeUserId, // Use the generated UUID
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { name: 'Debug User', email: 'debug@example.com' }, // Store custom info here
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email: 'debug@example.com',
      // Add other required fields if necessary, check Supabase User type for details
      // For example:
      // email_confirmed_at: new Date().toISOString(), 
      // role: 'authenticated',
    };

    if (setDebugUser) { 
      setDebugUser(fakeUser);
      console.log("Debug user should be set.");
    } else {
      console.error("setDebugUser function not available in context!");
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '8px',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <h4 style={{ margin: 0, paddingBottom: '5px', borderBottom: '1px solid #555' }}>
        🛠️ Debug Menu
      </h4>
      <Button variant="destructive" size="sm" onClick={handleLoginBypass}>
        Bypass Login
      </Button>
      {/* Add other debug buttons/controls here */}
    </div>
  );
};

export default DebugMenu;
