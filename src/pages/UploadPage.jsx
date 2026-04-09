import UploadBox from "./UploadBox";
import FileCard from "./FileCard";
import ConfigPanel from "./ConfigPanel";

const UploadPage = () => {
  return (
    <div className="pt-8 px-12 pb-24">
      <div className="mb-16">
        <h2 className="text-5xl font-bold tracking-tight text-on-surface mb-4">Upload Dataset</h2>
        <p className="text-on-surface-variant text-xl max-w-2xl font-light">
          Bring your model data into FairLens to begin your automated audit for algorithmic bias and ethical risks.
        </p>
      </div>
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-12">
          <UploadBox />
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-mono uppercase tracking-[0.25em] text-neutral-500">Active Uploads</h4>
              <span className="text-xs text-neutral-600 font-mono">1 item</span>
            </div>
            <FileCard
              name="lending_model_v4_test_data.csv"
              size="14.2 MB"
              rows="142,000"
            />
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <ConfigPanel />
          <div className="bg-surface-container-low card-elevation rounded-3xl p-8 border border-outline-variant/10 group">
            <div className="flex items-start gap-5">
              <div className="p-4 bg-tertiary/10 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-tertiary text-3xl">security</span>
              </div>
              <div>
                <h5 className="font-bold text-lg text-on-surface mb-1">Privacy First</h5>
                <p className="text-sm text-on-surface-variant leading-relaxed font-light">
                  Your data is encrypted end-to-end and automatically purged upon audit completion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
