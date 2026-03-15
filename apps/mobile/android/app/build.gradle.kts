plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
    // Firebase — applied only when google-services.json exists
    id("com.google.gms.google-services") apply false
}

// Conditionally apply google-services plugin when config file exists
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}

android {
    namespace = "com.metaminds.unjynx"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.metaminds.unjynx"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    // -------------------------------------------------------------------------
    // Release signing config — reads keystore details from environment variables
    // so secrets are never committed to source control.
    //
    // Required env vars for release builds:
    //   UNJYNX_KEYSTORE_PATH     — absolute path to the .jks keystore file
    //   UNJYNX_KEYSTORE_PASSWORD — keystore password
    //   UNJYNX_KEY_ALIAS         — key alias within the keystore
    //   UNJYNX_KEY_PASSWORD      — key password
    // -------------------------------------------------------------------------
    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("UNJYNX_KEYSTORE_PATH")
            if (keystorePath != null) {
                storeFile = file(keystorePath)
                storePassword = System.getenv("UNJYNX_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("UNJYNX_KEY_ALIAS")
                keyPassword = System.getenv("UNJYNX_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            // R8 code shrinking, obfuscation, and resource shrinking
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )

            // Use release signing config if keystore is configured,
            // otherwise fall back to debug keys for local testing.
            val releaseKeystore = System.getenv("UNJYNX_KEYSTORE_PATH")
            signingConfig = if (releaseKeystore != null) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

flutter {
    source = "../.."
}
