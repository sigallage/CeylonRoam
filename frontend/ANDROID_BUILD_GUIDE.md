# CeylonRoam Android Build Guide

Quick guide to build and test the CeylonRoam Android app on your phone.

## 🚀 Quick Start - Build APK for Testing

### Option 1: Using the Build Script (Easiest)

```bash
cd frontend
.\build-apk.bat
```

This will:
1. Build your React app
2. Sync with Capacitor
3. Generate a debug APK

**Output:** `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Manual Commands

```bash
cd frontend

# 1. Build web app
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Build APK
cd android
gradlew assembleDebug
cd ..
```

---

## 📱 Installing on Your Phone

### Method 1: USB Installation (Recommended)

1. **Enable Developer Options** on your phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Developer Options will appear in Settings

2. **Enable USB Debugging**:
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

3. **Connect phone via USB** and allow debugging when prompted

4. **Install the APK**:
   ```bash
   cd frontend
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Method 2: Direct Installation

1. Copy `app-debug.apk` to your phone (via USB, cloud, email, etc.)
2. On your phone, enable "Install from Unknown Sources"
3. Open the APK file and install

---

## 🏪 Building for Play Store (AAB Format)

For Google Play Store submission, you need an Android App Bundle (AAB):

```bash
cd frontend
.\build-aab.bat
```

**Note:** Release builds require signing configuration (see below).

---

## 🔑 Signing Configuration (For Release Builds)

### Step 1: Generate a Keystore

```bash
cd frontend/android
keytool -genkey -v -keystore ceylonroam.keystore -alias ceylonroam -keyalg RSA -keysize 2048 -validity 10000
```

Answer the prompts and **remember your passwords!**

### Step 2: Configure Signing

Create `frontend/android/key.properties`:

```properties
storePassword=your_keystore_password
keyPassword=your_key_password
keyAlias=ceylonroam
storeFile=ceylonroam.keystore
```

### Step 3: Update build.gradle

Add to `frontend/android/app/build.gradle`:

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 4: Build Signed Release

```bash
cd frontend/android
gradlew bundleRelease  # For AAB (Play Store)
# OR
gradlew assembleRelease  # For APK
```

**Outputs:**
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔧 Build Variants

| Build Type | Command | Use Case | Size | Output |
|------------|---------|----------|------|--------|
| **Debug APK** | `gradlew assembleDebug` | Testing | Larger | app-debug.apk |
| **Release APK** | `gradlew assembleRelease` | Distribution | Smaller | app-release.apk |
| **Release AAB** | `gradlew bundleRelease` | Play Store | Optimized | app-release.aab |

---

## 📋 Build Configuration

### Update App Version

Edit `frontend/android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 2          # Increment for each release
    versionName "1.1.0"   # User-facing version
    ...
}
```

### Update App Info

Edit `frontend/capacitor.config.json`:

```json
{
  "appId": "com.ceylonroam.app",
  "appName": "CeylonRoam",
  ...
}
```

### App Icon

Replace icons in:
- `frontend/android/app/src/main/res/mipmap-*/ic_launcher.png`
- `frontend/android/app/src/main/res/mipmap-*/ic_launcher_round.png`

Or use Android Studio: Right-click `res` → New → Image Asset

---

## 🐛 Troubleshooting

### Build Fails - "SDK not found"

Install Android SDK via Android Studio or:
```bash
# Set ANDROID_HOME environment variable
setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"
```

### "gradlew: command not found"

```bash
# Use the full path
.\gradlew.bat assembleDebug
```

### App Crashes on Launch

1. Check logs:
   ```bash
   adb logcat | findstr ceylonroam
   ```

2. Clear app data and reinstall:
   ```bash
   adb uninstall com.ceylonroam.app
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Changes Not Reflected

1. Clean and rebuild:
   ```bash
   npm run build
   npx cap sync android
   cd android
   gradlew clean assembleDebug
   ```

### "Installed app but can't find it"

Look for "CeylonRoam" in your app drawer (name from `capacitor.config.json`)

---

## 📱 Testing on Emulator

1. Open Android Studio
2. Open project: `frontend/android`
3. Click Run (green play button)
4. Select/create emulator

Or via command line:
```bash
npx cap run android
```

---

## 📊 Build Size Optimization

For production builds, enable minification in `build.gradle`:

```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

---

## 🔗 Useful Commands

```bash
# List connected devices
adb devices

# Install APK
adb install path/to/app.apk

# Uninstall app
adb uninstall com.ceylonroam.app

# View logs
adb logcat

# Take screenshot
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png

# Open Android Studio
npx cap open android

# Run on device
npx cap run android
```

---

## 📚 Additional Resources

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Developer Guide](https://developer.android.com/studio/build)
- [Publishing to Play Store](https://developer.android.com/studio/publish)

---

## ✅ Pre-Release Checklist

- [ ] Update version code and version name
- [ ] Test on multiple devices/Android versions
- [ ] Update app icon and splash screen
- [ ] Configure signing for release builds
- [ ] Test all features (camera, location, etc.)
- [ ] Check app permissions in AndroidManifest.xml
- [ ] Optimize build size
- [ ] Test offline functionality
- [ ] Review Play Store listing requirements

---

**Ready to deploy? Build your APK with `.\build-apk.bat` and start testing!** 🚀
