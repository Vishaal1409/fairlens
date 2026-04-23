/**
 * FAIRLENS visual audit — captures the running dev server across viewports
 * and (optionally) performs a full upload → analyse → results flow using a
 * real CSV.
 *
 * Usage:
 *   node scripts/screenshots.mjs                     # writes to screenshots/before/
 *   node scripts/screenshots.mjs after               # writes to screenshots/after/
 *   BASE_URL=http://localhost:5175 node scripts/screenshots.mjs
 *   SAMPLE_CSV="C:/path/to/data.csv" node scripts/screenshots.mjs
 */
import { chromium } from 'playwright'
import { mkdir, rm, access } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:5175'
const PASS = process.argv[2] || 'before'
const OUT = path.resolve(`screenshots/${PASS}`)
const SAMPLE_CSV =
  process.env.SAMPLE_CSV ||
  'C:/Users/shrut/Downloads/ML_Workshop/CarPrice_Assignment.csv'
// Columns tuned for CarPrice_Assignment.csv. Override via env if using another file.
const PROTECTED_COL = process.env.PROTECTED_COL || 'fueltype'
const TARGET_COL    = process.env.TARGET_COL    || 'price'

/* ─── utilities ─────────────────────────────────────────────────────────── */
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForFonts(page) {
  await page.evaluate(async () => {
    if (document.fonts?.load) {
      // Force-load the three families we actually use — in-app navigations
      // don't automatically trigger font loading like full page loads do.
      await Promise.all([
        document.fonts.load('400 80px "Instrument Serif"'),
        document.fonts.load('italic 80px "Instrument Serif"'),
        document.fonts.load('500 14px "Geist"'),
        document.fonts.load('400 12px "Geist Mono"'),
      ]).catch(() => {})
    }
    if (document.fonts?.ready) await document.fonts.ready
  })
}

async function shot(page, name, { full = false } = {}) {
  await wait(350)
  const out = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: out, fullPage: full })
  console.log(`  · ${name}`)
}

async function scrollTo(page, selector) {
  const ok = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return false
    el.scrollIntoView({ behavior: 'instant', block: 'start' })
    return true
  }, selector)
  await wait(900)
  return ok
}

async function scrollBy(page, y) {
  await page.evaluate((offset) => window.scrollTo({ top: offset, behavior: 'instant' }), y)
  await wait(600)
}

/** Scroll down in chunks so every whileInView section is triggered, then back up. */
async function scrollThrough(page) {
  const doc = await page.evaluate(() => document.body.scrollHeight)
  const vh = await page.evaluate(() => window.innerHeight)
  for (let y = 0; y < doc; y += vh * 0.7) {
    await page.evaluate((offset) => window.scrollTo(0, offset), y)
    await wait(400)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await wait(400)
}

/* ─── full upload flow ──────────────────────────────────────────────────── */
async function uploadAndAnalyse(page) {
  if (!existsSync(SAMPLE_CSV)) {
    console.log(`  ⚠  Sample CSV not found at ${SAMPLE_CSV} — falling back to injected state`)
    return false
  }

  // Scroll to upload section
  await scrollTo(page, '#audit')

  // Find and populate the hidden file input
  const fileInput = await page.locator('input[type="file"][accept*="csv"]').first()
  await fileInput.setInputFiles(SAMPLE_CSV)
  console.log('  · uploaded CSV to intake')

  // Wait for the config panel (selects appear after upload response)
  try {
    await page.waitForSelector('select', { timeout: 30000 })
  } catch {
    console.log('  ⚠  upload response timed out — backend may be cold')
    return false
  }
  await wait(600)
  await shot(page, 'desktop-05b-upload-populated')

  // Pick columns (tolerate missing options — fall back to first/second)
  const selects = await page.locator('select').all()
  if (selects.length >= 2) {
    const options = await selects[0].locator('option').allTextContents()
    const pick = (name) => options.includes(name) ? name : options[1] || options[0]
    await selects[0].selectOption(pick(PROTECTED_COL))
    await selects[1].selectOption(pick(TARGET_COL))
    console.log(`  · selected protected=${pick(PROTECTED_COL)} target=${pick(TARGET_COL)}`)
  }

  // Click "Run Fairness Audit"
  const runBtn = page.getByRole('button', { name: /run fairness audit/i })
  await runBtn.click()
  console.log('  · clicked Run — waiting for /results')

  // Wait for navigation — tolerate up to 70s due to potential cold backend
  try {
    await page.waitForURL('**/results', { timeout: 70000 })
    await wait(1500)
    return true
  } catch {
    console.log('  ⚠  analyze call did not resolve — falling back to injected state')
    return false
  }
}

async function injectResultsState(page) {
  // Use the ?demo=1 query param — renders the dashboard with dummy data.
  await page.goto(`${BASE}/results?demo=1`, { waitUntil: 'networkidle' })
  await waitForFonts(page)
  await wait(1600)
}

/* ─── desktop capture ───────────────────────────────────────────────────── */
async function captureDesktop(ctx) {
  console.log('DESKTOP 1440×900')
  const page = await ctx.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await waitForFonts(page)
  await wait(1500)

  await shot(page, 'desktop-01-hero')
  await scrollBy(page, 300)
  await shot(page, 'desktop-02-hero-scrolled-navbar')

  await scrollTo(page, '#how')
  await shot(page, 'desktop-03-how')
  await scrollBy(page, (await page.evaluate(() => window.scrollY)) + 500)
  await shot(page, 'desktop-04-how-mid')

  await scrollTo(page, '#audit')
  await shot(page, 'desktop-05-upload')

  await scrollTo(page, '#about')
  await shot(page, 'desktop-06-about')

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await wait(500)
  await shot(page, 'desktop-07-footer')

  await page.evaluate(() => window.scrollTo(0, 0))
  await wait(400)
  await shot(page, 'desktop-08-landing-fullpage', { full: true })

  // Empty /results state
  await page.goto(`${BASE}/results`, { waitUntil: 'networkidle' })
  await waitForFonts(page)
  await wait(800)
  await shot(page, 'desktop-09-results-empty')

  // Populated /results — attempt real upload flow, fall back to injected state
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await waitForFonts(page)
  await wait(1000)
  const real = await uploadAndAnalyse(page)
  if (!real) await injectResultsState(page)

  // Wait for the editorial header + fonts before the first shot.
  try { await page.waitForSelector('h1', { timeout: 8000 }) } catch {}
  await waitForFonts(page)
  // Trigger scroll-in reveals first so all animations settle.
  await scrollThrough(page)
  await page.evaluate(() => window.scrollTo({ top: 0 }))
  await wait(1400)
  await shot(page, 'desktop-10-results-hero')

  await scrollTo(page, 'section:nth-of-type(2)') // § 02 Metrics
  await shot(page, 'desktop-11-results-metrics')

  await scrollTo(page, 'section:nth-of-type(3)') // § 03 Explainability
  await shot(page, 'desktop-12-results-explain')

  await scrollTo(page, '#mitigation')
  await shot(page, 'desktop-13-results-mitigation')

  // Apply mitigation and capture the success state
  const mitigateBtn = page.locator('#mitigation-apply-btn')
  if (await mitigateBtn.count()) {
    await mitigateBtn.click({ timeout: 5000 }).catch(() => {})
    await wait(3000) // allow API call or fallback to resolve
    await shot(page, 'desktop-14-results-mitigation-done')
  }

  await page.evaluate(() => window.scrollTo(0, 0))
  await wait(500)
  await shot(page, 'desktop-15-results-fullpage', { full: true })

  await page.close()
}

/* ─── mobile capture ────────────────────────────────────────────────────── */
async function captureMobile(ctx) {
  console.log('MOBILE 390×844')
  const page = await ctx.newPage()
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await waitForFonts(page)
  await wait(1400)

  await shot(page, 'mobile-01-hero')
  await scrollTo(page, '#how'); await shot(page, 'mobile-02-how')
  await scrollTo(page, '#audit'); await shot(page, 'mobile-03-upload')
  await scrollTo(page, '#about'); await shot(page, 'mobile-04-about')
  await page.evaluate(() => window.scrollTo(0, 0)); await wait(300)
  await shot(page, 'mobile-05-landing-fullpage', { full: true })

  await page.goto(`${BASE}/results`, { waitUntil: 'networkidle' })
  await waitForFonts(page)
  await wait(700)
  await shot(page, 'mobile-06-results-empty')

  // Inject state on mobile and screenshot
  await injectResultsState(page)
  try { await page.waitForSelector('h1', { timeout: 6000 }) } catch {}
  await waitForFonts(page)
  await scrollThrough(page)
  await page.evaluate(() => window.scrollTo({ top: 0 }))
  await wait(1000)
  await shot(page, 'mobile-07-results-hero')
  await scrollTo(page, 'section:nth-of-type(2)'); await shot(page, 'mobile-08-results-metrics')
  await scrollTo(page, 'section:nth-of-type(3)'); await shot(page, 'mobile-09-results-explain')
  await scrollTo(page, '#mitigation'); await shot(page, 'mobile-10-results-mitigation')

  await page.close()
}

/* ─── tablet capture ────────────────────────────────────────────────────── */
async function captureTablet(ctx) {
  console.log('TABLET 834×1112')
  const page = await ctx.newPage()
  await page.setViewportSize({ width: 834, height: 1112 })

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await waitForFonts(page)
  await wait(1400)
  await shot(page, 'tablet-01-hero')
  await scrollTo(page, '#how'); await shot(page, 'tablet-02-how')
  await scrollTo(page, '#audit'); await shot(page, 'tablet-03-upload')

  await page.close()
}

/* ─── main ──────────────────────────────────────────────────────────────── */
async function main() {
  if (existsSync(OUT)) await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })
  console.log(`→ ${OUT}`)
  console.log(`→ BASE_URL=${BASE}`)
  console.log(`→ SAMPLE_CSV=${SAMPLE_CSV}\n`)

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
  })

  try {
    await captureDesktop(ctx)
    await captureMobile(ctx)
    await captureTablet(ctx)
  } finally {
    await ctx.close()
    await browser.close()
  }
  console.log('\n✓ done')
}

main().catch((err) => { console.error(err); process.exit(1) })
