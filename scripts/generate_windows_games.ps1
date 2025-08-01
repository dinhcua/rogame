# PowerShell script to generate fake Steam games on Windows C: drive
# This script creates game directories and appmanifest files based on libraryfolders.vdf

$steamPaths = @(
    "C:\Program Files (x86)\Steam"
)

# Games to create (from save_game_location.json)
$games = @(
    @{id="3489700"; name="Stellar Blade"; size="62579662617"},
    @{id="2680010"; name="The First Berserker Khazan"; size="21357340552"},
    @{id="2277560"; name="WUCHANG Fallen Feathers"; size="8365222843"},
    @{id="2358720"; name="Black Myth Wukong"; size="45397790233"},
    @{id="3017860"; name="Doom The Dark Ages"; size="15482960384"},
    @{id="228980"; name="Steamworks Common Redistributables"; size="226466092"},
    @{id="1184140"; name="Crusader Kings III"; size="21357340552"},
    @{id="774171"; name="Football Manager 2018"; size="3947927629"},
    @{id="3132990"; name="Elden Ring"; size="8365222843"},
    @{id="2452280"; name="Sekiro Shadows Die Twice"; size="45397790233"}
)

# Create Steam directories
foreach ($steamPath in $steamPaths) {
    if (-not (Test-Path $steamPath)) {
        New-Item -ItemType Directory -Path $steamPath -Force
        Write-Host "Created Steam directory: $steamPath"
    }
    
    # Create steamapps directory
    $steamappsPath = Join-Path $steamPath "steamapps"
    if (-not (Test-Path $steamappsPath)) {
        New-Item -ItemType Directory -Path $steamappsPath -Force
    }
    
    # Create common directory
    $commonPath = Join-Path $steamappsPath "common"
    if (-not (Test-Path $commonPath)) {
        New-Item -ItemType Directory -Path $commonPath -Force
    }
}

# Distribute games across libraries
$gameIndex = 0
foreach ($game in $games) {
    $libraryIndex = $gameIndex % $steamPaths.Count
    $steamPath = $steamPaths[$libraryIndex]
    $steamappsPath = Join-Path $steamPath "steamapps"
    $commonPath = Join-Path $steamappsPath "common"
    
    # Create game directory
    $gameName = $game.name -replace ":", ""
    $gameDir = Join-Path $commonPath $gameName
    if (-not (Test-Path $gameDir)) {
        New-Item -ItemType Directory -Path $gameDir -Force
        Write-Host "Created game directory: $gameDir"
    }
    
    # Create some fake game files
    $exeName = "$($gameName -replace ' ', '').exe"
    $exePath = Join-Path $gameDir $exeName
    "Fake game executable" | Out-File -FilePath $exePath
    
    # Create appmanifest file
    $manifestPath = Join-Path $steamappsPath "appmanifest_$($game.id).acf"
    $manifest = @"
"AppState"
{
	"appid"		"$($game.id)"
	"Universe"		"1"
	"name"		"$($game.name)"
	"StateFlags"		"4"
	"installdir"		"$gameName"
	"LastUpdated"		"1752909164"
	"SizeOnDisk"		"$($game.size)"
	"StagingSize"		"0"
	"buildid"		"14654865"
	"LastOwner"		"76561198123456789"
	"UpdateResult"		"0"
	"BytesToDownload"		"0"
	"BytesDownloaded"		"0"
	"BytesToStage"		"0"
	"BytesStaged"		"0"
	"TargetBuildID"		"14654865"
	"AutoUpdateBehavior"		"0"
	"AllowOtherDownloadsWhileRunning"		"0"
	"ScheduledAutoUpdate"		"0"
	"InstalledDepots"
	{
		"$($game.id)"
		{
			"manifest"		"1234567890123456789"
			"size"		"$($game.size)"
		}
	}
	"SharedDepots"
	{
	}
	"UserConfig"
	{
		"language"		"english"
	}
	"MountedConfig"
	{
		"language"		"english"
	}
}
"@
    $manifest | Out-File -FilePath $manifestPath -Encoding ASCII
    Write-Host "Created appmanifest: $manifestPath"
    
    $gameIndex++
}

# Create save game directories
$userDataPath = "$env:APPDATA\..\Local"
$steamUserDataPath = "$env:APPDATA\..\Local\Steam\userdata\123456789"

# Create Steam userdata directory
if (-not (Test-Path $steamUserDataPath)) {
    New-Item -ItemType Directory -Path $steamUserDataPath -Force
}

# Game-specific save locations
$saveLocations = @(
    @{name="SB"; path="$userDataPath\SB\Saved\SaveGames"},
    @{name="The First Berserker Khazan"; path="$userDataPath\The First Berserker Khazan\Saved\SaveGames"},
    @{name="Project_Plague"; path="$userDataPath\Project_Plague\Saved"},
    @{name="Black Myth Wukong"; path="$userDataPath\Black Myth Wukong\Saved\SaveGames"},
    @{name="Doom The Dark Ages"; path="$userDataPath\Doom The Dark Ages\Saved\SaveGames"}
)

foreach ($saveLocation in $saveLocations) {
    if (-not (Test-Path $saveLocation.path)) {
        New-Item -ItemType Directory -Path $saveLocation.path -Force
        Write-Host "Created save directory: $($saveLocation.path)"
        
        # Create some fake save files
        $savePath1 = Join-Path $saveLocation.path "save1.sav"
        $savePath2 = Join-Path $saveLocation.path "save2.sav"
        $savePath3 = Join-Path $saveLocation.path "autosave.sav"
        
        # Create fake save data
        $fakeData = [byte[]]::new(1024 * 10)  # 10KB of fake data
        [System.IO.File]::WriteAllBytes($savePath1, $fakeData)
        [System.IO.File]::WriteAllBytes($savePath2, $fakeData)
        [System.IO.File]::WriteAllBytes($savePath3, $fakeData)
        
        Write-Host "Created save files in: $($saveLocation.path)"
    }
}

# Create libraryfolders.vdf
$libraryFoldersPath = "C:\Program Files (x86)\Steam\config\libraryfolders.vdf"
$configPath = Split-Path $libraryFoldersPath -Parent
if (-not (Test-Path $configPath)) {
    New-Item -ItemType Directory -Path $configPath -Force
}

$libraryContent = @"
"libraryfolders"
{
	"0"
	{
		"path"		"C:\\Program Files (x86)\\Steam"
		"label"		""
		"contentid"		"3923732609870923804"
		"totalsize"		"512092008448"
		"update_clean_bytes_tally"		"118772547"
		"time_last_update_verified"		"1752909164"
		"apps"
		{
			"228980"		"226466092"
			"1184140"		"21357340552"
			"774171"		"3947927629"
			"2680010"		"21357340552"
			"2277560"		"8365222843"
			"3132990"		"8365222843"
			"3489700"		"62579662617"
			"2452280"		"45397790233"
			"2358720"		"45397790233"
			"3017860"		"15482960384"
		}
	}
}
"@

$libraryContent | Out-File -FilePath $libraryFoldersPath -Encoding ASCII
Write-Host "Created libraryfolders.vdf: $libraryFoldersPath"

Write-Host "`nScript completed successfully!"
Write-Host "Games have been created in the following locations:"
foreach ($steamPath in $steamPaths) {
    Write-Host "  - $steamPath"
}
Write-Host "`nSave files have been created in:"
foreach ($saveLocation in $saveLocations) {
    Write-Host "  - $($saveLocation.path)"
}