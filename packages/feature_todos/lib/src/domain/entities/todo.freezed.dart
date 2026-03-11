// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'todo.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Todo {

 String get id; String get title; String get description; TodoStatus get status; TodoPriority get priority; String? get projectId; DateTime? get dueDate; DateTime? get completedAt; String? get rrule; int get sortOrder; DateTime get createdAt; DateTime get updatedAt;
/// Create a copy of Todo
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TodoCopyWith<Todo> get copyWith => _$TodoCopyWithImpl<Todo>(this as Todo, _$identity);

  /// Serializes this Todo to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Todo&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.status, status) || other.status == status)&&(identical(other.priority, priority) || other.priority == priority)&&(identical(other.projectId, projectId) || other.projectId == projectId)&&(identical(other.dueDate, dueDate) || other.dueDate == dueDate)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt)&&(identical(other.rrule, rrule) || other.rrule == rrule)&&(identical(other.sortOrder, sortOrder) || other.sortOrder == sortOrder)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,description,status,priority,projectId,dueDate,completedAt,rrule,sortOrder,createdAt,updatedAt);

@override
String toString() {
  return 'Todo(id: $id, title: $title, description: $description, status: $status, priority: $priority, projectId: $projectId, dueDate: $dueDate, completedAt: $completedAt, rrule: $rrule, sortOrder: $sortOrder, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $TodoCopyWith<$Res>  {
  factory $TodoCopyWith(Todo value, $Res Function(Todo) _then) = _$TodoCopyWithImpl;
@useResult
$Res call({
 String id, String title, String description, TodoStatus status, TodoPriority priority, String? projectId, DateTime? dueDate, DateTime? completedAt, String? rrule, int sortOrder, DateTime createdAt, DateTime updatedAt
});




}
/// @nodoc
class _$TodoCopyWithImpl<$Res>
    implements $TodoCopyWith<$Res> {
  _$TodoCopyWithImpl(this._self, this._then);

  final Todo _self;
  final $Res Function(Todo) _then;

/// Create a copy of Todo
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? description = null,Object? status = null,Object? priority = null,Object? projectId = freezed,Object? dueDate = freezed,Object? completedAt = freezed,Object? rrule = freezed,Object? sortOrder = null,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as TodoStatus,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as TodoPriority,projectId: freezed == projectId ? _self.projectId : projectId // ignore: cast_nullable_to_non_nullable
as String?,dueDate: freezed == dueDate ? _self.dueDate : dueDate // ignore: cast_nullable_to_non_nullable
as DateTime?,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,rrule: freezed == rrule ? _self.rrule : rrule // ignore: cast_nullable_to_non_nullable
as String?,sortOrder: null == sortOrder ? _self.sortOrder : sortOrder // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [Todo].
extension TodoPatterns on Todo {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Todo value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Todo() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Todo value)  $default,){
final _that = this;
switch (_that) {
case _Todo():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Todo value)?  $default,){
final _that = this;
switch (_that) {
case _Todo() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String title,  String description,  TodoStatus status,  TodoPriority priority,  String? projectId,  DateTime? dueDate,  DateTime? completedAt,  String? rrule,  int sortOrder,  DateTime createdAt,  DateTime updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Todo() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String title,  String description,  TodoStatus status,  TodoPriority priority,  String? projectId,  DateTime? dueDate,  DateTime? completedAt,  String? rrule,  int sortOrder,  DateTime createdAt,  DateTime updatedAt)  $default,) {final _that = this;
switch (_that) {
case _Todo():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String title,  String description,  TodoStatus status,  TodoPriority priority,  String? projectId,  DateTime? dueDate,  DateTime? completedAt,  String? rrule,  int sortOrder,  DateTime createdAt,  DateTime updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _Todo() when $default != null:
return $default(_that.id,_that.title,_that.description,_that.status,_that.priority,_that.projectId,_that.dueDate,_that.completedAt,_that.rrule,_that.sortOrder,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Todo implements Todo {
  const _Todo({required this.id, required this.title, this.description = '', this.status = TodoStatus.pending, this.priority = TodoPriority.none, this.projectId, this.dueDate, this.completedAt, this.rrule, this.sortOrder = 0, required this.createdAt, required this.updatedAt});
  factory _Todo.fromJson(Map<String, dynamic> json) => _$TodoFromJson(json);

@override final  String id;
@override final  String title;
@override@JsonKey() final  String description;
@override@JsonKey() final  TodoStatus status;
@override@JsonKey() final  TodoPriority priority;
@override final  String? projectId;
@override final  DateTime? dueDate;
@override final  DateTime? completedAt;
@override final  String? rrule;
@override@JsonKey() final  int sortOrder;
@override final  DateTime createdAt;
@override final  DateTime updatedAt;

/// Create a copy of Todo
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TodoCopyWith<_Todo> get copyWith => __$TodoCopyWithImpl<_Todo>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TodoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Todo&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.status, status) || other.status == status)&&(identical(other.priority, priority) || other.priority == priority)&&(identical(other.projectId, projectId) || other.projectId == projectId)&&(identical(other.dueDate, dueDate) || other.dueDate == dueDate)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt)&&(identical(other.rrule, rrule) || other.rrule == rrule)&&(identical(other.sortOrder, sortOrder) || other.sortOrder == sortOrder)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,description,status,priority,projectId,dueDate,completedAt,rrule,sortOrder,createdAt,updatedAt);

@override
String toString() {
  return 'Todo(id: $id, title: $title, description: $description, status: $status, priority: $priority, projectId: $projectId, dueDate: $dueDate, completedAt: $completedAt, rrule: $rrule, sortOrder: $sortOrder, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$TodoCopyWith<$Res> implements $TodoCopyWith<$Res> {
  factory _$TodoCopyWith(_Todo value, $Res Function(_Todo) _then) = __$TodoCopyWithImpl;
@override @useResult
$Res call({
 String id, String title, String description, TodoStatus status, TodoPriority priority, String? projectId, DateTime? dueDate, DateTime? completedAt, String? rrule, int sortOrder, DateTime createdAt, DateTime updatedAt
});




}
/// @nodoc
class __$TodoCopyWithImpl<$Res>
    implements _$TodoCopyWith<$Res> {
  __$TodoCopyWithImpl(this._self, this._then);

  final _Todo _self;
  final $Res Function(_Todo) _then;

/// Create a copy of Todo
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? description = null,Object? status = null,Object? priority = null,Object? projectId = freezed,Object? dueDate = freezed,Object? completedAt = freezed,Object? rrule = freezed,Object? sortOrder = null,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_Todo(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as TodoStatus,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as TodoPriority,projectId: freezed == projectId ? _self.projectId : projectId // ignore: cast_nullable_to_non_nullable
as String?,dueDate: freezed == dueDate ? _self.dueDate : dueDate // ignore: cast_nullable_to_non_nullable
as DateTime?,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,rrule: freezed == rrule ? _self.rrule : rrule // ignore: cast_nullable_to_non_nullable
as String?,sortOrder: null == sortOrder ? _self.sortOrder : sortOrder // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}

// dart format on
