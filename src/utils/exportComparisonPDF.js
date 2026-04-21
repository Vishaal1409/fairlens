/**
 * exportComparisonPDF
 * ───────────────────
 * Generates a branded A4 PDF report comparing two FairLens datasets.
 *
 * @param {import('../data/comparisonData').DatasetSummary} datasetA
 * @param {import('../data/comparisonData').DatasetSummary} datasetB
 * @param {{ raw: number, pct: number, direction: string, significant: boolean }[]} deltas
 *   Pre-computed delta objects (one per paired metric, in order).
 */

import jsPDF from 'jspdf';
import { calcDelta } from '../components/comparison/ComparisonChart';

const PURPLE   = [107, 47, 191];
const BLUE     = [59, 130, 246];
const DARK     = [27, 28, 29];
const SURFACE  = [31, 32, 33];
const TEXT     = [227, 226, 227];
const MUTED    = [136, 135, 128];
const GREEN    = [29, 158, 117];
const AMBER    = [239, 159, 39];
const ROSE     = [226, 75, 74];

const levelColor = (score) =>
  score >= 0.75 ? GREEN  :
  score >= 0.50 ? AMBER  :
  ROSE;

const levelLabel = (score) =>
  score >= 0.75 ? 'Fair'      :
  score >= 0.50 ? 'Moderate'  :
  'High Bias';

export const exportComparisonPDF = (datasetA, datasetB) => {
  const doc  = new jsPDF({ unit: 'pt', format: 'a4' });
  const W    = doc.internal.pageSize.getWidth();
  const H    = doc.internal.pageSize.getHeight();
  const M    = 40;       // margin
  let   y    = M;

  /* ── Helper: new page guard ── */
  const checkPage = (needed = 40) => {
    if (y + needed > H - 50) {
      doc.addPage();
      y = M + 10;
    }
  };

  /* ══════════════════════════════════════
     PAGE 1 — HEADER
  ══════════════════════════════════════ */
  doc.setFillColor(...PURPLE);
  doc.rect(0, 0, W, 60, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FairLens', M, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(214, 186, 255);
  doc.text('Dataset Comparison Audit Report', M + 92, 38);

  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setTextColor(255, 255, 255);
  doc.text(now, W - M, 38, { align: 'right' });

  y = 80;

  /* ── Report subtitle ── */
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT);
  doc.text('Side-by-Side Fairness Analysis', M, y);
  y += 22;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(
    `Comparing "${datasetA.name}" (A) vs "${datasetB.name}" (B). ` +
    `Metrics with >15% drift are flagged.`,
    M, y, { maxWidth: W - M * 2 }
  );
  y += 22;

  /* ── Divider ── */
  doc.setDrawColor(60, 60, 65);
  doc.setLineWidth(0.5);
  doc.line(M, y, W - M, y);
  y += 16;

  /* ══════════════════════════════════════
     SECTION 1 — DATASET SUMMARY CARDS
  ══════════════════════════════════════ */
  const cardW = (W - M * 2 - 12) / 2;
  const cardH = 100;

  // Card A
  doc.setFillColor(...DARK);
  doc.roundedRect(M, y, cardW, cardH, 6, 6, 'F');
  doc.setFillColor(...PURPLE);
  doc.rect(M, y, cardW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  doc.text('DATASET A', M + 12, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(datasetA.name, M + 12, y + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`${datasetA.totalRows.toLocaleString()} rows · ${datasetA.targetVariable}`, M + 12, y + 48);
  doc.text(`Model: ${datasetA.modelType ?? 'N/A'}`, M + 12, y + 60);

  const scoreA    = datasetA.fairnessScore;
  const colorA    = levelColor(scoreA);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...colorA);
  doc.text(`${Math.round(scoreA * 100)}%`, M + cardW - 14, y + 50, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('Composite Fairness', M + cardW - 14, y + 63, { align: 'right' });

  // Card B
  const bX = M + cardW + 12;
  doc.setFillColor(...DARK);
  doc.roundedRect(bX, y, cardW, cardH, 6, 6, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(bX, y, cardW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  doc.text('DATASET B', bX + 12, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(datasetB.name, bX + 12, y + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`${datasetB.totalRows.toLocaleString()} rows · ${datasetB.targetVariable}`, bX + 12, y + 48);
  doc.text(`Model: ${datasetB.modelType ?? 'N/A'}`, bX + 12, y + 60);

  const scoreB = datasetB.fairnessScore;
  const colorB = levelColor(scoreB);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...colorB);
  doc.text(`${Math.round(scoreB * 100)}%`, bX + cardW - 14, y + 50, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('Composite Fairness', bX + cardW - 14, y + 63, { align: 'right' });

  y += cardH + 20;

  /* ══════════════════════════════════════
     SECTION 2 — METRIC TABLE
  ══════════════════════════════════════ */
  checkPage(60);

  doc.setFillColor(...SURFACE);
  doc.roundedRect(M, y - 4, W - M * 2, 22, 4, 4, 'F');
  doc.setTextColor(214, 186, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Metric-by-Metric Comparison', M + 8, y + 11);
  y += 30;

  // Table column positions
  const cols = {
    name:   M,
    scoreA: M + 180,
    labelA: M + 240,
    scoreB: M + 310,
    labelB: M + 370,
    delta:  M + 440,
    flag:   M + 495,
  };

  // Column headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('Metric',        cols.name,   y);
  doc.text('Score A',       cols.scoreA, y);
  doc.text('Status A',      cols.labelA, y);
  doc.text('Score B',       cols.scoreB, y);
  doc.text('Status B',      cols.labelB, y);
  doc.text('Δ Delta',       cols.delta,  y);
  doc.text('Alert',         cols.flag,   y);
  y += 6;

  doc.setDrawColor(50, 50, 55);
  doc.line(M, y, W - M, y);
  y += 12;

  // Pair metrics
  const metricsB_map = Object.fromEntries(datasetB.metrics.map((m) => [m.id, m]));
  const paired = datasetA.metrics
    .filter((m) => metricsB_map[m.id])
    .map((m) => ({ a: m, b: metricsB_map[m.id] }));

  doc.setFont('helvetica', 'normal');
  paired.forEach(({ a, b }, idx) => {
    checkPage(22);

    const d   = calcDelta(a.score, b.score);
    const cA  = levelColor(a.score);
    const cB  = levelColor(b.score);

    // Alternating row background
    if (idx % 2 === 0) {
      doc.setFillColor(32, 33, 34);
      doc.rect(M, y - 9, W - M * 2, 17, 'F');
    }

    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    doc.text(a.label, cols.name, y);

    // Score A
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...cA);
    doc.text(`${Math.round(a.score * 100)}%`, cols.scoreA, y);

    // Label A
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(levelLabel(a.score), cols.labelA, y);

    // Score B
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...cB);
    doc.text(`${Math.round(b.score * 100)}%`, cols.scoreB, y);

    // Label B
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(levelLabel(b.score), cols.labelB, y);

    // Delta
    const dColor = d.direction === 'up' ? GREEN : d.direction === 'down' ? ROSE : MUTED;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...dColor);
    doc.text(
      `${d.direction === 'up' ? '+' : d.direction === 'down' ? '-' : ''}${d.pct}%`,
      cols.delta, y
    );

    // Alert flag
    if (d.significant && d.direction === 'down') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...ROSE);
      doc.text('⚠ DRIFT', cols.flag, y);
    }

    doc.setTextColor(...TEXT);
    y += 18;
  });

  y += 14;

  /* ══════════════════════════════════════
     SECTION 3 — OVERALL VERDICT
  ══════════════════════════════════════ */
  checkPage(80);

  const overallDelta = calcDelta(datasetA.fairnessScore, datasetB.fairnessScore);
  const verdictColor = overallDelta.direction === 'up' ? GREEN : ROSE;
  const verdictText  = overallDelta.direction === 'up'
    ? `Dataset B shows a ${overallDelta.pct}% improvement in composite fairness. Recommend adopting Dataset B for production audit cycles.`
    : overallDelta.direction === 'down'
    ? `Dataset B shows a ${overallDelta.pct}% regression in composite fairness. Mitigation recommended before deployment.`
    : 'Both datasets have comparable fairness scores. Review individual metric deltas for specific action areas.';

  doc.setFillColor(...DARK);
  doc.roundedRect(M, y, W - M * 2, 60, 6, 6, 'F');
  doc.setFillColor(...verdictColor);
  doc.rect(M, y, 3, 60, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...verdictColor);
  doc.text('Audit Verdict', M + 16, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  doc.text(verdictText, M + 16, y + 34, { maxWidth: W - M * 2 - 24 });

  /* ── Footer ── */
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(
    `FairLens Comparison Report · Generated ${now} · Confidential`,
    W / 2,
    H - 18,
    { align: 'center' }
  );

  doc.save(`fairlens-comparison_${datasetA.id}_vs_${datasetB.id}.pdf`);
};
