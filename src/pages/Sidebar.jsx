import { useState } from "react";

const navItems = [
  { id: "upload",         label: "Upload",         icon: "cloud_upload" },
  { id: "results",        label: "Results",        icon: "analytics" },
  { id: "explainability", label: "Explainability", icon: "psychology" },
  { id: "mitigation",     label: "Mitigation",     icon: "auto_fix_high" },
];

const Sidebar = ({ activePage, onNavigate }) => {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#1b1c1d] flex flex-col py-8 px-4 z-50">
      {/* Logo */}
      <div className="mb-10 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d6baff] to-[#6b2fbf] flex items-center justify-center">
            <span
              className="material-symbols-outlined text-white text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >lens</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-[#d6baff]">FairLens</h1>
            <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-[0.2em]">The Ethical Lens</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 text-left ${
                isActive
                  ? "text-[#d6baff] border-l-4 border-[#d6baff] bg-[#1f2021] font-semibold shadow-[inset_0_0_20px_rgba(214,186,255,0.05)]"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-[#38393a]"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium text-sm tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto space-y-2">
        <button className="w-full mb-6 py-3 rounded-xl bg-[#6b2fbf] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
          <span className="material-symbols-outlined text-sm">add</span>
          New Audit
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-neutral-200 hover:bg-[#38393a] transition-all duration-200">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-medium text-sm tracking-tight">Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-neutral-200 hover:bg-[#38393a] transition-all duration-200">
          <span className="material-symbols-outlined">help_outline</span>
          <span className="font-medium text-sm tracking-tight">Support</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
