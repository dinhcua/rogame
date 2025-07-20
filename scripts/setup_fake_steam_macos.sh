#!/bin/bash

# Script to create fake Steam environment for testing on macOS
# This creates the necessary directory structure and files to simulate Steam installation

echo "Setting up fake Steam environment for macOS..."

# Steam root directory on macOS
STEAM_ROOT="$HOME/Library/Application Support/Steam"

# Multiple Steam user IDs to simulate multiple accounts
USER_IDS=("123456789" "987654321" "555666777" "111222333")

# Create Steam directories
echo "Creating Steam directories..."
mkdir -p "$STEAM_ROOT/steamapps/common"

# Create userdata directories for each user
for uid in "${USER_IDS[@]}"; do
    echo "Creating userdata for user: $uid"
    mkdir -p "$STEAM_ROOT/userdata/$uid"
done

# Create libraryfolders.vdf with 2 libraries
echo "Creating libraryfolders.vdf..."
cat > "$STEAM_ROOT/steamapps/libraryfolders.vdf" << 'EOF'
"libraryfolders"
{
	"0"
	{
		"path"		"/Users/dinhcua/Library/Application Support/Steam"
		"label"		""
		"contentid"		"3923732609870923804"
		"totalsize"		"512092008448"
		"update_clean_bytes_tally"		"118772547"
		"time_last_update_verified"		"1752909164"
		"apps"
		{
			"3489700"		"226466092"
			"2358720"		"334522123"
			"3017860"		"445623234"
			"292030"		"556734345"
			"1091500"		"667845456"
			"1174180"		"778956567"
		}
	}
	"1"
	{
		"path"		"/Volumes/External/SteamLibrary"
		"label"		""
		"contentid"		"7044278491623724702"
		"totalsize"		"1000203087872"
		"update_clean_bytes_tally"		"2297860355"
		"time_last_update_verified"		"0"
		"apps"
		{
			"2322010"		"21357340552"
			"582010"		"12345678901"
			"2050650"		"98765432109"
			"1086940"		"87654321098"
			"1325200"		"76543210987"
			"814380"		"65432109876"
			"1627720"		"54321098765"
		}
	}
}
EOF

# Create app manifests for library 0 games
echo "Creating app manifests for library 0..."

# Stellar Blade (3489700)
cat > "$STEAM_ROOT/steamapps/appmanifest_3489700.acf" << 'EOF'
"AppState"
{
	"appid"		"3489700"
	"Universe"		"1"
	"name"		"Stellar Blade"
	"StateFlags"		"4"
	"installdir"		"Stellar Blade"
}
EOF
mkdir -p "$STEAM_ROOT/steamapps/common/Stellar Blade"
touch "$STEAM_ROOT/steamapps/common/Stellar Blade/StellarBlade.exe"

# Black Myth: Wukong (2358720)
cat > "$STEAM_ROOT/steamapps/appmanifest_2358720.acf" << 'EOF'
"AppState"
{
	"appid"		"2358720"
	"Universe"		"1"
	"name"		"Black Myth: Wukong"
	"StateFlags"		"4"
	"installdir"		"Black Myth Wukong"
}
EOF
mkdir -p "$STEAM_ROOT/steamapps/common/Black Myth Wukong"
touch "$STEAM_ROOT/steamapps/common/Black Myth Wukong/b1.exe"

# Doom: The Dark Ages (3017860)
cat > "$STEAM_ROOT/steamapps/appmanifest_3017860.acf" << 'EOF'
"AppState"
{
	"appid"		"3017860"
	"Universe"		"1"
	"name"		"Doom: The Dark Ages"
	"StateFlags"		"4"
	"installdir"		"Doom The Dark Ages"
}
EOF
mkdir -p "$STEAM_ROOT/steamapps/common/Doom The Dark Ages"
touch "$STEAM_ROOT/steamapps/common/Doom The Dark Ages/DOOMDarkAges.exe"

# The Witcher 3 (292030)
cat > "$STEAM_ROOT/steamapps/appmanifest_292030.acf" << 'EOF'
"AppState"
{
	"appid"		"292030"
	"Universe"		"1"
	"name"		"The Witcher 3: Wild Hunt"
	"StateFlags"		"4"
	"installdir"		"The Witcher 3 Wild Hunt"
}
EOF
mkdir -p "$STEAM_ROOT/steamapps/common/The Witcher 3 Wild Hunt"
touch "$STEAM_ROOT/steamapps/common/The Witcher 3 Wild Hunt/witcher3.exe"

# Cyberpunk 2077 (1091500)
cat > "$STEAM_ROOT/steamapps/appmanifest_1091500.acf" << 'EOF'
"AppState"
{
	"appid"		"1091500"
	"Universe"		"1"
	"name"		"Cyberpunk 2077"
	"StateFlags"		"4"
	"installdir"		"Cyberpunk 2077"
}
EOF
mkdir -p "$STEAM_ROOT/steamapps/common/Cyberpunk 2077"
touch "$STEAM_ROOT/steamapps/common/Cyberpunk 2077/Cyberpunk2077.exe"

# Red Dead Redemption 2 (1174180)
cat > "$STEAM_ROOT/steamapps/appmanifest_1174180.acf" << 'EOF'
"AppState"
{
	"appid"		"1174180"
	"Universe"		"1"
	"name"		"Red Dead Redemption 2"
	"StateFlags"		"4"
	"installdir"		"Red Dead Redemption 2"
}
EOF
mkdir -p "$STEAM_ROOT/steamapps/common/Red Dead Redemption 2"
touch "$STEAM_ROOT/steamapps/common/Red Dead Redemption 2/RDR2.exe"

# Create fake save files for testing
echo "Creating fake save files..."

# Create saves for each user
for uid in "${USER_IDS[@]}"; do
    echo "Creating saves for user: $uid"
    
    # Stellar Blade saves (Steam Cloud)
    mkdir -p "$STEAM_ROOT/userdata/$uid/3489700/remote"
    echo "fake stellar blade save for user $uid" > "$STEAM_ROOT/userdata/$uid/3489700/remote/save.dat"
    
    # Black Myth: Wukong saves (Steam Cloud)
    mkdir -p "$STEAM_ROOT/userdata/$uid/2358720/remote"
    echo "fake wukong save for user $uid" > "$STEAM_ROOT/userdata/$uid/2358720/remote/save.sav"
    
    # Doom: The Dark Ages saves (Steam Cloud)
    mkdir -p "$STEAM_ROOT/userdata/$uid/3017860/remote"
    echo "fake doom save for user $uid" > "$STEAM_ROOT/userdata/$uid/3017860/remote/save.dat"
    
    # Cyberpunk 2077 saves (Steam Cloud)
    mkdir -p "$STEAM_ROOT/userdata/$uid/1091500/remote"
    echo "fake cyberpunk save for user $uid" > "$STEAM_ROOT/userdata/$uid/1091500/remote/ManualSave-0.dat"
    
    # Monster Hunter: World saves (Steam Cloud)
    mkdir -p "$STEAM_ROOT/userdata/$uid/582010/remote"
    echo "fake mhw save for user $uid" > "$STEAM_ROOT/userdata/$uid/582010/remote/SAVEDATA1000"
    
    # Resident Evil 4 saves (Steam Cloud)
    mkdir -p "$STEAM_ROOT/userdata/$uid/2050650/remote"
    echo "fake re4 save for user $uid" > "$STEAM_ROOT/userdata/$uid/2050650/remote/data000.sav"
    
    # Lies of P saves (Steam Cloud)
    mkdir -p "$STEAM_ROOT/userdata/$uid/1627720/remote"
    echo "fake lies of p save for user $uid" > "$STEAM_ROOT/userdata/$uid/1627720/remote/save.sav"
done

# Games with local saves (not in Steam Cloud)

# The Witcher 3 saves (local)
mkdir -p "$HOME/Documents/The Witcher 3/gamesaves"
echo "fake witcher save" > "$HOME/Documents/The Witcher 3/gamesaves/save001.sav"

# Red Dead Redemption 2 saves (local)
mkdir -p "$HOME/Documents/Rockstar Games/Red Dead Redemption 2/Settings"
echo "fake rdr2 save" > "$HOME/Documents/Rockstar Games/Red Dead Redemption 2/Settings/settings.xml"

# God of War Ragnarök saves (local)
mkdir -p "$HOME/Documents/God of War/SaveGames"
echo "fake gow save" > "$HOME/Documents/God of War/SaveGames/save001.sav"

# Nioh 2 saves (local)
mkdir -p "$HOME/Documents/KoeiTecmo/NIOH2"
echo "fake nioh2 save" > "$HOME/Documents/KoeiTecmo/NIOH2/SAVEDATA.BIN"

# Sekiro saves (local)
mkdir -p "$HOME/Library/Application Support/Sekiro"
echo "fake sekiro save" > "$HOME/Library/Application Support/Sekiro/S0000.sl2"

# Baldur's Gate 3 saves (local with profile ID)
for uid in "${USER_IDS[@]}"; do
    mkdir -p "$HOME/Library/Application Support/Larian Studios/Baldur's Gate 3/PlayerProfiles/Public/Savegames/Story"
    echo "fake bg3 save for profile" > "$HOME/Library/Application Support/Larian Studios/Baldur's Gate 3/PlayerProfiles/Public/Savegames/Story/save001.lsv"
done

# For library 1 (external drive) - create directories only if path exists
EXTERNAL_LIB="/Volumes/External/SteamLibrary"
if [ -d "/Volumes/External" ]; then
    echo "Creating external library structure..."
    mkdir -p "$EXTERNAL_LIB/steamapps/common"
    
    # God of War Ragnarök (2322010)
    cat > "$EXTERNAL_LIB/steamapps/appmanifest_2322010.acf" << 'EOF'
"AppState"
{
	"appid"		"2322010"
	"Universe"		"1"
	"name"		"God of War Ragnarök"
	"StateFlags"		"4"
	"installdir"		"God of War Ragnarok"
}
EOF
    mkdir -p "$EXTERNAL_LIB/steamapps/common/God of War Ragnarok"
    
    # Monster Hunter: World (582010)
    cat > "$EXTERNAL_LIB/steamapps/appmanifest_582010.acf" << 'EOF'
"AppState"
{
	"appid"		"582010"
	"Universe"		"1"
	"name"		"Monster Hunter: World"
	"StateFlags"		"4"
	"installdir"		"Monster Hunter World"
}
EOF
    mkdir -p "$EXTERNAL_LIB/steamapps/common/Monster Hunter World"
    
    # Resident Evil 4 (2050650)
    cat > "$EXTERNAL_LIB/steamapps/appmanifest_2050650.acf" << 'EOF'
"AppState"
{
	"appid"		"2050650"
	"Universe"		"1"
	"name"		"Resident Evil 4"
	"StateFlags"		"4"
	"installdir"		"Resident Evil 4"
}
EOF
    mkdir -p "$EXTERNAL_LIB/steamapps/common/Resident Evil 4"
    
    # Baldur's Gate 3 (1086940)
    cat > "$EXTERNAL_LIB/steamapps/appmanifest_1086940.acf" << 'EOF'
"AppState"
{
	"appid"		"1086940"
	"Universe"		"1"
	"name"		"Baldur's Gate 3"
	"StateFlags"		"4"
	"installdir"		"Baldurs Gate 3"
}
EOF
    mkdir -p "$EXTERNAL_LIB/steamapps/common/Baldurs Gate 3"
    
    # Nioh 2 (1325200)
    cat > "$EXTERNAL_LIB/steamapps/appmanifest_1325200.acf" << 'EOF'
"AppState"
{
	"appid"		"1325200"
	"Universe"		"1"
	"name"		"Nioh 2 – The Complete Edition"
	"StateFlags"		"4"
	"installdir"		"Nioh 2"
}
EOF
    mkdir -p "$EXTERNAL_LIB/steamapps/common/Nioh 2"
    
    # Sekiro Shadows Die Twice (814380)
    cat > "$EXTERNAL_LIB/steamapps/appmanifest_814380.acf" << 'EOF'
"AppState"
{
	"appid"		"814380"
	"Universe"		"1"
	"name"		"Sekiro™: Shadows Die Twice"
	"StateFlags"		"4"
	"installdir"		"Sekiro"
}
EOF
    mkdir -p "$EXTERNAL_LIB/steamapps/common/Sekiro"
    
    # Lies of P (1627720)
    cat > "$EXTERNAL_LIB/steamapps/appmanifest_1627720.acf" << 'EOF'
"AppState"
{
	"appid"		"1627720"
	"Universe"		"1"
	"name"		"Lies of P"
	"StateFlags"		"4"
	"installdir"		"Lies of P"
}
EOF
    mkdir -p "$EXTERNAL_LIB/steamapps/common/Lies of P"
else
    echo "Note: /Volumes/External not found, skipping external library setup"
fi

echo "Fake Steam environment setup complete!"
echo ""
echo "Created structure:"
echo "- Main library: $STEAM_ROOT"
echo "- Games in library 0: Stellar Blade, Black Myth Wukong, Doom The Dark Ages, The Witcher 3, Cyberpunk 2077, Red Dead Redemption 2"
echo "- External library: $EXTERNAL_LIB (if /Volumes/External exists)"
echo "- Games in library 1: God of War Ragnarök, Monster Hunter World, Resident Evil 4, Baldur's Gate 3, Nioh 2, Sekiro, Lies of P"
echo "- Steam user IDs: ${USER_IDS[*]}"
echo "- Save files created for:"
echo "  * Steam Cloud saves: Created for all users"
echo "  * Local saves: Created in Documents/Application Support folders"
echo ""
echo "You can now test the game scanner with this fake Steam installation."