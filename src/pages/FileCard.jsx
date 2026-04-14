const FileCard = ({ name = "file.csv", size = "0 MB", rows = "0", onDelete }) => {
  return (
    <div className="bg-surface-container-low card-elevation rounded-3xl p-6 flex items-center justify-between border border-outline-variant/10 hover:border-primary/20 transition-all group">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-primary-container/20 rounded-2xl flex items-center justify-center shadow-inner">
          <span className="material-symbols-outlined text-primary text-2xl">table_rows</span>
        </div>
        <div>
          <p className="font-semibold text-lg text-on-surface group-hover:text-primary transition-colors">{name}</p>
          <p className="text-sm text-on-surface-variant mono mt-1">
            {size} • {rows} rows • <span className="text-tertiary">Verified</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onDelete}
          className="p-2 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
        <span className="material-symbols-outlined text-tertiary text-3xl">check_circle</span>
      </div>
    </div>
  );
};

export default FileCard;
