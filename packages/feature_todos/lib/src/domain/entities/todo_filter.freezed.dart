// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'todo_filter.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$TodoFilter {

 TodoStatus? get status; TodoPriority? get priority; String? get projectId; String? get searchQuery; DateRange? get dateRange; TodoSortBy get sortBy; bool get ascending;
/// Create a copy of TodoFilter
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TodoFilterCopyWith<TodoFilter> get copyWith => _$TodoFilterCopyWithImpl<TodoFilter>(this as TodoFilter, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TodoFilter&&(identical(other.status, status) || other.status == status)&&(identical(other.priority, priority) || other.priority == priority)&&(identical(other.projectId, projectId) || other.projectId == projectId)&&(identical(other.searchQuery, searchQuery) || other.searchQuery == searchQuery)&&(identical(other.dateRange, dateRange) || other.dateRange == dateRange)&&(identical(other.sortBy, sortBy) || other.sortBy == sortBy)&&(identical(other.ascending, ascending) || other.ascending == ascending));
}


@override
int get hashCode => Object.hash(runtimeType,status,priority,projectId,searchQuery,dateRange,sortBy,ascending);

@override
String toString() {
  return 'TodoFilter(status: $status, priority: $priority, projectId: $projectId, searchQuery: $searchQuery, dateRange: $dateRange, sortBy: $sortBy, ascending: $ascending)';
}


}

/// @nodoc
abstract mixin class $TodoFilterCopyWith<$Res>  {
  factory $TodoFilterCopyWith(TodoFilter value, $Res Function(TodoFilter) _then) = _$TodoFilterCopyWithImpl;
@useResult
$Res call({
 TodoStatus? status, TodoPriority? priority, String? projectId, String? searchQuery, DateRange? dateRange, TodoSortBy sortBy, bool ascending
});




}
/// @nodoc
class _$TodoFilterCopyWithImpl<$Res>
    implements $TodoFilterCopyWith<$Res> {
  _$TodoFilterCopyWithImpl(this._self, this._then);

  final TodoFilter _self;
  final $Res Function(TodoFilter) _then;

/// Create a copy of TodoFilter
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? status = freezed,Object? priority = freezed,Object? projectId = freezed,Object? searchQuery = freezed,Object? dateRange = freezed,Object? sortBy = null,Object? ascending = null,}) {
  return _then(_self.copyWith(
status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as TodoStatus?,priority: freezed == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as TodoPriority?,projectId: freezed == projectId ? _self.projectId : projectId // ignore: cast_nullable_to_non_nullable
as String?,searchQuery: freezed == searchQuery ? _self.searchQuery : searchQuery // ignore: cast_nullable_to_non_nullable
as String?,dateRange: freezed == dateRange ? _self.dateRange : dateRange // ignore: cast_nullable_to_non_nullable
as DateRange?,sortBy: null == sortBy ? _self.sortBy : sortBy // ignore: cast_nullable_to_non_nullable
as TodoSortBy,ascending: null == ascending ? _self.ascending : ascending // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [TodoFilter].
extension TodoFilterPatterns on TodoFilter {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TodoFilter value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TodoFilter() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TodoFilter value)  $default,){
final _that = this;
switch (_that) {
case _TodoFilter():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TodoFilter value)?  $default,){
final _that = this;
switch (_that) {
case _TodoFilter() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( TodoStatus? status,  TodoPriority? priority,  String? projectId,  String? searchQuery,  DateRange? dateRange,  TodoSortBy sortBy,  bool ascending)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TodoFilter() when $default != null:
return $default(_that.status,_that.priority,_that.projectId,_that.searchQuery,_that.dateRange,_that.sortBy,_that.ascending);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( TodoStatus? status,  TodoPriority? priority,  String? projectId,  String? searchQuery,  DateRange? dateRange,  TodoSortBy sortBy,  bool ascending)  $default,) {final _that = this;
switch (_that) {
case _TodoFilter():
return $default(_that.status,_that.priority,_that.projectId,_that.searchQuery,_that.dateRange,_that.sortBy,_that.ascending);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( TodoStatus? status,  TodoPriority? priority,  String? projectId,  String? searchQuery,  DateRange? dateRange,  TodoSortBy sortBy,  bool ascending)?  $default,) {final _that = this;
switch (_that) {
case _TodoFilter() when $default != null:
return $default(_that.status,_that.priority,_that.projectId,_that.searchQuery,_that.dateRange,_that.sortBy,_that.ascending);case _:
  return null;

}
}

}

/// @nodoc


class _TodoFilter implements TodoFilter {
  const _TodoFilter({this.status, this.priority, this.projectId, this.searchQuery, this.dateRange, this.sortBy = TodoSortBy.createdAt, this.ascending = false});
  

@override final  TodoStatus? status;
@override final  TodoPriority? priority;
@override final  String? projectId;
@override final  String? searchQuery;
@override final  DateRange? dateRange;
@override@JsonKey() final  TodoSortBy sortBy;
@override@JsonKey() final  bool ascending;

/// Create a copy of TodoFilter
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TodoFilterCopyWith<_TodoFilter> get copyWith => __$TodoFilterCopyWithImpl<_TodoFilter>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _TodoFilter&&(identical(other.status, status) || other.status == status)&&(identical(other.priority, priority) || other.priority == priority)&&(identical(other.projectId, projectId) || other.projectId == projectId)&&(identical(other.searchQuery, searchQuery) || other.searchQuery == searchQuery)&&(identical(other.dateRange, dateRange) || other.dateRange == dateRange)&&(identical(other.sortBy, sortBy) || other.sortBy == sortBy)&&(identical(other.ascending, ascending) || other.ascending == ascending));
}


@override
int get hashCode => Object.hash(runtimeType,status,priority,projectId,searchQuery,dateRange,sortBy,ascending);

@override
String toString() {
  return 'TodoFilter(status: $status, priority: $priority, projectId: $projectId, searchQuery: $searchQuery, dateRange: $dateRange, sortBy: $sortBy, ascending: $ascending)';
}


}

/// @nodoc
abstract mixin class _$TodoFilterCopyWith<$Res> implements $TodoFilterCopyWith<$Res> {
  factory _$TodoFilterCopyWith(_TodoFilter value, $Res Function(_TodoFilter) _then) = __$TodoFilterCopyWithImpl;
@override @useResult
$Res call({
 TodoStatus? status, TodoPriority? priority, String? projectId, String? searchQuery, DateRange? dateRange, TodoSortBy sortBy, bool ascending
});




}
/// @nodoc
class __$TodoFilterCopyWithImpl<$Res>
    implements _$TodoFilterCopyWith<$Res> {
  __$TodoFilterCopyWithImpl(this._self, this._then);

  final _TodoFilter _self;
  final $Res Function(_TodoFilter) _then;

/// Create a copy of TodoFilter
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? status = freezed,Object? priority = freezed,Object? projectId = freezed,Object? searchQuery = freezed,Object? dateRange = freezed,Object? sortBy = null,Object? ascending = null,}) {
  return _then(_TodoFilter(
status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as TodoStatus?,priority: freezed == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as TodoPriority?,projectId: freezed == projectId ? _self.projectId : projectId // ignore: cast_nullable_to_non_nullable
as String?,searchQuery: freezed == searchQuery ? _self.searchQuery : searchQuery // ignore: cast_nullable_to_non_nullable
as String?,dateRange: freezed == dateRange ? _self.dateRange : dateRange // ignore: cast_nullable_to_non_nullable
as DateRange?,sortBy: null == sortBy ? _self.sortBy : sortBy // ignore: cast_nullable_to_non_nullable
as TodoSortBy,ascending: null == ascending ? _self.ascending : ascending // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
