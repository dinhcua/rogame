#!/bin/bash

# Base directories
APP_SUPPORT_DIR="$HOME/Library/Application Support"
STEAM_DIR="$APP_SUPPORT_DIR/Steam"

# Create directories if they don't exist
mkdir -p "$APP_SUPPORT_DIR"
mkdir -p "$STEAM_DIR/steamapps/common"
mkdir -p "$STEAM_DIR/userdata/123456789"  # Mock Steam user ID

# Function to create Sekiro save files
create_sekiro_saves() {
    echo "Creating Sekiro Shadows Die Twice save files..."
    
    # Create save directory in Application Support
    local save_dir="$APP_SUPPORT_DIR/Sekiro"
    mkdir -p "$save_dir"
    
    # Create S0000.sl2 save file (main save file format for Sekiro)
    echo "SEKIRO_SAVE_DATA_v1.0" > "$save_dir/S0000.sl2"
    dd if=/dev/zero bs=1024 count=512 >> "$save_dir/S0000.sl2" 2>/dev/null
    
    # Create backup saves
    cp "$save_dir/S0000.sl2" "$save_dir/S0000.sl2.bak"
    
    # Create Steam cloud save location
    local steam_save_dir="$STEAM_DIR/userdata/123456789/814380/remote"
    mkdir -p "$steam_save_dir"
    cp "$save_dir/S0000.sl2" "$steam_save_dir/"
    
    # Create game installation directory
    local game_dir="$STEAM_DIR/steamapps/common/Sekiro Shadows Die Twice"
    mkdir -p "$game_dir"
    
    # Create mock game files
    echo "Sekiro.app" > "$game_dir/Sekiro.app"
    echo "{
        \"game\": \"Sekiro Shadows Die Twice\",
        \"version\": \"1.06\",
        \"last_played\": \"$(date)\",
        \"steam_id\": \"814380\"
    }" > "$game_dir/game_info.json"
    
    echo "✓ Sekiro Shadows Die Twice mock files created"
}

# Function to create Lies of P save files
create_lies_of_p_saves() {
    echo "Creating Lies of P save files..."
    
    # Create Steam cloud save location (primary save location for Lies of P)
    local steam_save_dir="$STEAM_DIR/userdata/123456789/1627720/remote"
    mkdir -p "$steam_save_dir"
    
    # Create .sav files (Lies of P save format)
    echo "LIES_OF_P_SAVE_v1.0" > "$steam_save_dir/SaveSlot_00.sav"
    dd if=/dev/zero bs=1024 count=256 >> "$steam_save_dir/SaveSlot_00.sav" 2>/dev/null
    
    echo "LIES_OF_P_SAVE_v1.0" > "$steam_save_dir/SaveSlot_01.sav"
    dd if=/dev/zero bs=1024 count=256 >> "$steam_save_dir/SaveSlot_01.sav" 2>/dev/null
    
    # Create settings file
    echo "{
        \"graphics\": \"high\",
        \"resolution\": \"1920x1080\",
        \"vsync\": true
    }" > "$steam_save_dir/settings.json"
    
    # Create game installation directory
    local game_dir="$STEAM_DIR/steamapps/common/Lies of P"
    mkdir -p "$game_dir"
    
    # Create mock game files
    echo "Lies of P.app" > "$game_dir/Lies of P.app"
    echo "{
        \"game\": \"Lies of P\",
        \"version\": \"1.5.0\",
        \"last_played\": \"$(date)\",
        \"steam_id\": \"1627720\"
    }" > "$game_dir/game_info.json"
    
    echo "✓ Lies of P mock files created"
}

# Main execution
echo "Creating mock game files for macOS..."
echo "================================"

create_sekiro_saves
echo ""
create_lies_of_p_saves

echo ""
echo "Mock game files have been created!"
echo ""
echo "Save locations:"
echo "- Sekiro: $APP_SUPPORT_DIR/Sekiro/"
echo "- Lies of P: $STEAM_DIR/userdata/123456789/1627720/remote/"
echo ""
echo "Game installations:"
echo "- $STEAM_DIR/steamapps/common/Sekiro Shadows Die Twice/"
echo "- $STEAM_DIR/steamapps/common/Lies of P/" 