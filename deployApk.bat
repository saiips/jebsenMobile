echo off

adb shell pm uninstall -k org.oraclejet.jebsenmobile
adb install D:/JebsenMobile/hybrid/platforms/android/build/outputs/apk/android-debug.apk
adb shell monkey -p org.oraclejet.jebsenmobile -c android.intent.category.LAUNCHER 1