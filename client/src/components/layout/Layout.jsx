import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background ambient radial glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-indigo-600/30 via-violet-600/15 to-transparent blur-3xl"></div>
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 w-full">
        {children || <Outlet />}
      </main>

      <Footer />
    </div>
  );
}
