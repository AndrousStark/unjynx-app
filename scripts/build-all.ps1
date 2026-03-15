$shortRoot = "C:\Users\SAVELI~1\Downloads\personal\PROJEC~1"
$flutter = "C:\Users\SAVELI~1\development\flutter\bin\flutter.bat"
$dart = "C:\Users\SAVELI~1\development\flutter\bin\dart.bat"
$javaHome = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"

# Packages that need build_runner (have freezed/json_serializable)
$buildRunnerPackages = @(
    "packages\core",
    "packages\feature_todos",
    "packages\feature_projects",
    "packages\feature_settings",
    "packages\service_database"
)

Write-Host "=== Step 1: Pub get for mobile app ==="
cmd /c "set JAVA_HOME=$javaHome&& cd $shortRoot\apps\mobile && $flutter pub get"
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: pub get"; exit 1 }

Write-Host "=== Step 2: Build runner for packages ==="
foreach ($pkg in $buildRunnerPackages) {
    Write-Host "--- build_runner: $pkg ---"
    cmd /c "set JAVA_HOME=$javaHome&& cd $shortRoot\$pkg && $dart run build_runner build --delete-conflicting-outputs"
    if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: build_runner for $pkg"; exit 1 }
}

Write-Host "=== Step 3: Build debug APK ==="
cmd /c "set JAVA_HOME=$javaHome&& set FLUTTER_ROOT=C:\Users\SAVELI~1\development\flutter&& cd $shortRoot\apps\mobile && $flutter build apk --debug"
Write-Host "=== Build exit code: $LASTEXITCODE ==="
exit $LASTEXITCODE
