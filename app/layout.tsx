import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';

export const metadata: Metadata = {
  title: 'EventSync — Real-Time Event Check-In Infrastructure',
  description:
    'Production-grade event management and QR-based check-in platform for modern campus events. Real-time attendance tracking, AI analytics, and offline-first scanning.',
  keywords: 'event check-in, QR code, real-time, attendance, campus events',
  openGraph: {
    title: 'EventSync — Real-Time Event Check-In Infrastructure',
    description: 'Real-time attendance infrastructure for modern campus events.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080d14] antialiased">
        <AuthProvider>
          <div className="relative min-h-screen">
            {children}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
