import { useState } from 'react'

const code = `import pandas as pd
from aif360.datasets import BinaryLabelDataset
from aif360.algorithms.preprocessing import Reweighing

# Load your dataset
df = pd.read_csv("your_dataset.csv")

# Define protected attribute and label
protected_col = "gender"   # change to your protected column
label_col = "loan_approved"  # change to your label column

# Set privileged and unprivileged groups
privileged_groups = [{protected_col: 1}]
unprivileged_groups = [{protected_col: 0}]

# Create AIF360 dataset
dataset = BinaryLabelDataset(
    df=df,
    label_names=[label_col],
    protected_attribute_names=[protected_col],
    favorable_label=1,
    unfavorable_label=0
)

# Apply Reweighing mitigation
rw = Reweighing(
    unprivileged_groups=unprivileged_groups,
    privileged_groups=privileged_groups
)
dataset_transformed = rw.fit_transform(dataset)

# Get mitigated dataframe
df_mitigated, _ = dataset_transformed.convert_to_dataframe()
print("Mitigation complete!")
print(df_mitigated.head())
`

export default function MitigationCodeExport() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #30363d',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '2rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <div>
          <p style={{ color: '#e6edf3', fontWeight: 600, fontSize: '14px', margin: 0 }}>
            🐍 Python Mitigation Code
          </p>
          <p style={{ color: '#8b949e', fontSize: '12px', margin: '4px 0 0' }}>
            Copy and run this in your own environment
          </p>
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? '#238636' : '#21262d',
            color: copied ? '#fff' : '#e6edf3',
            border: '1px solid #30363d',
            borderRadius: '8px',
            padding: '6px 16px',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: 500,
          }}
        >
          {copied ? '✅ Copied!' : '📋 Copy Code'}
        </button>
      </div>
      <pre style={{
        color: '#e6edf3',
        fontSize: '12px',
        lineHeight: '1.6',
        overflow: 'auto',
        margin: 0,
        fontFamily: 'monospace',
      }}>
        {code}
      </pre>
    </div>
  )
}