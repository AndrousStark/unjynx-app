/// Sprint status matching backend enum.
enum SprintStatus {
  planning,
  active,
  completed,
  cancelled;

  static SprintStatus fromString(String value) {
    return SprintStatus.values.firstWhere(
      (s) => s.name == value,
      orElse: () => SprintStatus.planning,
    );
  }
}

/// Immutable sprint entity matching backend `sprints` table.
class Sprint {
  const Sprint({
    required this.id,
    required this.projectId,
    required this.name,
    required this.status,
    required this.createdAt,
    this.goal,
    this.startDate,
    this.endDate,
    this.committedPoints = 0,
    this.completedPoints = 0,
    this.retroWentWell,
    this.retroToImprove,
    this.retroActionItems = const [],
  });

  final String id;
  final String projectId;
  final String name;
  final String? goal;
  final SprintStatus status;
  final DateTime? startDate;
  final DateTime? endDate;
  final int committedPoints;
  final int completedPoints;
  final String? retroWentWell;
  final String? retroToImprove;
  final List<String> retroActionItems;
  final DateTime createdAt;

  double get completionRate =>
      committedPoints > 0 ? completedPoints / committedPoints : 0;

  bool get hasRetro =>
      retroWentWell != null ||
      retroToImprove != null ||
      retroActionItems.isNotEmpty;

  Sprint copyWith({
    String? id,
    String? projectId,
    String? name,
    String? goal,
    SprintStatus? status,
    DateTime? startDate,
    DateTime? endDate,
    int? committedPoints,
    int? completedPoints,
    String? retroWentWell,
    String? retroToImprove,
    List<String>? retroActionItems,
    DateTime? createdAt,
  }) {
    return Sprint(
      id: id ?? this.id,
      projectId: projectId ?? this.projectId,
      name: name ?? this.name,
      goal: goal ?? this.goal,
      status: status ?? this.status,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      committedPoints: committedPoints ?? this.committedPoints,
      completedPoints: completedPoints ?? this.completedPoints,
      retroWentWell: retroWentWell ?? this.retroWentWell,
      retroToImprove: retroToImprove ?? this.retroToImprove,
      retroActionItems: retroActionItems ?? this.retroActionItems,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory Sprint.fromJson(Map<String, dynamic> json) {
    return Sprint(
      id: json['id'] as String,
      projectId: json['projectId'] as String,
      name: json['name'] as String,
      goal: json['goal'] as String?,
      status: SprintStatus.fromString(json['status'] as String? ?? 'planning'),
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'] as String)
          : null,
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'] as String)
          : null,
      committedPoints: (json['committedPoints'] as num?)?.toInt() ?? 0,
      completedPoints: (json['completedPoints'] as num?)?.toInt() ?? 0,
      retroWentWell: json['retroWentWell'] as String?,
      retroToImprove: json['retroToImprove'] as String?,
      retroActionItems:
          (json['retroActionItems'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'projectId': projectId,
    'name': name,
    'goal': goal,
    'status': status.name,
    'startDate': startDate?.toIso8601String(),
    'endDate': endDate?.toIso8601String(),
    'committedPoints': committedPoints,
    'completedPoints': completedPoints,
    'retroWentWell': retroWentWell,
    'retroToImprove': retroToImprove,
    'retroActionItems': retroActionItems,
    'createdAt': createdAt.toIso8601String(),
  };
}

/// A single burndown chart data point.
class BurndownEntry {
  const BurndownEntry({
    required this.capturedAt,
    required this.totalPoints,
    required this.completedPoints,
    required this.remainingPoints,
    this.addedPoints = 0,
    this.removedPoints = 0,
  });

  final DateTime capturedAt;
  final int totalPoints;
  final int completedPoints;
  final int remainingPoints;
  final int addedPoints;
  final int removedPoints;

  factory BurndownEntry.fromJson(Map<String, dynamic> json) {
    return BurndownEntry(
      capturedAt: DateTime.parse(json['capturedAt'] as String),
      totalPoints: (json['totalPoints'] as num?)?.toInt() ?? 0,
      completedPoints: (json['completedPoints'] as num?)?.toInt() ?? 0,
      remainingPoints: (json['remainingPoints'] as num?)?.toInt() ?? 0,
      addedPoints: (json['addedPoints'] as num?)?.toInt() ?? 0,
      removedPoints: (json['removedPoints'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'capturedAt': capturedAt.toIso8601String(),
    'totalPoints': totalPoints,
    'completedPoints': completedPoints,
    'remainingPoints': remainingPoints,
    'addedPoints': addedPoints,
    'removedPoints': removedPoints,
  };
}

/// A velocity chart entry for one sprint.
class VelocityEntry {
  const VelocityEntry({
    required this.name,
    required this.committed,
    required this.completed,
    this.startDate,
    this.endDate,
  });

  final String name;
  final int committed;
  final int completed;
  final DateTime? startDate;
  final DateTime? endDate;

  factory VelocityEntry.fromJson(Map<String, dynamic> json) {
    return VelocityEntry(
      name: json['name'] as String,
      committed: (json['committed'] as num?)?.toInt() ?? 0,
      completed: (json['completed'] as num?)?.toInt() ?? 0,
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'] as String)
          : null,
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'committed': committed,
    'completed': completed,
    'startDate': startDate?.toIso8601String(),
    'endDate': endDate?.toIso8601String(),
  };
}
