$ErrorActionPreference = 'Stop'

Write-Host "Setting up Desktop App Build Environment..."
$pkgVersion = "1.0.2592.51"
$pkgUrl = "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/$pkgVersion"
$pkgFile = "webview2.zip"
$pkgDir = "webview2_pkg"

if (-not (Test-Path $pkgDir)) {
    Write-Host "Downloading WebView2 NuGet package..."
    Invoke-WebRequest -Uri $pkgUrl -OutFile $pkgFile
    Write-Host "Extracting package..."
    Expand-Archive -Path $pkgFile -DestinationPath $pkgDir -Force
}

Write-Host "Compiling PoliceDailyLog.exe..."
$csc = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"

$refs = "/r:$pkgDir\lib\net462\Microsoft.Web.WebView2.Core.dll,$pkgDir\lib\net462\Microsoft.Web.WebView2.WinForms.dll"
$target = "/target:winexe"
$out = "/out:PoliceDailyLog.exe"
$src = "DesktopApp.cs"

# Compile
& $csc $target $out $refs $src

if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation Successful!"
    
    $runtimesPath = "runtimes\win-x64\native"
    New-Item -ItemType Directory -Path $runtimesPath -Force | Out-Null
    Copy-Item "$pkgDir\build\native\x64\WebView2Loader.dll" -Destination $runtimesPath\WebView2Loader.dll -Force
    
    $runtimesPath86 = "runtimes\win-x86\native"
    New-Item -ItemType Directory -Path $runtimesPath86 -Force | Out-Null
    Copy-Item "$pkgDir\build\native\x86\WebView2Loader.dll" -Destination $runtimesPath86\WebView2Loader.dll -Force

    # Also copy the WebView2 managed DLLs to the executable directory
    Copy-Item "$pkgDir\lib\net462\Microsoft.Web.WebView2.Core.dll" -Destination "Microsoft.Web.WebView2.Core.dll" -Force
    Copy-Item "$pkgDir\lib\net462\Microsoft.Web.WebView2.WinForms.dll" -Destination "Microsoft.Web.WebView2.WinForms.dll" -Force

    Write-Host "Build complete! You can now run PoliceDailyLog.exe"
} else {
    Write-Host "Compilation Failed!"
}
