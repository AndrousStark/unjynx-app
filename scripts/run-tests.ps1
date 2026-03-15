$shortRoot = "C:\Users\SAVELI~1\Downloads\personal\PROJEC~1"
$flutter = "C:\Users\SAVELI~1\development\flutter\bin\flutter.bat"
$javaHome = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"

$packages = @(
    @{ name = "feature_profile"; tests = "test\profile_providers_test.dart" },
    @{ name = "feature_todos"; tests = "test\todo_search_filter_test.dart" }
)

$totalPassed = 0
$totalFailed = 0

foreach ($pkg in $packages) {
    $pkgPath = "$shortRoot\packages\$($pkg.name)"
    Write-Host "=== Testing: $($pkg.name) ===" -ForegroundColor Cyan

    $result = cmd /c "set JAVA_HOME=$javaHome&& cd $pkgPath && $flutter test $($pkg.tests) 2>&1"
    Write-Host $result

    if ($LASTEXITCODE -eq 0) {
        Write-Host "PASSED" -ForegroundColor Green
        $totalPassed++
    } else {
        Write-Host "FAILED" -ForegroundColor Red
        $totalFailed++
    }
    Write-Host ""
}

Write-Host "=== Summary: $totalPassed passed, $totalFailed failed ===" -ForegroundColor Yellow
exit $totalFailed
