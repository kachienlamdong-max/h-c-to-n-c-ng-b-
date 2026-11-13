# MathSpark Kids — Android APK Export Guide

This application is configured for both **Web / Installable PWA** and **Android Native Package (`.apk`)** export via Capacitor.

## Prerequisites
- Node.js 20+
- Java Development Kit (JDK 17+)
- Android Studio with Android SDK installed

## Build & Export Steps

1. **Install dependencies & build the web bundle**
   ```bash
   npm install
   npm run build
   ```

2. **Add the Android native project (first time only)**
   ```bash
   npm install -D @capacitor/cli @capacitor/android
   npx cap add android
   ```

3. **Sync web assets to Android**
   ```bash
   npx cap sync android
   ```

4. **Build the `.apk` via Gradle (or open in Android Studio)**
   - **Debug APK (for direct phone testing):**
     ```bash
     cd android && ./gradlew assembleDebug
     ```
     Output: `android/app/build/outputs/apk/debug/app-debug.apk`
   - **Release APK (for store / distribution):**
     ```bash
     cd android && ./gradlew assembleRelease
     ```
     Or run `npx cap open android` and choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

## Backend URL Configuration for Standalone APK
When packaging an APK that connects to your hosted Express backend:
- Set `VITE_API_BASE_URL=https://your-hosted-domain.com` in `.env` before running `npm run build`.
- Leave `VITE_API_BASE_URL` unset when running in standard full-stack Web / PWA mode so `/api/*` resolves to the same origin.
