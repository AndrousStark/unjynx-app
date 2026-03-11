/// Immutable async standup entry.
class StandupEntry {
  const StandupEntry({
    required this.id,
    required this.userId,
    required this.name,
    required this.submittedAt,
    this.doneYesterday = const [],
    this.plannedToday = const [],
    this.blockers = const [],
  });

  final String id;
  final String userId;
  final String name;
  final List<String> doneYesterday;
  final List<String> plannedToday;
  final List<String> blockers;
  final DateTime submittedAt;

  bool get hasBlockers => blockers.isNotEmpty;

  StandupEntry copyWith({
    String? id,
    String? userId,
    String? name,
    List<String>? doneYesterday,
    List<String>? plannedToday,
    List<String>? blockers,
    DateTime? submittedAt,
  }) {
    return StandupEntry(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      doneYesterday: doneYesterday ?? this.doneYesterday,
      plannedToday: plannedToday ?? this.plannedToday,
      blockers: blockers ?? this.blockers,
      submittedAt: submittedAt ?? this.submittedAt,
    );
  }

  factory StandupEntry.fromJson(Map<String, dynamic> json) {
    return StandupEntry(
      id: json['id'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      doneYesterday: (json['doneYesterday'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      plannedToday: (json['plannedToday'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      blockers: (json['blockers'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      submittedAt: DateTime.parse(json['submittedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'name': name,
        'doneYesterday': doneYesterday,
        'plannedToday': plannedToday,
        'blockers': blockers,
        'submittedAt': submittedAt.toIso8601String(),
      };
}
