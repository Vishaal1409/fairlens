import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: "Upload", icon: "cloud_upload", path: "/" },
  { label: "Results", icon: "analytics", path: "/results" },
  { label: "Explainability", icon: "psychology", path: "/explain" },
  { label: "Mitigation", icon: "auto_fix_high", path: "/mitigate" },
  { label: "Scorecard", icon: "fact_check", path: "/scorecard" }
];

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#121315] border-r border-white/5 flex flex-col py-6 px-4 z-50">
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-bold tracking-tighter gradient-text">FairLens</h1>
        <p className="mono text-[9px] text-gray-500 uppercase tracking-widest mt-1">v1.0.4 Premium Audit</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all ${
                isActive 
                ? "bg-[#6b2fbf]/10 text-[#d6baff] border border-[#6b2fbf]/20 soft-shadow" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="p-4 rounded-2xl glass-panel border border-white/5">
           <p className="text-[10px] mono text-gray-500 mb-2">AUDIT CREDITS</p>
           <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#6b2fbf] to-[#d6baff] w-[40%]"></div>
           </div>
        </div>
        <button className="premium-btn w-full py-3 rounded-xl text-white font-bold text-xs uppercase tracking-widest">
          New Audit Session
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;