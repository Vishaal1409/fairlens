import argparse
import os

def generate_fixtures(output_dir, sizes):
    os.makedirs(output_dir, exist_ok=True)
    for size in sizes:
        path = os.path.join(output_dir, f"large_{size}mb.csv")
        print(f"Generating {path} ({size}MB)...")
        target_bytes = size * 1024 * 1024
        header = "age,income,gender,loan_approved,predicted_approval\n"
        with open(path, 'w', newline='') as f:
            f.write(header)
            written = len(header)
            data = "40,65000,Male,1,1\n" * 5000
            while written < target_bytes:
                f.write(data)
                written += len(data)
        print(f"Generation complete for {path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--sizes', nargs='+', type=float, required=True)
    args = parser.parse_args()
    generate_fixtures(args.output_dir, args.sizes)
