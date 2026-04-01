/// Goal hierarchy level.
enum GoalLevel {
  company,
  team,
  individual;

  static GoalLevel fromString(String value) {
    return GoalLevel.values.firstWhere(
      (l) => l.name == value,
      orElse: () => GoalLevel.individual,
    );
  }
}

/// Goal health status.
enum GoalStatus {
  onTrack,
  atRisk,
  behind,
  completed,
  cancelled;

  static GoalStatus fromString(String value) {
    switch (value) {
      case 'on_track':
        return GoalStatus.onTrack;
      case 'at_risk':
        return GoalStatus.atRisk;
      case 'behind':
        return GoalStatus.behind;
      case 'completed':
        return GoalStatus.completed;
      case 'cancelled':
        return GoalStatus.cancelled;
      default:
        return GoalStatus.onTrack;
    }
  }

  String get apiValue {
    switch (this) {
      case GoalStatus.onTrack:
        return 'on_track';
      case GoalStatus.atRisk:
        return 'at_risk';
      case GoalStatus.behind:
        return 'behind';
      case GoalStatus.completed:
        return 'completed';
      case GoalStatus.cancelled:
        return 'cancelled';
    }
  }

  String get label {
    switch (this) {
      case GoalStatus.onTrack:
        return 'On Track';
      case GoalStatus.atRisk:
        return 'At Risk';
      case GoalStatus.behind:
        return 'Behind';
      case GoalStatus.completed:
        return 'Completed';
      case GoalStatus.cancelled:
        return 'Cancelled';
    }
  }
}

/// Immutable goal entity matching backend `goals` table.
class Goal {
  const Goal({
    required this.id,
    required this.title,
    required this.level,
    required this.status,
    required this.createdAt,
    this.description,
    this.parentId,
    this.ownerId,
    this.ownerName,
    this.targetValue = 100,
    this.currentValue = 0,
    this.unit = '%',
    this.dueDate,
    this.completedAt,
    this.children = const [],
  });

  final String id;
  final String title;
  final String? description;
  final String? parentId;
  final String? ownerId;
  final String? ownerName;
  final double targetValue;
  final double currentValue;
  final String unit;
  final GoalLevel level;
  final GoalStatus status;
  final DateTime? dueDate;
  final DateTime? completedAt;
  final DateTime createdAt;

  /// Children goals (populated by tree endpoint).
  final List<Goal> children;

  /// Progress as 0.0–1.0 ratio.
  double get progress =>
      targetValue > 0 ? (currentValue / targetValue).clamp(0, 1) : 0;

  /// Progress as percentage string.
  String get progressLabel => '${(progress * 100).toStringAsFixed(0)}%';

  Goal copyWith({
    String? id,
    String? title,
    String? description,
    String? parentId,
    String? ownerId,
    String? ownerName,
    double? targetValue,
    double? currentValue,
    String? unit,
    GoalLevel? level,
    GoalStatus? status,
    DateTime? dueDate,
    DateTime? completedAt,
    DateTime? createdAt,
    List<Goal>? children,
  }) {
    return Goal(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      parentId: parentId ?? this.parentId,
      ownerId: ownerId ?? this.ownerId,
      ownerName: ownerName ?? this.ownerName,
      targetValue: targetValue ?? this.targetValue,
      currentValue: currentValue ?? this.currentValue,
      unit: unit ?? this.unit,
      level: level ?? this.level,
      status: status ?? this.status,
      dueDate: dueDate ?? this.dueDate,
      completedAt: completedAt ?? this.completedAt,
      createdAt: createdAt ?? this.createdAt,
      children: children ?? this.children,
    );
  }

  factory Goal.fromJson(Map<String, dynamic> json) {
    return Goal(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      parentId: json['parentId'] as String?,
      ownerId: json['ownerId'] as String?,
      ownerName: json['ownerName'] as String?,
      targetValue: (json['targetValue'] as num?)?.toDouble() ?? 100,
      currentValue: (json['currentValue'] as num?)?.toDouble() ?? 0,
      unit: json['unit'] as String? ?? '%',
      level: GoalLevel.fromString(json['level'] as String? ?? 'individual'),
      status: GoalStatus.fromString(json['status'] as String? ?? 'on_track'),
      dueDate: json['dueDate'] != null
          ? DateTime.tryParse(json['dueDate'] as String)
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.tryParse(json['completedAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      children:
          (json['children'] as List<dynamic>?)
              ?.map((e) => Goal.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'parentId': parentId,
    'ownerId': ownerId,
    'targetValue': targetValue,
    'currentValue': currentValue,
    'unit': unit,
    'level': level.name,
    'status': status.apiValue,
    'dueDate': dueDate?.toIso8601String(),
    'completedAt': completedAt?.toIso8601String(),
    'createdAt': createdAt.toIso8601String(),
  };
}
