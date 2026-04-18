# FairLens Test Suite

This folder consolidates all automated testing logic, configurations, datasets, and scripts mapping pipeline integrity.

## Folder structure
```text
tests/
├── README.md                      # Entry point for test documentation
├── requirements-test.txt          # Python dependencies for the test suite
├── docker_test.sh                 # End-to-end container testing deployment script
├── postman/
│   └── fairlens_postman.json      # Structured QA routes bridging API assertions
├── fixtures/
│   ├── generate_fixtures.py       # Standalone generator constructing load-limit CSVs
│   ├── small_valid.csv            # Static 5-row CSV testing standard upload payload logic
│   ├── invalid_type.txt           # Test payload validating invalid extensions
│   ├── missing_columns.csv        # Missing parameter validation schema testing
│   └── .gitignore                 # Enforces blocking large payloads off Git history
├── resources/
│   └── fairlens_keywords.resource # Centralized Keyword repository for Robot scripts
├── upload_validation.robot        # Baseline structural assertions enforcing normal endpoints
├── bulk_large_file.robot          # Heavy file load parameterizations blocking oversized limits
└── error_payload_shape.robot      # Cross-endpoint JSON validation verifying exact structural shapes
```

## Installation
Initialize the correct library structure natively:
```bash
pip install -r tests/requirements-test.txt
```

## Generating large fixtures
To validate heavy endpoints preventing overload race conditions, trigger the native file builder bridging the 51MB+ checks logic:
```bash
python tests/fixtures/generate_fixtures.py --output-dir tests/fixtures/ --sizes 51 100 200 500
```
*Note: `large_*.csv` files are automatically `.gitignore`d locally — run this setup once natively before evaluating the main Robot test suites.*

## Running the full suite
Evaluate all end-to-end assertions uniformly spanning the target `/tests` logic safely:
```bash
robot --outputdir results tests/
```

## Running a specific suite
Dynamically isolate standard checks limiting full CI evaluation natively:
```bash
robot --outputdir results tests/upload_validation.robot
robot --outputdir results tests/bulk_large_file.robot
robot --outputdir results tests/error_payload_shape.robot
```

## Viewing results
After executing evaluations, an interactive report maps directly generated off Robot:
Open `results/log.html` natively across a browser ensuring precise failure/success traceability.

## Postman collection
For programmatic native assertions validating structural response trees natively:
1. Import `tests/postman/fairlens_postman.json` directly into Postman.
2. Ensure the `{{base_url}}` variable tracks effectively evaluating `http://localhost:8000`.

## Fixture files
| File | Purpose | Committed? |
|---|---|---|
| `small_valid.csv` | Valid 5-row CSV for happy-path tests | Yes |
| `invalid_type.txt` | Wrong file extension test | Yes |
| `missing_columns.csv` | CSV with required columns removed | Yes |
| `large_{n}mb.csv` | Bulk size rejection tests | No — generate locally |
