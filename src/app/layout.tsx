import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ToastProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Oftalmología | Turnos Online',
  description: 'Reservá turnos para exámenes de la vista, controles y consultas oftalmológicas.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-fondo font-sans text-slate-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
