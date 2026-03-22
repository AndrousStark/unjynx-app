# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# Kotlinx Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class com.metaminds.unjynx.wear.**$$serializer { *; }
-keepclassmembers class com.metaminds.unjynx.wear.** {
    *** Companion;
}
-keepclasseswithmembers class com.metaminds.unjynx.wear.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Wear OS
-keep class androidx.wear.** { *; }
