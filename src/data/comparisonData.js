/**
 * @typedef {'good' | 'warning' | 'danger'} BiasLevel
 *
 * @typedef {Object} MetricEntry
 * @property {string}    id          - Unique key, e.g. "demographic_parity"
 * @property {string}    label       - Display name
 * @property {number}    score       - Value between 0 and 1
 * @property {BiasLevel} biasLevel   - Derived color-code bucket
 *
 * @typedef {Object} DatasetSummary
 * @property {string}        id             - Unique dataset ID
 * @property {string}        name           - Human-readable name
 * @property {number}        totalRows      - Row count
 * @property {number}        fairnessScore  - Composite fairness score (0-1)
 * @property {string}        targetVariable - e.g. "income_>50K"
 * @property {string}        uploadedAt     - ISO date string
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
  good: 'Fair',
  warning: 'Moderate',
  danger: 'High Bias',
};

/** Helper – build a MetricEntry from raw values */
const m = (id, label, score) => ({
  id,
  label,
  score,
  biasLevel: getBiasLevel(score),
});

// ── Mock Datasets ────────────────────────────────────────────────

export const availableDatasets = [
  {
    id: 'ds-adult-2023',
    name: 'Adult Census 2023',
    totalRows: 32_561,
    fairnessScore: 0.67,
    targetVariable: 'income_>50K',
    uploadedAt: '2025-11-14T09:12:00Z',
    metrics: [
      m('demographic_parity', 'Demographic Parity', 0.65),
      m('equal_opportunity', 'Equal Opportunity', 0.48),
      m('disparate_impact', 'Disparate Impact', 0.71),
      m('predictive_equality', 'Predictive Equality', 0.82),
      m('calibration', 'Calibration', 0.59),
      m('individual_fairness', 'Individual Fairness', 0.74),
    ],
  },
  {
    id: 'ds-adult-2024',
    name: 'Adult Census 2024',
    totalRows: 41_238,
    fairnessScore: 0.74,
    targetVariable: 'income_>50K',
    uploadedAt: '2026-03-02T14:45:00Z',
    metrics: [
      m('demographic_parity', 'Demographic Parity', 0.78),
      m('equal_opportunity', 'Equal Opportunity', 0.61),
      m('disparate_impact', 'Disparate Impact', 0.80),
      m('predictive_equality', 'Predictive Equality', 0.76),
      m('calibration', 'Calibration', 0.68),
      m('individual_fairness', 'Individual Fairness', 0.81),
    ],
  },
  {
    id: 'ds-compas-v1',
    name: 'COMPAS Recidivism v1',
    totalRows: 11_757,
    fairnessScore: 0.43,
    targetVariable: 'two_year_recid',
    uploadedAt: '2025-08-20T11:30:00Z',
    metrics: [
      m('demographic_parity', 'Demographic Parity', 0.38),
      m('equal_opportunity', 'Equal Opportunity', 0.31),
      m('disparate_impact', 'Disparate Impact', 0.45),
      m('predictive_equality', 'Predictive Equality', 0.56),
      m('calibration', 'Calibration', 0.42),
      m('individual_fairness', 'Individual Fairness', 0.49),
    ],
  },
  {
    id: 'ds-compas-v2',
    name: 'COMPAS Recidivism v2',
    totalRows: 13_102,
    fairnessScore: 0.58,
    targetVariable: 'two_year_recid',
    uploadedAt: '2026-01-10T16:05:00Z',
    metrics: [
      m('demographic_parity', 'Demographic Parity', 0.55),
      m('equal_opportunity', 'Equal Opportunity', 0.49),
      m('disparate_impact', 'Disparate Impact', 0.62),
      m('predictive_equality', 'Predictive Equality', 0.64),
      m('calibration', 'Calibration', 0.51),
      m('individual_fairness', 'Individual Fairness', 0.58),
    ],
  },
  {
    id: 'ds-german-credit',
    name: 'German Credit Dataset',
    totalRows: 1_000,
    fairnessScore: 0.72,
    targetVariable: 'credit_risk',
    uploadedAt: '2025-06-05T08:20:00Z',
    metrics: [
      m('demographic_parity', 'Demographic Parity', 0.70),
      m('equal_opportunity', 'Equal Opportunity', 0.68),
      m('disparate_impact', 'Disparate Impact', 0.75),
      m('predictive_equality', 'Predictive Equality', 0.80),
      m('calibration', 'Calibration', 0.64),
      m('individual_fairness', 'Individual Fairness', 0.74),
    ],
  },
];
