import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KANBAN//DUO - Cyberpunk Task Protocol',
  description: 'Colaboración futurista de tareas en tiempo real con seguridad cibernética y panel de control.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#080a11] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
