@echo off
cd /d "%~dp0"

set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"

if not exist "%CSC%" goto :NoCsc

echo Compiling ThaiSmartCardAgent...
"%CSC%" /nologo /out:ThaiSmartCardAgent.exe Agent.cs

if exist ThaiSmartCardAgent.exe (
    echo Compilation successful! Starting Agent...
    ThaiSmartCardAgent.exe
    exit /b 0
) else (
    echo Compilation failed.
    pause
    exit /b 1
)

:NoCsc
echo Error: C# Compiler (csc.exe) not found on this system.
pause
exit /b 1