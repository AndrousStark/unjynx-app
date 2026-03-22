plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "com.metaminds.unjynx.wear"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.metaminds.unjynx.wear"
        minSdk = 30 // Wear OS 3+
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // Compose for Wear OS
    val composeWearVersion = "1.4.0"
    implementation("androidx.wear.compose:compose-material3:$composeWearVersion")
    implementation("androidx.wear.compose:compose-foundation:$composeWearVersion")
    implementation("androidx.wear.compose:compose-navigation:$composeWearVersion")

    // Compose core
    val composeBomVersion = "2024.09.00"
    implementation(platform("androidx.compose:compose-bom:$composeBomVersion"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")

    // Activity Compose
    implementation("androidx.activity:activity-compose:1.9.2")

    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.5")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.5")

    // Wear OS Tiles
    val tilesVersion = "1.4.0"
    implementation("androidx.wear.tiles:tiles:$tilesVersion")
    implementation("androidx.wear.tiles:tiles-material:$tilesVersion")
    implementation("androidx.wear.tiles:tiles-renderer:$tilesVersion")

    // Horologist (Google's Wear OS helpers)
    val horologistVersion = "0.6.17"
    implementation("com.google.android.horologist:horologist-compose-layout:$horologistVersion")
    implementation("com.google.android.horologist:horologist-compose-material:$horologistVersion")
    implementation("com.google.android.horologist:horologist-tiles:$horologistVersion")

    // Wear OS Data Layer (phone <-> watch sync)
    implementation("com.google.android.gms:play-services-wearable:18.2.0")

    // OkHttp (lightweight HTTP)
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // Kotlinx Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-guava:1.8.1")

    // Guava (required by coroutines-guava for tiles)
    implementation("com.google.guava:guava:33.2.1-android")

    // WorkManager (background refresh)
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    // Wear OS complications data source
    implementation("androidx.wear.watchface:watchface-complications-data-source-ktx:1.2.1")

    // Splash screen
    implementation("androidx.core:core-splashscreen:1.0.1")
}
