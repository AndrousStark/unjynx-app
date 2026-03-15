Set-Location "C:\Users\SaveLIFE Foundation\Downloads\personal\Project- TODO Reminder app\apps\mobile"
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
Write-Host "=== Running pub get ==="
& "C:\Users\SaveLIFE Foundation\development\flutter\bin\flutter.bat" pub get 2>&1 | Out-Host
Write-Host "=== Building debug APK ==="
& "C:\Users\SaveLIFE Foundation\development\flutter\bin\flutter.bat" build apk --debug 2>&1 | Out-Host
Write-Host "=== Build exit code: $LASTEXITCODE ==="
exit $LASTEXITCODE
