import { motion } from 'framer-motion'

const pillars = [
  {
    k: '01',
    tag: 'Measurement',
    accent: '#5BC0EB',
    title: 'Eight fairness signals',
    body: 'Demographic Parity, Equalised Odds, Disparate Impact, Equal Opportunity, and four companion metrics — every value scored against its empirical threshold with a reproducible pass/fail verdict.',
  },
  {
    k: '02',
    tag: 'Reasoning',
    accent: '#E8D5A8',
    title: 'Global + local explainability',
    body: 'SHAP surfaces feature-level contribution; LIME inspects individual predictions. Together they expose the proxy variables that silently encode protected attributes.',
  },
  {
    k: '03',
    tag: 'Intervention',
    accent: '#6EE7C4',
    title: 'AIF360 reweighing',
    body: 'Apply a tested mitigation, compare before/after deltas side by side, and export the complete audit record — every transformation versioned, auditable, and human-reviewable.',
  },
]

export default function AboutSection() {
  return (
    <section id="about" className="relative py-32 md:py-44">
      <div className="mx-auto max-w-[1220px] px-6 md:px-12">
        {/* Top meta */}
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-obs-lumen/70" />
          <span className="section-label">Thesis · Philosophy</span>
        </div>

        {/* Editorial lede — asymmetric */}
        <div className="mt-10 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-7">
            <h2 className="h-display text-[54px] leading-[0.94] text-obs-text md:text-[104px]">
              Built to audit AI <br />
              like a <span className="italic text-obs-lumen">production system</span>.
            </h2>
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-9 md:pt-10">
            <p className="text-pretty text-[16px] leading-[1.75] text-obs-dim md:text-[17px]">
              Fairness is not a finishing touch. FAIRLENS packages eight bias
              metrics, dual-path explainability, and AIF360 mitigation into a
              single unhurried workflow — fast enough to iterate on, rigorous
              enough for external review.
            </p>
            <div className="mt-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-obs-ghost">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-obs-aurora shadow-[0_0_8px_#6EE7C4]" />
              Observatory protocol · v4
            </div>
          </div>
        </div>

        {/* Pillars grid */}
        <div className="mt-24 grid grid-cols-1 gap-5 md:mt-32 md:grid-cols-3">
          {pillars.map((p, idx) => (
            <motion.article
              key={p.k}
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.9, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="glass frame-mark spot group relative overflow-hidden rounded-3xl p-8 md:p-10"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
                e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
              }}
            >
              {/* Corner accent dot */}
              <span
                aria-hidden="true"
                className="absolute right-6 top-6 inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: p.accent, boxShadow: `0 0 12px ${p.accent}` }}
              />

              {/* Number */}
              <div className="flex items-baseline gap-4">
                <span
                  className="h-display text-[72px] leading-none md:text-[96px]"
                  style={{ color: p.accent }}
                >
                  {p.k}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-obs-dim">
                  {p.tag}
                </span>
              </div>

              {/* Title */}
              <h3 className="h-display mt-6 text-[26px] leading-[1.1] text-obs-text md:text-[32px]">
                {p.title}
              </h3>

              {/* Body */}
              <p className="mt-4 text-[14.5px] leading-relaxed text-obs-dim md:text-[15px]">
                {p.body}
              </p>

              {/* Footer rule */}
              <div
                className="mt-10 h-px w-full"
                style={{
                  background: `linear-gradient(90deg, ${p.accent}55, transparent)`,
                }}
              />
              <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-obs-ghost">
                <span>Pillar {idx + 1}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Bottom closing strip */}
        <div className="mt-32 rounded-2xl border border-white/6 bg-white/[0.015] p-6 md:p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="section-label">Principle</div>
              <div className="font-display mt-3 text-[22px] leading-snug text-obs-text md:text-[28px]">
                Measurement without interpretation is just theatre.
              </div>
            </div>
            <a
              href="#audit"
              className="btn border border-white/15 bg-white/[0.04] text-obs-text hover:border-obs-cerulean/50 hover:bg-obs-cerulean/10"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.3em]">
                Run an audit
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
