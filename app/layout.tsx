import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'CHAY SOLE',
    description: 'Internal ad creative library for CHAY SOLE',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
          <html lang="en">
                <head>
                        <link rel="preconnect" href="https://fonts.googleapis.com" />
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
                </head>head>
                <body className="font-sans bg-white text-black antialiased">{children}</body>body>
          </html>html>
        );
}</html>
