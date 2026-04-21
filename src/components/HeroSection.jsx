import React from 'react';
import { motion } from 'framer-motion';

export default function HeroSection({
  eyebrow = 'AI FAIRNESS AUDIT PLATFORM',
  title = 'FAIRLENS',
  subtitle = 'Audit, explain, and mitigate bias with high-signal metrics and traceable evidence.',
  rightSlot,
}) {
  const letters = String(title).split('');

  return (
    <section className="relative min-h-dvh flex items-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 micro-grid opacity-[0.55]" />
        <div className="absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full blur-[100px] bg-[rgba(34,211,238,0.16)]" />
        <div className="absolute -bottom-48 -right-32 h-[620px] w-[620px] rounded-full blur-[110px] bg-[rgba(167,139,250,0.14)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="relative z-10 w-full">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 lg:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-mono text-[11px] uppercase tracking-[0.34em] text-white/70"
            >
              {eyebrow}
            </motion.p>

            <div className="mt-5">
              <motion.h1
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.035, delayChildren: 0.08 } },
                }}
                className="leading-none tracking-[-0.08em] font-black select-none"
              >
                <span className="block text-[64px] sm:text-[92px] md:text-[128px] lg:text-[156px]">
                  {letters.map((ch, i) => (
                    <motion.span
                      key={`${ch}-${i}`}
                      variants={{
                        hidden: { opacity: 0, y: 22, filter: 'blur(10px)' },
                        show: { opacity: 1, y: 0, filter: 'blur(0px)' },
                      }}
                      transition={{ duration: 0.55, ease: [0.2, 0.9, 0.2, 1] }}
                      className="inline-block shimmer-text"
                    >
                      {ch === ' ' ? '\u00A0' : ch}
                    </motion.span>
                  ))}
                </span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.22 }}
                className="mt-4"
              >
                <p className="text-[15px] sm:text-[16px] text-p leading-relaxed max-w-2xl">
                  {subtitle}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass glass-stroke glass-card">
                    <span className="w-1.5 h-1.5 rounded-full bg-[--cyan] shadow-[0_0_18px_rgba(34,211,238,0.45)]" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.20em] text-muted">
                      Bento Dashboard
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass glass-stroke glass-card">
                    <span className="w-1.5 h-1.5 rounded-full bg-[--lime] shadow-[0_0_18px_rgba(163,255,18,0.40)]" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.20em] text-muted">
                      Scroll-toggled Metrics
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass glass-stroke glass-card">
                    <span className="w-1.5 h-1.5 rounded-full bg-[--success] shadow-[0_0_18px_rgba(29,233,182,0.36)]" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.20em] text-muted">
                      Before → After Mitigation
                    </span>
                  </span>
                </div>
              </motion.div>
            </div>
            </div>

            <div className="col-span-12 lg:col-span-5">
              {rightSlot}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

