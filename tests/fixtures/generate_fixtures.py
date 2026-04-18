import os
import argparse
import pandas as pd
import numpy as np

def generate_csv(size_mb, output_file):
    # Rough estimate: 1 row of 5 float columns + timestamp ~ 100 bytes
    rows = int((size_mb * 1024 * 1024) / 100)
    
    print(f"Generating {size_mb}MB dataset ({rows} rows)...")
    
    df = pd.DataFrame({
        'timestamp': pd.date_range('2026-01-01', periods=rows, freq='S'),
        'feature_1': np.random.randn(rows),
        'feature_2': np.random.randn(rows),
        'protected_group': np.random.choice(['A', 'B'], size=rows),
        'target': np.random.choice([0, 1], size=rows)
    })
    
    df.to_csv(output_file, index=False)
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate large mock CSV files for load testing")
    parser.add_argument("--sizes", nargs="+", type=int, default=[51, 100], help="List of file sizes in MB to generate")
    parser.add_argument("--output-dir", type=str, default="tests/fixtures/", help="Output directory")
    args = parser.parse_args()
    
    os.makedirs(args.output_dir, exist_ok=True)
    for size in args.sizes:
        generate_csv(size, os.path.join(args.output_dir, f"data_{size}mb.csv"))
