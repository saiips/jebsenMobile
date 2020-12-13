echo off

set arg1=%1

SET mypath=%~dp0
SET AAPT_PATH=C:\Users\pettam\AppData\Local\Android\sdk\build-tools\28.0.2\aapt.exe

%AAPT_PATH% dump badging %mypath%hybrid\platforms\android\build\outputs\apk\%arg1%



