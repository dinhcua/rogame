@echo off
echo Testing Rogame Deep Links on Windows
echo ====================================
echo.

echo Test 1: Navigate to game with ID 1
start rogame://game/1
timeout /t 2 /nobreak >nul

echo.
echo Test 2: Trigger backup for game ID 2
start rogame://backup/2
timeout /t 2 /nobreak >nul

echo.
echo Test 3: Trigger restore for game ID 3
start rogame://restore/3
timeout /t 2 /nobreak >nul

echo.
echo Test 4: Trigger game scan
start rogame://scan
timeout /t 2 /nobreak >nul

echo.
echo All tests completed!
echo Check the application console for deep link handling logs.
pause