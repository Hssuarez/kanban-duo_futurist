import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kanban Duo — High Performance Workspace',
  description: 'Colaboración ágil en tiempo real, gestión de proyectos y seguimiento de tareas de alto rendimiento.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#09090b] text-zinc-100 font-sans antialiased selection:bg-zinc-800 selection:text-zinc-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
