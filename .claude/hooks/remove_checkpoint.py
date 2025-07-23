#!/usr/bin/env python3
"""
Remove all checkpoint files from snapshots directory and reset changelog.
"""

import json
import shutil
from pathlib import Path

def main():
    """Remove all files in snapshots directory and reset changelog.json."""
    # Get directories
    checkpoint_dir = Path.cwd() / ".checkpoints"
    snapshots_dir = checkpoint_dir / "snapshots"
    changelog_path = checkpoint_dir / "changelog.json"
    
    # Remove all folders in snapshots directory
    if snapshots_dir.exists():
        removed_count = 0
        for folder in snapshots_dir.iterdir():
            if folder.is_dir():
                shutil.rmtree(folder)
                removed_count += 1
        print(f"Removed {removed_count} checkpoint folder(s)")
    
    # Reset changelog.json to empty array
    if changelog_path.exists():
        with open(changelog_path, 'w') as f:
            json.dump([], f)
        print("Reset changelog.json to empty array")
    
    print("Done!")

if __name__ == "__main__":
    main()