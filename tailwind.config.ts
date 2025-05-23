
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        merriweather: ['"Merriweather"', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '15': '15px', // Added new border radius size
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        ai: {
          primary: '#85A0C8', // Light blue, similar to neural network
          secondary: '#5578A0', // Darker blue, similar to neural network
          background: '#F8FAFC', // Light gray background
          text: '#1A1F2C', // Keep dark text for good contrast
          accent: '#6495ED', // Cornflower blue for accents
          dark: {
            primary: '#6495ED', // Cornflower blue for dark mode
            secondary: '#48769F', // Darker blue for dark mode
            background: '#1A1F2C', // Dark background
            text: '#F8FAFC', // Light text for dark mode
            accent: '#85A0C8', // Light blue accent for dark mode
          }
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'typing': {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        },
        'blink': {
          '50%': { borderColor: 'transparent' }
        },
        'bounce-right': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(3px)' }
        },
        'gradient-animation': {
          '0%': { backgroundPosition: '0% 0%' },
          '25%': { backgroundPosition: '50% 50%' },
          '50%': { backgroundPosition: '100% 100%' },
          '75%': { backgroundPosition: '50% 50%' },
          '100%': { backgroundPosition: '0% 0%' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.32s ease-out', // from 0.2s to 0.32s
        'accordion-up': 'accordion-up 0.32s ease-out', // from 0.2s to 0.32s
        'fade-in': 'fade-in 0.48s ease-out', // from 0.3s to 0.48s
        'fade-out': 'fade-out 0.48s ease-out', // from 0.3s to 0.48s
        'scale-in': 'scale-in 0.32s ease-out', // from 0.2s to 0.32s
        'scale-out': 'scale-out 0.32s ease-out', // from 0.2s to 0.32s
        'slide-in-right': 'slide-in-right 0.48s ease-out', // from 0.3s to 0.48s
        'slide-out-right': 'slide-out-right 0.48s ease-out', // from 0.3s to 0.48s
        
        // Combined Animations - also slowed down by 60%
        'enter': 'fade-in 0.48s ease-out, scale-in 0.32s ease-out',
        'exit': 'fade-out 0.48s ease-out, scale-out 0.32s ease-out',
        
        // The following animations are not part of connection flow, so also slowed down
        'typing': 'typing 2.4s steps(40, end)', // from 1.5s to 2.4s
        'blink': 'blink 1.12s infinite', // from 0.7s to 1.12s
        'bounce-right': 'bounce-right 1.6s infinite', // from 1s to 1.6s
        'gradient-animation': 'gradient-animation 15s ease infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
