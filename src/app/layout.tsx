
import { ReactNode } from 'react';
import '../index.css';

export const metadata = {
  title: 'AI Chat App',
  description: 'A full-stack Next.js 14 AI chat application',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
