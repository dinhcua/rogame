#!/usr/bin/env python3
import subprocess
import sys
import datetime

def create_checkpoint():
    """Create a checkpoint using claudepoint"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    description = f"Checkpoint created at {timestamp}"
    
    if len(sys.argv) > 1:
        # Use custom description if provided
        description = " ".join(sys.argv[1:])
    
    try:
        # Run claudepoint create command
        result = subprocess.run(
            ["claudepoint", "create", "--description", "[AUTO_2] " + description],
            capture_output=True,
            text=True,
            check=True
        )
        
        print(f" {result.stdout}")
        return 0
        
    except subprocess.CalledProcessError as e:
        print(f"L Error creating checkpoint: {e.stderr}")
        return 1
    except FileNotFoundError:
        print("L Error: claudepoint command not found. Please ensure it's installed and in PATH.")
        return 1

if __name__ == "__main__":
    sys.exit(create_checkpoint())