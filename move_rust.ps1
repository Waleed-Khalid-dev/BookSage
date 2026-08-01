$ErrorActionPreference = "Stop"
$destDir = "D:\RustEnv"

Write-Host "1. Creating directory $destDir"
New-Item -ItemType Directory -Force -Path $destDir | Out-Null

Write-Host "2. Moving .cargo to D: (This will take a few seconds to copy 600MB...)"
if (Test-Path "C:\Users\Ace\.cargo") {
    Move-Item -Path "C:\Users\Ace\.cargo" -Destination "$destDir\.cargo" -Force
} else {
    Write-Host "C:\Users\Ace\.cargo not found, maybe already moved?"
}

Write-Host "3. Moving .rustup to D: (This will take 10-30 seconds to copy 1.3GB...)"
if (Test-Path "C:\Users\Ace\.rustup") {
    Move-Item -Path "C:\Users\Ace\.rustup" -Destination "$destDir\.rustup" -Force
} else {
    Write-Host "C:\Users\Ace\.rustup not found, maybe already moved?"
}

Write-Host "4. Setting Environment Variables"
[Environment]::SetEnvironmentVariable("CARGO_HOME", "$destDir\.cargo", "User")
[Environment]::SetEnvironmentVariable("RUSTUP_HOME", "$destDir\.rustup", "User")

Write-Host "5. Creating README.txt"
$readme = @"
==================================================
RUST ENVIRONMENT CACHE (Moved on 2026-08-01)
==================================================

WHAT HAPPENED?
To prevent your C: drive from getting completely filled up during Tauri/Rust builds, 
the global Rust caches (.cargo and .rustup) were moved here. This freed up ~2 GB 
of space on your C: drive.

HOW DOES IT WORK?
Two User Environment Variables were added to your system:
- CARGO_HOME = D:\RustEnv\.cargo
- RUSTUP_HOME = D:\RustEnv\.rustup
Whenever Rust compiles something, it will look here instead of your C: drive.

HOW TO UNDO:
If you ever want to put things back exactly as they were, double-click the 
'undo_rust_move.bat' file in this folder. It will move the folders back to C: 
and delete the environment variables.
"@
Set-Content -Path "$destDir\README.txt" -Value $readme

Write-Host "6. Creating undo_rust_move.bat"
$undo = @"
@echo off
echo =========================================
echo UNDOING RUST ENVIRONMENT MOVE
echo =========================================
echo.

echo 1. Moving .cargo back to C:\Users\Ace\.cargo ...
move "D:\RustEnv\.cargo" "C:\Users\Ace\.cargo"

echo 2. Moving .rustup back to C:\Users\Ace\.rustup ...
move "D:\RustEnv\.rustup" "C:\Users\Ace\.rustup"

echo 3. Removing Environment Variables CARGO_HOME and RUSTUP_HOME ...
REG delete HKCU\Environment /F /V CARGO_HOME
REG delete HKCU\Environment /F /V RUSTUP_HOME

echo.
echo Undo complete! Rust is back on your C: drive. 
echo You can now safely delete the D:\RustEnv folder.
pause
"@
Set-Content -Path "$destDir\undo_rust_move.bat" -Value $undo

Write-Host "Done!"
