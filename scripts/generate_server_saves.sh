#!/bin/bash

# Script to generate fake game saves on the server for testing
# Creates structure: uploads/shared/{steam_id}/{save_id}/
# Each save folder contains: save files (zipped) and metadata.json

echo "Setting up fake game saves on server..."

# Server uploads directory
SERVER_ROOT="server/uploads/shared"

# Create server uploads directory
echo "Creating server uploads directory..."
mkdir -p "$SERVER_ROOT"

# Function to generate random hex string for IDs
generate_id() {
    openssl rand -hex 16
}

# Function to create a save package with metadata
create_save_package() {
    local steam_id=$1
    local game_id=$2
    local game_title=$3
    local save_name=$4
    local description=$5
    local uploaded_by=$6
    shift 6
    local files=("$@")
    
    # Generate save ID
    local save_id=$(generate_id)
    local save_dir="$SERVER_ROOT/$steam_id/$save_id"
    
    # Create directory structure
    mkdir -p "$save_dir"
    
    # Create temporary directory for files to zip
    local temp_dir=$(mktemp -d)
    
    # Create save files in temp directory
    for file_data in "${files[@]}"; do
        IFS='|' read -r filename content <<< "$file_data"
        echo "$content" > "$temp_dir/$filename"
    done
    
    # Create zip file
    (cd "$temp_dir" && zip -qr save_files.zip .)
    cp "$temp_dir/save_files.zip" "$save_dir/save_files.zip"
    
    # Get zip file size
    local zip_size=$(stat -f "%z" "$save_dir/save_files.zip" 2>/dev/null || echo "0")
    
    # Generate random download count (macOS doesn't have shuf)
    local download_count=$((50 + RANDOM % 1450))
    
    # Create metadata.json
    cat > "$save_dir/metadata.json" << EOF
{
  "save_id": "$save_id",
  "steam_id": "$steam_id",
  "game_id": "$game_id",
  "game_title": "$game_title",
  "save_name": "$save_name",
  "description": "$description",
  "uploaded_by": "$uploaded_by",
  "uploaded_at": "$(date -u '+%Y-%m-%dT%H:%M:%S.000Z')",
  "download_count": $download_count,
  "size": $zip_size,
  "platform": "pc",
  "files": [
$(
    first=true
    for file_data in "${files[@]}"; do
        IFS='|' read -r filename _ <<< "$file_data"
        if [ "$first" = true ]; then
            first=false
        else
            echo ","
        fi
        echo -n "    \"$filename\""
    done
    echo ""
)
  ]
}
EOF
    
    # Clean up temp directory
    rm -rf "$temp_dir"
    
    echo "Created save package: $save_dir"
}

echo "Creating save packages for popular games..."

# Dota 2 (570)
echo "Creating Dota 2 saves..."
create_save_package "570" "570" "Dota 2" \
    "Immortal Rank Settings" \
    "Cài đặt từ player Immortal rank với keybinds tối ưu cho micro" \
    "ProPlayer_VN" \
    "autoexec.cfg|// Immortal Player Config
dota_camera_speed \"3500\"
dota_camera_accelerate \"49\"
dota_ability_quick_cast \"1\"
fps_max \"144\"
mat_vsync \"0\"" \
    "hero_builds.txt|Invoker: Quas Wex Build
Storm Spirit: Bloodstone Rush
Meepo: Blink First"

create_save_package "570" "570" "Dota 2" \
    "All Heroes Unlocked" \
    "Save với tất cả heroes level max, full items, battle pass level 1000+" \
    "SaveMaster2024" \
    "player.dat|DOTA2_SAVE_V2
Heroes=ALL_UNLOCKED
Level=1000
MMR=9999
BattlePass=1337"

# Counter-Strike 2 (730)
echo "Creating Counter-Strike 2 saves..."
create_save_package "730" "730" "Counter-Strike 2" \
    "Faceit Level 10 Config" \
    "Config từ player Faceit Level 10, crosshair và settings chuẩn pro" \
    "CS2_Elite" \
    "config.cfg|// Faceit Level 10 Config
sensitivity \"1.2\"
cl_crosshairsize \"2\"
cl_crosshairstyle \"4\"
cl_crosshairgap \"-2\"
fps_max \"400\"" \
    "autoexec.cfg|bind \"f\" \"+lookatweapon\"
bind \"mouse1\" \"+attack\"
bind \"space\" \"+jump\""

create_save_package "730" "730" "Counter-Strike 2" \
    "Mirage Smoke Lineups" \
    "Tất cả smoke lineups cho map Mirage, từ A site đến B site" \
    "NadeKing" \
    "mirage_smokes.cfg|// Mirage Smoke Lineups
alias \"smoke_ct\" \"setpos 680 -1230 -108; setang -31 134\"
alias \"smoke_jungle\" \"setpos -760 -1290 -108; setang -45 45\"
alias \"smoke_stairs\" \"setpos -1210 -1100 -44; setang -37 91\"
alias \"smoke_window\" \"setpos -2190 880 -108; setang -28 -8\""

# The Witcher 3 (292030)
echo "Creating The Witcher 3 saves..."
create_save_package "292030" "292030" "The Witcher 3: Wild Hunt" \
    "Death March Complete" \
    "Save đã hoàn thành Death March difficulty, Geralt level 100" \
    "WitcherMaster" \
    "ManualSave_001.sav|W3_SAVE_GAME_V36
PlayerLevel=100
Difficulty=DEATH_MARCH
QuestsCompleted=ALL
NewGamePlus=TRUE" \
    "user.settings|[Gameplay]
DifficultyLevel=4
EnemyUpscaling=true"

create_save_package "292030" "292030" "The Witcher 3: Wild Hunt" \
    "All Gwent Cards" \
    "Save với full bộ bài Gwent, kể cả các thẻ hiếm từ DLC" \
    "GwentCollector" \
    "AutoSave_002.sav|W3_SAVE_GAME_V36
GwentCards=ALL_COLLECTED
NorthernRealms=COMPLETE
Nilfgaard=COMPLETE
Scoiatael=COMPLETE
Monsters=COMPLETE"

# GTA V (271590)
echo "Creating GTA V saves..."
create_save_package "271590" "271590" "Grand Theft Auto V" \
    "Billionaire Save" \
    "Save với 10 tỷ đô cho mỗi nhân vật, tất cả properties đã mua" \
    "MoneyGlitch" \
    "SGTA50015|GTAV_SAVE_V10
Michael=$10,000,000,000
Franklin=$10,000,000,000
Trevor=$10,000,000,000
Properties=ALL_PURCHASED" \
    "settings.xml|<Settings>
  <Version>37</Version>
  <Graphics>Ultra</Graphics>
</Settings>"

# Black Myth: Wukong (2358720)
echo "Creating Black Myth: Wukong saves..."
create_save_package "2358720" "2358720" "Black Myth: Wukong" \
    "Chapter 6 Complete" \
    "Save đã hoàn thành chương 6, full trang bị legendary" \
    "WukongMaster" \
    "SaveSlot01.sav|BMW_SAVE_V1
Chapter=6
Level=80
Spirit=999999
Gourd=MaxLevel
Armor=Legendary_Set
Skills=ALL_UNLOCKED" \
    "Settings.cfg|[Graphics]
Quality=Epic
RTX=Enabled
DLSS=Quality"

create_save_package "2358720" "2358720" "Black Myth: Wukong" \
    "All Bosses Defeated" \
    "Save với tất cả boss đã đánh bại, 100% achievements" \
    "MonkeyKing" \
    "SaveSlot02.sav|BMW_SAVE_V1
BossesDefeated=ALL
Achievements=100%
Transformations=ALL_UNLOCKED
StaffUpgrades=MAX"

create_save_package "2358720" "2358720" "Black Myth: Wukong" \
    "NG+ Ready" \
    "Save sẵn sàng cho New Game Plus với best gear" \
    "SaveCollector" \
    "SaveSlot03.sav|BMW_SAVE_V1
NewGamePlus=READY
Level=99
AllRelics=TRUE
BestGear=EQUIPPED"

create_save_package "2358720" "2358720" "Black Myth: Wukong" \
    "Chapter 1 Boss Rush" \
    "Save tại chương 1 với tất cả boss có thể tái chiến" \
    "BossHunter" \
    "SaveSlot04.sav|BMW_SAVE_V1
Chapter=1
BossRushMode=ENABLED
BlackBearGuai=AVAILABLE
LingxuziHead=AVAILABLE
ElderJinchi=AVAILABLE"

create_save_package "2358720" "2358720" "Black Myth: Wukong" \
    "Speedrun Save" \
    "Save tối ưu cho speedrun với route hoàn hảo" \
    "SpeedRunner" \
    "SaveSlot05.sav|BMW_SAVE_V1
SpeedrunOptimized=TRUE
SkipCutscenes=ENABLED
MinimalGear=TRUE
OptimalRoute=LOADED"

create_save_package "2358720" "2358720" "Black Myth: Wukong" \
    "All Transformations" \
    "Save với tất cả 72 biến hóa đã mở khóa" \
    "TransformMaster" \
    "SaveSlot06.sav|BMW_SAVE_V1
Transformations=72
AllSpirits=COLLECTED
TransformSkills=MAX
SpiritEssence=999999"

create_save_package "2358720" "2358720" "Black Myth: Wukong" \
    "Perfect Parry Build" \
    "Build tập trung vào perfect parry và counter" \
    "ParryKing" \
    "SaveSlot07.sav|BMW_SAVE_V1
FocusPoints=ALL_PARRY
RockSolid=MAX_LEVEL
PerfectDodge=MASTERED
CounterDamage=300%"

create_save_package "2358720" "2358720" "Black Myth: Wukong" \
    "Chapter 3 Yellow Wind" \
    "Save tại chương 3 với Yellow Wind Sage sẵn sàng chiến đấu" \
    "WindMaster" \
    "SaveSlot08.sav|BMW_SAVE_V1
Chapter=3
YellowWindSage=READY
WindResistance=MAX
SandstormCleared=TRUE"

# Cyberpunk 2077 (1091500)
echo "Creating Cyberpunk 2077 saves..."
create_save_package "1091500" "1091500" "Cyberpunk 2077" \
    "Max Street Cred" \
    "V với max Street Cred, tất cả cyberware legendary đã cài đặt" \
    "NightCityLegend" \
    "ManualSave-000.dat|CP77_SAVE_V186
CharacterLevel=50
StreetCred=50
Attributes=ALL_20
Cyberware=ALL_LEGENDARY" \
    "UserSettings.json|{
  \"version\": \"186\",
  \"difficulty\": \"VeryHard\",
  \"raytracing\": true
}"

# Elden Ring (1245620)
echo "Creating Elden Ring saves..."
create_save_package "1245620" "1245620" "Elden Ring" \
    "All Bosses Defeated" \
    "Save đã đánh bại tất cả boss, có đủ remembrances" \
    "TarnishedOne" \
    "ER0000.sl2|ER_SAVE_V174
CharacterLevel=150
Runes=9999999
BossesDefeated=ALL
Remembrances=ALL_COLLECTED"

create_save_package "1245620" "1245620" "Elden Ring" \
    "PvP Meta Build" \
    "Build PvP meta level 125 với Rivers of Blood và Bull-Goat armor" \
    "PvPMaster" \
    "ER0001.sl2|ER_SAVE_V174
CharacterLevel=125
Vigor=60
Dexterity=50
Arcane=45
Weapon=RiversOfBlood+10
Armor=BullGoatSet"

# Red Dead Redemption 2 (1174180)
echo "Creating Red Dead Redemption 2 saves..."
create_save_package "1174180" "1174180" "Red Dead Redemption 2" \
    "Perfect Honor Arthur" \
    "Xong chương 3, Arthur với max honor, $50,000, tất cả legendary animals đã săn" \
    "CowboyLegend" \
    "SRDR30000.sav|RDR2_SAVE_V12
Chapter=3
CharacterName=Arthur Morgan
Honor=MAXIMUM
Money=50000
LegendaryAnimals=ALL_HUNTED
LegendaryFish=ALL_CAUGHT" \
    "settings.xml|<Settings>
  <Graphics>Ultra</Graphics>
  <DLSS>Quality</DLSS>
</Settings>"

# Hogwarts Legacy (990080)
echo "Creating Hogwarts Legacy saves..."
create_save_package "990080" "990080" "Hogwarts Legacy" \
    "All Spells & Unforgivables" \
    "Save với tất cả spells đã học, kể cả 3 Unforgivable Curses" \
    "DarkWizard" \
    "HL-00-00.sav|HL_SAVE_V27
StudentLevel=40
House=Slytherin
SpellsLearned=ALL
UnforgivableCurses=ALL_LEARNED
TalentPoints=48"

# Sekiro (814380)
echo "Creating Sekiro saves..."
create_save_package "814380" "814380" "Sekiro: Shadows Die Twice" \
    "No Death Run" \
    "Save hoàn thành game không chết lần nào, Shura ending" \
    "SekiroGod" \
    "S0000.sl2|SEKIRO_SAVE_V22
Deaths=0
AttackPower=99
Vitality=20
Skills=ALL_UNLOCKED
Ending=SHURA"

# Persona 5 Royal (1687950)
echo "Creating Persona 5 Royal saves..."
create_save_package "1687950" "1687950" "Persona 5 Royal" \
    "Max Confidants" \
    "Save với tất cả Confidants rank MAX, perfect schedule guide" \
    "PhantomThief" \
    "DATA.DAT|P5R_SAVE_V33
Date=3/19
Confidants=ALL_MAX_RANK
SocialStats=ALL_MAX
PersonaCompendium=100%" \
    "SYSTEM.DAT|P5R_SYSTEM_V33
Difficulty=Merciless
NewGamePlus=Available"

# Monster Hunter World (582010)
echo "Creating Monster Hunter World saves..."
create_save_package "582010" "582010" "Monster Hunter: World" \
    "HR999 All Gear" \
    "Hunter Rank 999 với tất cả armor sets và weapons" \
    "HunterElite" \
    "SAVEDATA1000|MHW_SAVE_V15
HunterRank=999
MasterRank=999
Zenny=99999999
ResearchPoints=9999999
ArmorSets=ALL_CRAFTED
Weapons=ALL_CRAFTED"

# God of War Ragnarök (2322010)
echo "Creating God of War Ragnarök saves..."
create_save_package "2322010" "2322010" "God of War Ragnarök" \
    "Give Me God of War Complete" \
    "Hoàn thành ở độ khó cao nhất, tất cả collectibles" \
    "GodSlayer" \
    "save_0.sav|GOWR_SAVE_V47
Difficulty=GMGOW
Story=COMPLETE
Collectibles=ALL_FOUND
Armor=ALL_UPGRADED
Skills=ALL_UNLOCKED"

# Create index file for easy access
echo "Creating index file..."
INDEX_FILE="$SERVER_ROOT/index.json"
echo "{" > "$INDEX_FILE"
echo "  \"saves\": [" >> "$INDEX_FILE"

# Add all saves to index
first=true
for steam_id in $(ls "$SERVER_ROOT"); do
    if [ -d "$SERVER_ROOT/$steam_id" ]; then
        for save_id in $(ls "$SERVER_ROOT/$steam_id"); do
            if [ -f "$SERVER_ROOT/$steam_id/$save_id/metadata.json" ]; then
                if [ "$first" = true ]; then
                    first=false
                else
                    echo "," >> "$INDEX_FILE"
                fi
                echo -n "    {
      \"steam_id\": \"$steam_id\",
      \"save_id\": \"$save_id\",
      \"metadata_path\": \"$steam_id/$save_id/metadata.json\"
    }" >> "$INDEX_FILE"
            fi
        done
    fi
done

echo "" >> "$INDEX_FILE"
echo "  ]" >> "$INDEX_FILE"
echo "}" >> "$INDEX_FILE"

echo ""
echo "✅ Fake server saves setup complete!"
echo ""
echo "Created structure:"
echo "- Root directory: $SERVER_ROOT"
echo "- Organized by Steam App IDs (game IDs)"
echo "- Each save contains:"
echo "  - save_files.zip (compressed save files)"
echo "  - metadata.json (save information)"
echo "- Index file: $INDEX_FILE"
echo ""
echo "Total saves created: $(find "$SERVER_ROOT" -name "metadata.json" | wc -l | tr -d ' ')"
echo "Games included: $(ls "$SERVER_ROOT" | wc -l | tr -d ' ')"
echo ""
echo "The server can now serve these community shared saves."