// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_profile.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_UserProfile _$UserProfileFromJson(Map<String, dynamic> json) => _UserProfile(
  id: json['id'] as String,
  logtoId: json['logtoId'] as String,
  email: json['email'] as String?,
  name: json['name'] as String?,
  avatarUrl: json['avatarUrl'] as String?,
  timezone: json['timezone'] as String? ?? 'Asia/Kolkata',
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$UserProfileToJson(_UserProfile instance) =>
    <String, dynamic>{
      'id': instance.id,
      'logtoId': instance.logtoId,
      'email': instance.email,
      'name': instance.name,
      'avatarUrl': instance.avatarUrl,
      'timezone': instance.timezone,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
