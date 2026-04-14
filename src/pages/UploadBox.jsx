const UploadBox = () => {
  return (
    <div className="drop-zone-border bg-surface-container-low card-elevation min-h-[460px] flex flex-col items-center justify-center p-16 transition-all hover:bg-surface-container duration-300 group cursor-pointer relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-colors"></div>
      <div className="w-24 h-24 rounded-3xl bg-surface-container-high flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-500 shadow-xl">
        <span
          className="material-symbols-outlined text-primary text-5xl"
          style={{ fontVariationSettings: "'wght' 200" }}
        >upload_file</span>
      </div>
      <h3 className="text-3xl font-semibold mb-3 tracking-tight">Drag &amp; drop dataset</h3>
      <p className="text-on-surface-variant text-lg mb-10 font-light">Support for .CSV, .JSON, and .Parquet files</p>
      <button className="px-10 py-4 rounded-full border border-outline-variant bg-surface-container-high/50 text-base font-semibold hover:bg-surface-bright hover:border-primary/30 transition-all active:scale-95">
        Browse Files
      </button>
    </div>
  );
};

export default UploadBox;
