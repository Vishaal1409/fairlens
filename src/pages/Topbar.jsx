const Topbar = () => {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-transparent backdrop-blur-xl flex items-center justify-between px-12 z-40">
      <span className="text-sm font-mono text-[#d6baff] bg-[#6b2fbf]/20 px-3 py-1.5 rounded-md font-semibold tracking-widest uppercase">
        FairLens Beta
      </span>
      <div className="flex items-center gap-4 text-neutral-400">
        <span className="material-symbols-outlined cursor-pointer hover:text-white transition-colors">notifications</span>
        <span className="material-symbols-outlined cursor-pointer hover:text-white transition-colors">account_circle</span>
      </div>
    </header>
  );
};

export default Topbar;
