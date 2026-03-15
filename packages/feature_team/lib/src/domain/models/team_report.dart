/// Immutable team report entity for a given period.
class TeamReport {
  const TeamReport({
    required this.period,
    required this.completionRate,
    required this.overdueCount,
    this.memberStats = const [],
    this.projectStats = const [],
  });

  /// One of: week, month, quarter.
  final ReportPeriod period;
  final double completionRate;
  final int overdueCount;
  final List<MemberStat> memberStats;
  final List<ProjectStat> projectStats;

  TeamReport copyWith({
    ReportPeriod? period,
    double? completionRate,
    int? overdueCount,
    List<MemberStat>? memberStats,
    List<ProjectStat>? projectStats,
  }) {
    return TeamReport(
      period: period ?? this.period,
      completionRate: completionRate ?? this.completionRate,
      overdueCount: overdueCount ?? this.overdueCount,
      memberStats: memberStats ?? this.memberStats,
      projectStats: projectStats ?? this.projectStats,
    );
  }

  factory TeamReport.fromJson(Map<String, dynamic> json) {
    return TeamReport(
      period: ReportPeriod.fromString(json['period'] as String? ?? 'week'),
      completionRate: (json['completionRate'] as num?)?.toDouble() ?? 0.0,
      overdueCount: json['overdueCount'] as int? ?? 0,
      memberStats: (json['memberStats'] as List<dynamic>?)
              ?.map((e) => MemberStat.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      projectStats: (json['projectStats'] as List<dynamic>?)
              ?.map((e) => ProjectStat.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }
}

/// Individual member contribution stat.
class MemberStat {
  const MemberStat({
    required this.userId,
    required this.name,
    required this.tasksCompleted,
    required this.tasksOverdue,
    required this.completionRate,
  });

  final String userId;
  final String name;
  final int tasksCompleted;
  final int tasksOverdue;
  final double completionRate;

  factory MemberStat.fromJson(Map<String, dynamic> json) {
    return MemberStat(
      userId: json['userId'] as String,
      name: json['name'] as String,
      tasksCompleted: json['tasksCompleted'] as int? ?? 0,
      tasksOverdue: json['tasksOverdue'] as int? ?? 0,
      completionRate: (json['completionRate'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// Project-level stat for team reports.
class ProjectStat {
  const ProjectStat({
    required this.projectId,
    required this.name,
    required this.totalTasks,
    required this.completedTasks,
  });

  final String projectId;
  final String name;
  final int totalTasks;
  final int completedTasks;

  double get completionRate =>
      totalTasks > 0 ? completedTasks / totalTasks : 0.0;

  factory ProjectStat.fromJson(Map<String, dynamic> json) {
    return ProjectStat(
      projectId: json['projectId'] as String,
      name: json['name'] as String,
      totalTasks: json['totalTasks'] as int? ?? 0,
      completedTasks: json['completedTasks'] as int? ?? 0,
    );
  }
}

/// Report period enum.
enum ReportPeriod {
  week,
  month,
  quarter;

  String get displayName {
    switch (this) {
      case ReportPeriod.week:
        return 'This Week';
      case ReportPeriod.month:
        return 'This Month';
      case ReportPeriod.quarter:
        return 'This Quarter';
    }
  }

  /// API range parameter value (e.g. '7d', '30d', '90d').
  String get apiValue {
    switch (this) {
      case ReportPeriod.week:
        return '7d';
      case ReportPeriod.month:
        return '30d';
      case ReportPeriod.quarter:
        return '90d';
    }
  }

  static ReportPeriod fromString(String value) {
    return ReportPeriod.values.firstWhere(
      (p) => p.name == value,
      orElse: () => ReportPeriod.week,
    );
  }
}
