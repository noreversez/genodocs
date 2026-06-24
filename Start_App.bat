@echo off
chcp 65001 >nul
cd /d "%~dp0"

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo กำลังขอสิทธิ์ Administrator...
    powershell -Command "Start-Process cmd -ArgumentList '/c', '\"%~dpnx0\"' -Verb RunAs"
    exit /b
)

echo กำลังเริ่มต้นโปรแกรมเบื้องหลัง (Agent)...
cd smartcard-agent
:: สร้างไฟล์ VBScript ชั่วคราวเพื่อรันแบบซ่อนหน้าต่าง
echo Set WshShell = CreateObject("WScript.Shell") > run_hidden.vbs
echo WshShell.Run "run_agent.bat", 0, False >> run_hidden.vbs
wscript.exe run_hidden.vbs
cd ..

echo กำลังเปิดหน้าแอปพลิเคชัน...
set "HTML_PATH=file:///%CD:\=/%/index.html"
start msedge --app="%HTML_PATH%"

exit