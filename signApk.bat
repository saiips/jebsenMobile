echo off

cd %JAVA_HOME%/bin
c:
jarsigner -verbose -sigalg MD5withRSA -digestalg SHA1 -keystore D:\JebsenMobile\nbproject\keystore\android.jks -storepass welcome1 -signedjar D:/JebsenMobile/hybrid/platforms/android/build/outputs/apk/apk_signed.apk D:/JebsenMobile/hybrid/platforms/android/build/outputs/apk/android-release-unsigned.apk jebsenmobilekey

cd D:/JebsenMobile/hybrid/platforms/android/build/outputs/apk/
D: