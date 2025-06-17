#!/bin/bash

# Steam directory path
STEAM_DIR="$HOME/Library/Application Support/Steam/steamapps/common"

# Create Steam directory structure if it doesn't exist
mkdir -p "$STEAM_DIR"

# Function to create a game directory with some mock files
create_game_dir() {
    local game_name="$1"
    local game_dir="$STEAM_DIR/$game_name"
    
    echo "Creating game: $game_name"
    mkdir -p "$game_dir"
    mkdir -p "$game_dir/saves"
    
    # Create some mock save files
    echo "Mock save data 1" > "$game_dir/saves/save1.sav"
    echo "Mock save data 2" > "$game_dir/saves/save2.sav"
    
    # Create mock game executable and data files
    dd if=/dev/zero of="$game_dir/$game_name.exe" bs=1M count=10
    dd if=/dev/zero of="$game_dir/game_data.dat" bs=1M count=50
    
    # Create mock config
    echo "{
        \"game\": \"$game_name\",
        \"version\": \"1.0.0\",
        \"last_played\": \"$(date)\"
    }" > "$game_dir/config.json"
}

# List of games to create
GAMES=(
    "Elden Ring"
    "Lies of P"
    "Dark Souls III"
    "Sekiro Shadows Die Twice"
    "Bloodborne"
    "Nioh 2"
)

# Create each game directory
for game in "${GAMES[@]}"; do
    create_game_dir "$game"
done

echo "Mock games have been created in $STEAM_DIR"
echo "Created games:"
ls -l "$STEAM_DIR" 