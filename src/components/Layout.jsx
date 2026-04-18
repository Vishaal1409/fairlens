import React from 'react';
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#121315] text-[#e3e2e3]">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative overflow-hidden">
        {/* Top Header with your Glass Panel class */}
        <header className="h-14 flex items-center px-8 glass-panel border-b border-white/5 sticky top-0 z-40">
           <span className="gradient-text font-mono text-[10px] tracking-widest uppercase font-bold">
             FairLens System Protocol
           </span>
        </header>

        {/* Scrollable Main Area */}
        <main className="p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;