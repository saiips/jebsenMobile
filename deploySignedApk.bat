echo off

cd C:\Program Files\Java\jdk1.8.0_101\bin
c:
jarsigner -verbose -sigalg MD5withRSA -digestalg SHA1 -keystore D:\JebsenMobile\nbproject\keystore\android.jks -storepass welcome1 -signedjar D:/JebsenMobile/hybrid/platforms/android/build/outputs/apk/apk_signed.apk D:/JebsenMobile/hybrid/platforms/android/build/outputs/apk/android-release-unsigned.apk jebsenmobilekey

cd D:/JebsenMobile
D:

adb shell pm uninstall -k org.oraclejet.jebsenmobile
adb install D:\JebsenMobile\hybrid\platforms\android\build\outputs\apk\apk_signed.apk
adb shell monkey -p org.oraclejet.jebsenmobile -c android.intent.category.LAUNCHER 1