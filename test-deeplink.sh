#!/bin/bash

echo "Testing Rogame Deep Links on macOS"
echo "=================================="
echo ""

echo "Test 1: Navigate to game with ID 1"
open "rogame://game/1"
sleep 2

echo ""
echo "Test 2: Trigger backup for game ID 2"
open "rogame://backup/2"
sleep 2

echo ""
echo "Test 3: Trigger restore for game ID 3"
open "rogame://restore/3"
sleep 2

echo ""
echo "Test 4: Trigger game scan"
open "rogame://scan"
sleep 2

echo ""
echo "All tests completed!"
echo "Check the application console for deep link handling logs."