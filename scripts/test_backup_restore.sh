#!/bin/bash

# Steam directory path (origin path)
STEAM_DIR="$HOME/Library/Application Support/Steam/steamapps/common"
GAME_NAME="Nioh 2"
GAME_SAVES_DIR="$STEAM_DIR/$GAME_NAME/saves"

# Backup directory path (file path)
BACKUP_DIR="$HOME/Library/Application Support/rogame/saves/$GAME_NAME"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Backup/Restore Test ===${NC}"

# Function to generate random content
generate_random_content() {
    local min_size=50
    local max_size=500
    local size=$(( RANDOM % (max_size - min_size + 1) + min_size ))
    local content=""
    
    # Generate random strings with timestamps and random data
    content="Save data for Nioh 2 - $(date)\n"
    content+="Player Stats:\n"
    content+="Level: $(( RANDOM % 100 + 1 ))\n"
    content+="Gold: $(( RANDOM % 1000000 ))\n"
    content+="Playtime: $(( RANDOM % 1000 )) hours\n"
    
    # Add random items to reach desired size
    while [ ${#content} -lt $size ]; do
        content+="Item_$(( RANDOM % 1000 )): $(( RANDOM % 100 ))\n"
    done
    
    echo -e "$content"
}

# Function to print file details
print_file_details() {
    local file_path="$1"
    local label="$2"
    if [ ! -f "$file_path" ]; then
        echo -e "\n${RED}=== $label: File not found ===${NC}"
        echo "Path: $file_path"
        return 1
    fi
    
    echo -e "\n${BLUE}=== $label Details ===${NC}"
    echo "Path: $file_path"
    echo "Size: $(wc -c < "$file_path" || echo "0") bytes"
    echo "Content: $(cat "$file_path" 2>/dev/null || echo "<empty or unreadable>")"
    echo "Timestamp: $(stat -f "%Sm" "$file_path" 2>/dev/null || echo "unknown")"
    return 0
}

# Function to get latest backup file
get_latest_backup() {
    local backup_dir="$1"
    if [ ! -d "$backup_dir" ]; then
        return 1
    fi
    
    # Use find to get the most recently modified .sav file
    local latest=$(find "$backup_dir" -type f -name "*.sav" -print0 | xargs -0 ls -t 2>/dev/null | head -n 1)
    if [ -n "$latest" ]; then
        echo "$latest"
        return 0
    fi
    return 1
}

# 1. Setup initial save file in origin path
echo -e "\n${BLUE}Setting up initial save file...${NC}"
mkdir -p "$GAME_SAVES_DIR"
generate_random_content > "$GAME_SAVES_DIR/save1.sav"

if ! print_file_details "$GAME_SAVES_DIR/save1.sav" "Original Save File"; then
    echo -e "${RED}Failed to create or access original save file${NC}"
    exit 1
fi

INITIAL_SIZE=$(wc -c < "$GAME_SAVES_DIR/save1.sav")

# 2. Wait for backup to be created (manual step)
echo -e "\n${BLUE}Please create a backup in the app and press Enter to continue...${NC}"
read -p ""

# 3. Verify backup file exists and has same size
echo -e "\n${BLUE}Checking backup files...${NC}"
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: Backup directory not found at $BACKUP_DIR${NC}"
    exit 1
fi

LATEST_BACKUP=$(get_latest_backup "$BACKUP_DIR")
if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}Error: No backup files found in $BACKUP_DIR${NC}"
    exit 1
fi

if ! print_file_details "$LATEST_BACKUP" "Backup File"; then
    echo -e "${RED}Failed to access backup file${NC}"
    exit 1
fi

BACKUP_SIZE=$(wc -c < "$LATEST_BACKUP")
if [ "$INITIAL_SIZE" -eq "$BACKUP_SIZE" ]; then
    echo -e "${GREEN}✅ Backup successful - sizes match${NC}"
else
    echo -e "${RED}❌ Backup failed - size mismatch${NC}"
    echo "Expected: $INITIAL_SIZE bytes"
    echo "Got: $BACKUP_SIZE bytes"
fi

# 4. Simulate game save change
echo -e "\n${BLUE}Simulating game save change...${NC}"
generate_random_content > "$GAME_SAVES_DIR/save1.sav"
print_file_details "$GAME_SAVES_DIR/save1.sav" "Modified Save File"

# 5. Wait for restore operation
echo -e "\n${BLUE}Please restore the backup in the app and press Enter to continue...${NC}"
read -p ""

# 6. Verify restore
if ! print_file_details "$GAME_SAVES_DIR/save1.sav" "Restored Save File"; then
    echo -e "${RED}Failed to access restored save file${NC}"
    exit 1
fi

CURRENT_SIZE=$(wc -c < "$GAME_SAVES_DIR/save1.sav")
CURRENT_CONTENT=$(cat "$GAME_SAVES_DIR/save1.sav")
BACKUP_CONTENT=$(cat "$LATEST_BACKUP")

echo -e "\n${BLUE}=== Verification Results ===${NC}"
if [ "$CURRENT_SIZE" -eq "$BACKUP_SIZE" ]; then
    echo -e "${GREEN}✅ Size check passed${NC}"
else
    echo -e "${RED}❌ Size check failed${NC}"
    echo "Expected: $BACKUP_SIZE bytes"
    echo "Got: $CURRENT_SIZE bytes"
fi

if [ "$CURRENT_CONTENT" = "$BACKUP_CONTENT" ]; then
    echo -e "${GREEN}✅ Content check passed${NC}"
else
    echo -e "${RED}❌ Content check failed${NC}"
    echo "Expected content: $BACKUP_CONTENT"
    echo "Got content: $CURRENT_CONTENT"
fi

echo -e "\n${BLUE}=== Test Complete ===${NC}" 