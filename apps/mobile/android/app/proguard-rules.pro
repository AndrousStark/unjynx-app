# ============================================================================
# UNJYNX ProGuard/R8 Rules
# ============================================================================
# Applied to release builds to obfuscate and shrink the APK.
# Keep rules prevent R8 from removing classes accessed via reflection.
# ============================================================================

# ----------------------------------------------------------------------------
# Flutter Engine & Plugins
# ----------------------------------------------------------------------------
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class io.flutter.embedding.** { *; }

# Dart obfuscation support — keep the native bridge
-keep class io.flutter.embedding.engine.deferredcomponents.** { *; }

# ----------------------------------------------------------------------------
# Annotations
# ----------------------------------------------------------------------------
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable
-keepattributes InnerClasses,EnclosingMethod
-keepattributes Exceptions

# ----------------------------------------------------------------------------
# Gson / JSON Serialization
# ----------------------------------------------------------------------------
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class com.google.gson.stream.** { *; }
-keepclassmembers,allowobfuscation class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
# Keep classes used as JSON models (generic type tokens)
-keep class * extends com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# ----------------------------------------------------------------------------
# OkHttp (used by Dio via platform channels)
# ----------------------------------------------------------------------------
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class okio.** { *; }

# ----------------------------------------------------------------------------
# flutter_secure_storage
# ----------------------------------------------------------------------------
-keep class com.it_nomads.fluttersecurestorage.** { *; }
-keep class androidx.security.crypto.** { *; }

# ----------------------------------------------------------------------------
# Google Play Billing (RevenueCat)
# ----------------------------------------------------------------------------
-keep class com.android.vending.billing.** { *; }
-keep class com.revenuecat.purchases.** { *; }
-keepclassmembers class com.revenuecat.purchases.** { *; }
-keep class com.android.billingclient.** { *; }

# ----------------------------------------------------------------------------
# Logto Auth (OIDC flows via WebView/CustomTabs)
# ----------------------------------------------------------------------------
-keep class io.logto.** { *; }
-keep class net.openid.appauth.** { *; }
-keep class androidx.browser.customtabs.** { *; }

# ----------------------------------------------------------------------------
# AndroidX / Multidex
# ----------------------------------------------------------------------------
-keep class androidx.lifecycle.** { *; }
-keep class androidx.core.** { *; }

# ----------------------------------------------------------------------------
# Firebase (Core, FCM, Crashlytics, Analytics)
# ----------------------------------------------------------------------------
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keep public class * extends java.lang.Exception
-keep class com.google.firebase.crashlytics.** { *; }
-keep class com.google.firebase.analytics.** { *; }
-keep class com.google.firebase.messaging.** { *; }

# Google Sign-In
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }

# ----------------------------------------------------------------------------
# Suppress Common Warnings
# ----------------------------------------------------------------------------
-dontwarn com.google.errorprone.annotations.**
-dontwarn com.google.j2objc.annotations.**
-dontwarn javax.annotation.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn sun.misc.Unsafe
-dontwarn java.lang.invoke.**
-dontwarn kotlin.**
-dontwarn kotlinx.**
-dontwarn org.bouncycastle.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**

# ----------------------------------------------------------------------------
# General Safety
# ----------------------------------------------------------------------------
# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelables
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
