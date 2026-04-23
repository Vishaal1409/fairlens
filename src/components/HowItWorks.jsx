import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const steps = [
  {
    num: '01',
    tag: 'Upload',
    accent: 'text-obs-cerulean',
    accentBg: 'bg-obs-cerulean',
    title: 'Deliver the specimen',
    body: 'Drop a CSV dataset or a pickled model. FAIRLENS infers schema, detects protected attributes, and prepares a provenance record before any measurement begins.',
    stat: '2.1 MB / s',
    statLabel: 'Median ingest',
    glyph: (
      <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    num: '02',
    tag: 'Measure',
    accent: 'text-obs-lumen',
    accentBg: 'bg-obs-lumen',
    title: 'Read the instrument',
    body: 'Eight concurrent fairness metrics — Demographic Parity, Equalized Odds, Disparate Impact, Equal Opportunity and four more — rendered with SHAP/LIME explanations and intersectional heatmaps.',
    stat: '8 signals',
    statLabel: 'Parallel computation',
    glyph: (
      <>
        <path d="M4 20V6m4 14V10m4 10V4m4 16v-8m4 8V8" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    num: '03',
    tag: 'Mitigate',
    accent: 'text-obs-aurora',
    accentBg: 'bg-obs-aurora',
    title: 'Restore the balance',
    body: 'Apply AIF360 reweighing, inspect before/after deltas, and export the full audit as a reproducible report. Every transformation is logged, versioned, and human-reviewable.',
    stat: '−42% ΔP',
    statLabel: 'Typical improvement',
    glyph: (
      <>
        <path d="M12 3l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V7l8-4z" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
]

export default function HowItWorks() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 80%', 'end 30%'],
  })
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section
      id="how"
      ref={containerRef}
      className="relative py-32 md:py-40"
      style={{
        background:
          'linear-gradient(180deg, transparent 0%, rgba(10,12,18,0.4) 20%, rgba(10,12,18,0.4) 80%, transparent 100%)',
      }}
    >
      <div className="mx-auto max-w-[1220px] px-6 md:px-12">
        {/* Section header — asymmetric editorial */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-5">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-obs-cerulean/70" />
              <span className="section-label">Method · Process</span>
            </div>
            <h2 className="h-display mt-6 text-[52px] text-obs-text md:text-[80px]">
              Three <span className="italic text-obs-lumen">observations</span>,
              one truth.
            </h2>
          </div>

          <div className="col-span-12 md:col-span-6 md:col-start-7 md:mt-20">
            <p className="text-pretty text-[16px] leading-relaxed text-obs-dim md:text-[17px]">
              FAIRLENS treats every audit as a scientific observation —
              instrumented, repeatable, and accompanied by its own record of
              provenance. The process is designed to surface disparate outcomes
              without flattening the underlying causes.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative mt-24 md:mt-32">
          {/* Vertical guide line (background) */}
          <div
            aria-hidden="true"
            className="absolute left-[28px] top-0 bottom-0 w-px bg-white/8 md:left-[34px]"
          />
          {/* Scroll-filled progress line */}
          <motion.div
            aria-hidden="true"
            style={{ height: lineHeight }}
            className="absolute left-[28px] top-0 w-px bg-gradient-to-b from-obs-cerulean via-obs-lumen to-obs-aurora md:left-[34px]"
          />

          <ol className="space-y-20 md:space-y-28">
            {steps.map((s, idx) => (
              <li key={s.num} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 36, filter: 'blur(10px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  className="grid grid-cols-[58px_1fr] gap-4 md:grid-cols-[92px_1fr] md:gap-10"
                >
                  {/* Pin */}
                  <div className="relative">
                    <div className="relative z-10 flex h-[58px] w-[58px] items-center justify-center rounded-full border border-white/10 bg-obs-void/90 backdrop-blur-md md:h-[68px] md:w-[68px]">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className={s.accent}
                      >
                        {s.glyph}
                      </svg>
                      <span className={`absolute -inset-1 rounded-full ${s.accentBg} opacity-[0.08] blur-xl`} />
                    </div>
                  </div>

                  {/* Card */}
                  <div className="glass frame-mark relative rounded-3xl p-7 md:p-10">
                    {/* Row 1: meta */}
                    <div className="flex flex-wrap items-center gap-4">
                      <span className={`h-display text-[48px] leading-none md:text-[64px] ${s.accent}`}>
                        {s.num}
                      </span>
                      <span className="h-px w-12 bg-white/15" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-obs-dim">
                        {s.tag}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="h-display mt-5 text-[30px] leading-[1.05] text-obs-text md:text-[40px]">
                      {s.title}
                    </h3>

                    {/* Body */}
                    <p className="mt-4 max-w-[620px] text-[15px] leading-relaxed text-obs-dim md:text-[16px]">
                      {s.body}
                    </p>

                    {/* Footer: stat + step index */}
                    <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-white/8 pt-5">
                      <div>
                        <div className={`num-display text-[28px] ${s.accent}`}>{s.stat}</div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-obs-dim">
                          {s.statLabel}
                        </div>
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-obs-ghost">
                        Step {idx + 1} of {steps.length}
                      </div>
                    </div>

                    {/* Edge bloom */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-500 hover:opacity-100`}
                      style={{
                        background: `linear-gradient(120deg, transparent, ${
                          ['rgba(91,192,235,0.18)', 'rgba(232,213,168,0.16)', 'rgba(110,231,196,0.18)'][idx]
                        }, transparent)`,
                      }}
                    />
                  </div>
                </motion.div>
              </li>
            ))}
          </ol>
        </div>

        {/* Closing hairline note */}
        <div className="mt-24 flex items-center gap-4 md:mt-32">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-obs-dim">
            End of method
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      </div>
    </section>
  )
}
