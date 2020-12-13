echo off

set arg1=%1

SET mypath=%~dp0

cd %mypath%

copy %mypath%\misc\weblogic.xml.%arg1% %mypath%\src-web\WEB-INF\weblogic.xml

grunt build:release --platform=web
