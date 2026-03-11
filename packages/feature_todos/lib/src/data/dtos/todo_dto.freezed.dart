// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'todo_dto.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$TodoDto {

 String get id; String get title; String get description; String get status; String get priority;@JsonKey(name: 'project_id') String? get projectId;@JsonKey(name: 'due_date') String? get dueDate;@JsonKey(name: 'completed_at') String? get completedAt; String? get rrule;@JsonKey(name: 'sort_order') int get sortOrder;@JsonKey(name: 'created_at') String get createdAt;@JsonKey(name: 'updated_at') String get updatedAt;
/// Create a copy of TodoDto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TodoDtoCopyWith<TodoDto> get copyWith => _$TodoDtoCopyWithImpl<TodoDto>(this as TodoDto, _$identity);

  /// Serializes this TodoDto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TodoDto&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.status, status) || other.status == status)&&(identical(other.priority, priority) || other.priority == priority)&&(identical(other.projectId, projectId) || other.projectId == projectId)&&(identical(other.dueDate, dueDate) || other.dueDate == dueDate)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt)&&(identical(other.rrule, rrule) || other.rrule == rrule)&&(identical(other.sortOrder, sortOrder) || other.sortOrder == sortOrder)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,description,status,priority,projectId,dueDate,completedAt,rrule,sortOrder,createdAt,updatedAt);

@override
String toString() {
  return 'TodoDto(id: $id, title: $title, description: $description, status: $status, priority: $priority, projectId: $projectId, dueDate: $dueDate, completedAt: $completedAt, rrule: $rrule, sortOrder: $sortOrder, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $TodoDtoCopyWith<$Res>  {
  factory $TodoDtoCopyWith(TodoDto value, $Res Function(TodoDto) _then) = _$TodoDtoCopyWithImpl;
@useResult
$Res call({
 String id, String title, String description, String status, String priority,@JsonKey(name: 'project_id') String? projectId,@JsonKey(name: 'due_date') String? dueDate,@JsonKey(name: 'completed_at') String? completedAt, String? rrule,@JsonKey(name: 'sort_order') int sortOrder,@JsonKey(name: 'created_at') String createdAt,@JsonKey(name: 'updated_at') String updatedAt
});




}
/// @nodoc
class _$TodoDtoCopyWithImpl<$Res>
    implements $TodoDtoCopyWith<$Res> {
  _$TodoDtoCopyWithImpl(this._self, this._then);

  final TodoDto _self;
  final $Res Function(TodoDto) _then;

/// Create a copy of TodoDto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? description = null,Object? status = null,Object? priority = null,Object? projectId = freezed,Object? dueDate = freezed,Object? completedAt = freezed,Object? rrule = freezed,Object? sortOrder = null,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as String,projectId: freezed == projectId ? _self.projectId : projectId // ignore: cast_nullable_to_non_nullable
as String?,dueDate: freezed == dueDate ? _self.dueDate : dueDate // ignore: cast_nullable_to_non_nullable
as String?,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as String?,rrule: freezed == rrule ? _self.rrule : rrule // ignore: cast_nullable_to_non_nullable
as String?,sortOrder: null == sortOrder ? _self.sortOrder : sortOrder // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [TodoDto].
extension TodoDtoPatterns on TodoDto {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TodoDto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TodoDto() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TodoDto value)  $default,){
final _that = this;
switch (_that) {
case _TodoDto():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TodoDto value)?  $default,){
final _that = this;
switch (_that) {
case _TodoDto() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String title,  String description,  String status,  String priority, @JsonKey(name: 'project_id')  String? projectId, @JsonKey(name: 'due_date')  String? dueDate, @JsonKey(name: 'completed_at')  String? completedAt,  String? rrule, @JsonKey(name: 'sort_order')  int sortOrder, @JsonKey(name: 'created_at')  String createdAt, @JsonKey(name: 'updated_at')  String updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TodoDto() when $default != null:
return $default(_that.id,_that.title,_that.description,_that.status,_that.priority,_that.projectId,_that.dueDate,_that.completedAt,_that.rrule,_that.sortOrder,_that.createdAt,_that.updatedAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String title,  String description,  String status,  String priority, @JsonKey(name: 'project_id')  String? projectId, @JsonKey(name: 'due_date')  String? dueDate, @JsonKey(name: 'completed_at')  String? completedAt,  String? rrule, @JsonKey(name: 'sort_order')  int sortOrder, @JsonKey(name: 'created_at')  String createdAt, @JsonKey(name: 'updated_at')  String updatedAt)  $default,) {final _that = this;
switch (_that) {
case _TodoDto():
return $default(_that.id,_that.title,_that.description,_that.status,_that.priority,_that.projectId,_that.dueDate,_that.completedAt,_that.rrule,_that.sortOrder,_that.createdAt,_that.updatedAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String title,  String description,  String status,  String priority, @JsonKey(name: 'project_id')  String? projectId, @JsonKey(name: 'due_date')  String? dueDate, @JsonKey(name: 'completed_at')  String? completedAt,  String? rrule, @JsonKey(name: 'sort_order')  int sortOrder, @JsonKey(name: 'created_at')  String createdAt, @JsonKey(name: 'updated_at')  String updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _TodoDto() when $default != null:
return $default(_that.id,_that.title,_that.description,_that.status,_that.priority,_that.projectId,_that.dueDate,_that.completedAt,_that.rrule,_that.sortOrder,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TodoDto implements TodoDto {
  const _TodoDto({required this.id, required this.title, this.description = '', this.status = 'pending', this.priority = 'none', @JsonKey(name: 'project_id') this.projectId, @JsonKey(name: 'due_date') this.dueDate, @JsonKey(name: 'completed_at') this.completedAt, this.rrule, @JsonKey(name: 'sort_order') this.sortOrder = 0, @JsonKey(name: 'created_at') required this.createdAt, @JsonKey(name: 'updated_at') required this.updatedAt});
  factory _TodoDto.fromJson(Map<String, dynamic> json) => _$TodoDtoFromJson(json);

@override final  String id;
@override final  String title;
@override@JsonKey() final  String description;
@override@JsonKey() final  String status;
@override@JsonKey() final  String priority;
@override@JsonKey(name: 'project_id') final  String? projectId;
@override@JsonKey(name: 'due_date') final  String? dueDate;
@override@JsonKey(name: 'completed_at') final  String? completedAt;
@override final  String? rrule;
@override@JsonKey(name: 'sort_order') final  int sortOrder;
@override@JsonKey(name: 'created_at') final  String createdAt;
@override@JsonKey(name: 'updated_at') final  String updatedAt;

/// Create a copy of TodoDto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TodoDtoCopyWith<_TodoDto> get copyWith => __$TodoDtoCopyWithImpl<_TodoDto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TodoDtoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _TodoDto&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.status, status) || other.status == status)&&(identical(other.priority, priority) || other.priority == priority)&&(identical(other.projectId, projectId) || other.projectId == projectId)&&(identical(other.dueDate, dueDate) || other.dueDate == dueDate)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt)&&(identical(other.rrule, rrule) || other.rrule == rrule)&&(identical(other.sortOrder, sortOrder) || other.sortOrder == sortOrder)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,description,status,priority,projectId,dueDate,completedAt,rrule,sortOrder,createdAt,updatedAt);

@override
String toString() {
  return 'TodoDto(id: $id, title: $title, description: $description, status: $status, priority: $priority, projectId: $projectId, dueDate: $dueDate, completedAt: $completedAt, rrule: $rrule, sortOrder: $sortOrder, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$TodoDtoCopyWith<$Res> implements $TodoDtoCopyWith<$Res> {
  factory _$TodoDtoCopyWith(_TodoDto value, $Res Function(_TodoDto) _then) = __$TodoDtoCopyWithImpl;
@override @useResult
$Res call({
 String id, String title, String description, String status, String priority,@JsonKey(name: 'project_id') String? projectId,@JsonKey(name: 'due_date') String? dueDate,@JsonKey(name: 'completed_at') String? completedAt, String? rrule,@JsonKey(name: 'sort_order') int sortOrder,@JsonKey(name: 'created_at') String createdAt,@JsonKey(name: 'updated_at') String updatedAt
});




}
/// @nodoc
class __$TodoDtoCopyWithImpl<$Res>
    implements _$TodoDtoCopyWith<$Res> {
  __$TodoDtoCopyWithImpl(this._self, this._then);

  final _TodoDto _self;
  final $Res Function(_TodoDto) _then;

/// Create a copy of TodoDto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? description = null,Object? status = null,Object? priority = null,Object? projectId = freezed,Object? dueDate = freezed,Object? completedAt = freezed,Object? rrule = freezed,Object? sortOrder = null,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_TodoDto(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as String,projectId: freezed == projectId ? _self.projectId : projectId // ignore: cast_nullable_to_non_nullable
as String?,dueDate: freezed == dueDate ? _self.dueDate : dueDate // ignore: cast_nullable_to_non_nullable
as String?,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as String?,rrule: freezed == rrule ? _self.rrule : rrule // ignore: cast_nullable_to_non_nullable
as String?,sortOrder: null == sortOrder ? _self.sortOrder : sortOrder // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
