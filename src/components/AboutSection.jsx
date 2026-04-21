export default function AboutSection() {
  return (
    <section id="about" className="bg-jscolors-void py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <div className="section-label text-jscolors-text-secondary">ABOUT</div>
          <h2 className="mt-3 text-[38px] md:text-[52px] font-bold text-jscolors-text-primary">
            Built to audit AI like a production system
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-jscolors-text-secondary">
            FairLens runs an end-to-end fairness audit on tabular ML systems: 8 bias metrics, SHAP/LIME
            explainability, and AIF360 mitigation—packaged into a single, visual workflow that’s fast
            enough for iteration and rigorous enough for review.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="card">
            <div className="section-label text-jscolors-accent-teal">METRICS</div>
            <div className="mt-3 text-lg font-semibold text-jscolors-text-primary">8 fairness signals</div>
            <p className="mt-2 text-sm text-jscolors-text-secondary">
              Demographic Parity, Equalized Odds, Disparate Impact, Equal Opportunity, and more—scored
              against thresholds with clear pass/fail status.
            </p>
          </div>
          <div className="card">
            <div className="section-label text-jscolors-accent-violet">EXPLAIN</div>
            <div className="mt-3 text-lg font-semibold text-jscolors-text-primary">Global + local reasoning</div>
            <p className="mt-2 text-sm text-jscolors-text-secondary">
              SHAP for feature influence and LIME for instance-level explanations—so you can spot proxy
              variables and unstable decision boundaries quickly.
            </p>
          </div>
          <div className="card">
            <div className="section-label text-jscolors-accent-green">MITIGATE</div>
            <div className="mt-3 text-lg font-semibold text-jscolors-text-primary">AIF360 reweighing</div>
            <p className="mt-2 text-sm text-jscolors-text-secondary">
              Compare before/after metrics and visualize improvement deltas to validate mitigation
              without guessing.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

