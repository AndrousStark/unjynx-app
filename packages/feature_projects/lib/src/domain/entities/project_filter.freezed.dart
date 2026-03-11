// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'project_filter.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProjectFilter {

 bool get includeArchived; String? get searchQuery;
/// Create a copy of ProjectFilter
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProjectFilterCopyWith<ProjectFilter> get copyWith => _$ProjectFilterCopyWithImpl<ProjectFilter>(this as ProjectFilter, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProjectFilter&&(identical(other.includeArchived, includeArchived) || other.includeArchived == includeArchived)&&(identical(other.searchQuery, searchQuery) || other.searchQuery == searchQuery));
}


@override
int get hashCode => Object.hash(runtimeType,includeArchived,searchQuery);

@override
String toString() {
  return 'ProjectFilter(includeArchived: $includeArchived, searchQuery: $searchQuery)';
}


}

/// @nodoc
abstract mixin class $ProjectFilterCopyWith<$Res>  {
  factory $ProjectFilterCopyWith(ProjectFilter value, $Res Function(ProjectFilter) _then) = _$ProjectFilterCopyWithImpl;
@useResult
$Res call({
 bool includeArchived, String? searchQuery
});




}
/// @nodoc
class _$ProjectFilterCopyWithImpl<$Res>
    implements $ProjectFilterCopyWith<$Res> {
  _$ProjectFilterCopyWithImpl(this._self, this._then);

  final ProjectFilter _self;
  final $Res Function(ProjectFilter) _then;

/// Create a copy of ProjectFilter
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? includeArchived = null,Object? searchQuery = freezed,}) {
  return _then(_self.copyWith(
includeArchived: null == includeArchived ? _self.includeArchived : includeArchived // ignore: cast_nullable_to_non_nullable
as bool,searchQuery: freezed == searchQuery ? _self.searchQuery : searchQuery // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ProjectFilter].
extension ProjectFilterPatterns on ProjectFilter {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProjectFilter value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProjectFilter() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProjectFilter value)  $default,){
final _that = this;
switch (_that) {
case _ProjectFilter():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProjectFilter value)?  $default,){
final _that = this;
switch (_that) {
case _ProjectFilter() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool includeArchived,  String? searchQuery)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProjectFilter() when $default != null:
return $default(_that.includeArchived,_that.searchQuery);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool includeArchived,  String? searchQuery)  $default,) {final _that = this;
switch (_that) {
case _ProjectFilter():
return $default(_that.includeArchived,_that.searchQuery);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool includeArchived,  String? searchQuery)?  $default,) {final _that = this;
switch (_that) {
case _ProjectFilter() when $default != null:
return $default(_that.includeArchived,_that.searchQuery);case _:
  return null;

}
}

}

/// @nodoc


class _ProjectFilter implements ProjectFilter {
  const _ProjectFilter({this.includeArchived = false, this.searchQuery});
  

@override@JsonKey() final  bool includeArchived;
@override final  String? searchQuery;

/// Create a copy of ProjectFilter
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProjectFilterCopyWith<_ProjectFilter> get copyWith => __$ProjectFilterCopyWithImpl<_ProjectFilter>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProjectFilter&&(identical(other.includeArchived, includeArchived) || other.includeArchived == includeArchived)&&(identical(other.searchQuery, searchQuery) || other.searchQuery == searchQuery));
}


@override
int get hashCode => Object.hash(runtimeType,includeArchived,searchQuery);

@override
String toString() {
  return 'ProjectFilter(includeArchived: $includeArchived, searchQuery: $searchQuery)';
}


}

/// @nodoc
abstract mixin class _$ProjectFilterCopyWith<$Res> implements $ProjectFilterCopyWith<$Res> {
  factory _$ProjectFilterCopyWith(_ProjectFilter value, $Res Function(_ProjectFilter) _then) = __$ProjectFilterCopyWithImpl;
@override @useResult
$Res call({
 bool includeArchived, String? searchQuery
});




}
/// @nodoc
class __$ProjectFilterCopyWithImpl<$Res>
    implements _$ProjectFilterCopyWith<$Res> {
  __$ProjectFilterCopyWithImpl(this._self, this._then);

  final _ProjectFilter _self;
  final $Res Function(_ProjectFilter) _then;

/// Create a copy of ProjectFilter
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? includeArchived = null,Object? searchQuery = freezed,}) {
  return _then(_ProjectFilter(
includeArchived: null == includeArchived ? _self.includeArchived : includeArchived // ignore: cast_nullable_to_non_nullable
as bool,searchQuery: freezed == searchQuery ? _self.searchQuery : searchQuery // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
