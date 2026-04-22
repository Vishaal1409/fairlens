import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const steps = [
  {
    k: '01',
    label: 'Upload',
    color: 'text-jscolors-accent-teal',
    title: 'Upload Your Data',
    body: 'Drop a CSV dataset or a pickled ML model. We accept any structured tabular format.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    k: '02',
    label: 'Analyze',
    color: 'text-jscolors-accent-violet',
    title: 'Detect Bias Instantly',
    body: 'Run all 8 fairness metrics simultaneously — Demographic Parity, Equalized Odds, Disparate Impact and more.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 20V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 20V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    k: '03',
    label: 'Mitigate',
    color: 'text-jscolors-accent-green',
    title: 'Apply Mitigation',
    body: 'AIF360 Reweighing restructures your dataset. Compare before and after with live visualizations.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function HowItWorks() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 })

  return (
    <section id="how" ref={ref} className="bg-jscolors-deep py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <div className="section-label text-jscolors-accent-teal">PROCESS</div>
          <h2 className="mt-3 text-[38px] md:text-[52px] font-bold text-jscolors-text-primary">
            Three steps to fairness
          </h2>
        </div>

        <div className="relative mt-14">
          <div className="absolute left-5 top-6 bottom-6 hidden w-[calc(100%-40px)] md:block">
            
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((s, idx) => (
              <motion.div
                key={s.k}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: idx * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs tracking-[0.3em] text-jscolors-text-muted">
                      STEP {s.k} — <span className={s.color}>{s.label}</span>
                    </div>
                    <div className="mt-3 text-xl font-semibold text-jscolors-text-primary">
                      {s.title}
                    </div>
                  </div>
                  <div className={['mt-1', s.color].join(' ')}>{s.icon}</div>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-jscolors-text-secondary">
                  {s.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

