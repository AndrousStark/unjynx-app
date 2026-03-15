Set-Location "C:\Users\SaveLIFE Foundation\Downloads\personal\Project- TODO Reminder app\apps\mobile"
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
& "C:\Users\SaveLIFE Foundation\development\flutter\bin\dart.bat" analyze lib 2>&1
exit $LASTEXITCODE
