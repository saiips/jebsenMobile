echo off

SET mypath=%~dp0

cd %mypath%

grunt build:release --platform=android