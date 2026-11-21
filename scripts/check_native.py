"""Run the same starter scripts with native PyTorch in separate processes."""
import os
from pathlib import Path
import subprocess
import sys


def main():
    root = Path(__file__).resolve().parents[1]
    environment = {**os.environ, "OMP_NUM_THREADS": "1", "MKL_NUM_THREADS": "1"}
    for example in sorted((root / "examples").glob("*.py")):
        subprocess.run([sys.executable, str(example)], cwd=root, env=environment,
                       check=True, timeout=90)
        print(f"Passed natively: {example.stem}", flush=True)


if __name__ == "__main__":
    main()
