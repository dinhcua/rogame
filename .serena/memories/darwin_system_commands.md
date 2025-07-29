# Darwin (macOS) System Commands

## File System Navigation
```bash
# List files (BSD ls on macOS)
ls -la              # List all files with details
ls -lah             # Human-readable sizes

# Change directory
cd /path/to/dir
cd ~                # Home directory
cd -                # Previous directory

# Print working directory
pwd

# Create directories
mkdir -p path/to/dir  # Create parent directories
```

## File Operations
```bash
# Copy files (different from GNU cp)
cp -R source dest     # Recursive copy
cp -p file dest       # Preserve attributes

# Move/rename
mv old new

# Remove
rm -rf directory      # Recursive force remove
rm file

# Find files
find . -name "*.ts"   # Find by name
find . -type f        # Find files only

# File info
file filename         # Determine file type
stat -f "%m" file    # Get modification time
```

## Text Processing
```bash
# Search in files (BSD grep)
grep -r "pattern" .   # Recursive search
grep -i "pattern"     # Case insensitive

# Better: Use ripgrep if available
rg "pattern"          # Faster than grep

# View files
cat file
head -n 20 file       # First 20 lines
tail -n 20 file       # Last 20 lines
less file             # Paginated view
```

## Process Management
```bash
# List processes
ps aux               # All processes
ps aux | grep node   # Filter processes

# Kill processes
kill -9 PID          # Force kill
killall processname  # Kill by name
```

## Network
```bash
# Check ports
lsof -i :3000        # What's using port 3000
netstat -an | grep LISTEN  # All listening ports
```

## macOS Specific
```bash
# Open files/URLs
open file.txt        # Open with default app
open -a "Visual Studio Code" file  # Open with specific app
open https://url.com # Open URL in browser

# Clipboard
pbcopy < file        # Copy file to clipboard
pbpaste > file       # Paste clipboard to file

# System info
sw_vers              # macOS version
system_profiler      # Detailed system info
```

## Development Tools
```bash
# Node/npm (via nvm or homebrew)
node --version
npm --version

# Rust/Cargo
cargo --version
rustc --version

# Git
git --version
```

## Notes
- macOS uses BSD utilities, not GNU (different flags)
- Case-insensitive filesystem by default
- Use `brew` for package management
- Paths use forward slashes like Unix