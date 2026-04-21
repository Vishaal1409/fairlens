/**
 * @typedef {'good' | 'warning' | 'danger'} BiasLevel
 *
 * @typedef {Object} MetricEntry
 * @property {string}    id          - Unique key, e.g. "demographic_parity"
 * @property {string}    label       - Display name
 * @property {number}    score       - Value between 0 and 1
 * @property {BiasLevel} biasLevel   - Derived color-code bucket
 * @property {number[]}  trend       - Last-8-audit sparkline points (0-1)
 *
 * @typedef {Object} DatasetSummary
 * @property {string}        id             - Unique dataset ID
 * @property {string}        name           - Human-readable name
 * @property {string}        description    - One-line summary
 * @property {number}        totalRows      - Row count
 * @property {number}        fairnessScore  - Composite fairness score (0-1)
 * @property {string}        targetVariable - e.g. "income_>50K"
 * @property {string}        uploadedAt     - ISO date string
 * @property {string}        modelType      - e.g. "XGBoost"
 * @property {MetricEntry[]} metrics        - Array of per-metric scores
 */

/** Derive a bias level from a raw 0-1 score */
export const getBiasLevel = (score) => {
  if (score >= 0.75) return 'good';
  if (score >= 0.50) return 'warning';
  return 'danger';
};

/** Bias-level → label mapping */
export const biasLabels = {
  good:    'Fair',
  warning: 'Moderate',
  danger:  'High Bias',
};

/**
 * Generate a plausible 8-point trend leading up to `final`.
 * Adds deterministic noise so charts look real.
 */
const makeTrend = (final, seed = 1) =>
  Array.from({ length: 8 }, (_, i) => {
    const progress = i / 7;
    const noise = Math.sin(seed * 3.7 + i * 1.9) * 0.04;
    return Math.min(1, Math.max(0, final - 0.18 + progress * 0.18 + noise));
  }).concat(final);

/** Helper – build a MetricEntry from raw values */
const m = (id, label, score, seedOffset = 0) => ({
  id,
  label,
  score,
  biasLevel: getBiasLevel(score),
  trend: makeTrend(score, score * 10 + seedOffset),
});

// ── Mock Datasets ────────────────────────────────────────────────

export const availableDatasets = [
  {
    id: 'ds-adult-2023',
    name: 'Adult Census 2023',
    description: 'UCI Adult dataset — income bracket prediction',
    modelType: 'XGBoost',
    totalRows: 32_561,
    fairnessScore: 0.67,
    targetVariable: 'income_>50K',
    uploadedAt: '2025-11-14T09:12:00Z',
    metrics: [
      m('demographic_parity',   'Demographic Parity',   0.65, 0),
      m('equal_opportunity',    'Equal Opportunity',    0.48, 1),
      m('disparate_impact',     'Disparate Impact',     0.71, 2),
      m('false_positive_rate',  'False Positive Rate',  0.42, 3),
      m('predictive_equality',  'Predictive Equality',  0.82, 4),
      m('calibration',          'Calibration',          0.59, 5),
      m('individual_fairness',  'Individual Fairness',  0.74, 6),
    ],
  },
  {
    id: 'ds-adult-2024',
    name: 'Adult Census 2024',
    description: 'Updated Adult dataset with balanced sampling',
    modelType: 'XGBoost',
    totalRows: 41_238,
    fairnessScore: 0.74,
    targetVariable: 'income_>50K',
    uploadedAt: '2026-03-02T14:45:00Z',
    metrics: [
      m('demographic_parity',   'Demographic Parity',   0.78, 0),
      m('equal_opportunity',    'Equal Opportunity',    0.61, 1),
      m('disparate_impact',     'Disparate Impact',     0.80, 2),
      m('false_positive_rate',  'False Positive Rate',  0.68, 3),
      m('predictive_equality',  'Predictive Equality',  0.76, 4),
      m('calibration',          'Calibration',          0.68, 5),
      m('individual_fairness',  'Individual Fairness',  0.81, 6),
    ],
  },
  {
    id: 'ds-compas-v1',
    name: 'COMPAS Recidivism v1',
    description: 'ProPublica COMPAS data — recidivism risk scoring',
    modelType: 'Logistic Regression',
    totalRows: 11_757,
    fairnessScore: 0.43,
    targetVariable: 'two_year_recid',
    uploadedAt: '2025-08-20T11:30:00Z',
    metrics: [
      m('demographic_parity',   'Demographic Parity',   0.38, 0),
      m('equal_opportunity',    'Equal Opportunity',    0.31, 1),
      m('disparate_impact',     'Disparate Impact',     0.45, 2),
      m('false_positive_rate',  'False Positive Rate',  0.28, 3),
      m('predictive_equality',  'Predictive Equality',  0.56, 4),
      m('calibration',          'Calibration',          0.42, 5),
      m('individual_fairness',  'Individual Fairness',  0.49, 6),
    ],
  },
  {
    id: 'ds-compas-v2',
    name: 'COMPAS Recidivism v2',
    description: 'COMPAS with adversarial debiasing pre-processing',
    modelType: 'Neural Network',
    totalRows: 13_102,
    fairnessScore: 0.58,
    targetVariable: 'two_year_recid',
    uploadedAt: '2026-01-10T16:05:00Z',
    metrics: [
      m('demographic_parity',   'Demographic Parity',   0.55, 0),
      m('equal_opportunity',    'Equal Opportunity',    0.49, 1),
      m('disparate_impact',     'Disparate Impact',     0.62, 2),
      m('false_positive_rate',  'False Positive Rate',  0.47, 3),
      m('predictive_equality',  'Predictive Equality',  0.64, 4),
      m('calibration',          'Calibration',          0.51, 5),
      m('individual_fairness',  'Individual Fairness',  0.58, 6),
    ],
  },
  {
    id: 'ds-german-credit',
    name: 'German Credit Dataset',
    description: 'Statlog German Credit data — credit risk classification',
    modelType: 'Random Forest',
    totalRows: 1_000,
    fairnessScore: 0.72,
    targetVariable: 'credit_risk',
    uploadedAt: '2025-06-05T08:20:00Z',
    metrics: [
      m('demographic_parity',   'Demographic Parity',   0.70, 0),
      m('equal_opportunity',    'Equal Opportunity',    0.68, 1),
      m('disparate_impact',     'Disparate Impact',     0.75, 2),
      m('false_positive_rate',  'False Positive Rate',  0.63, 3),
      m('predictive_equality',  'Predictive Equality',  0.80, 4),
      m('calibration',          'Calibration',          0.64, 5),
      m('individual_fairness',  'Individual Fairness',  0.74, 6),
    ],
  },
];
