/// Base class for all UNJYNX application events.
sealed class AppEvent {
  final DateTime timestamp;

  AppEvent() : timestamp = DateTime.now();
}

// --- Task Events ---

class TaskCreated extends AppEvent {
  final String taskId;
  final String title;
  final DateTime? dueDate;

  TaskCreated({required this.taskId, required this.title, this.dueDate});
}

class TaskCompleted extends AppEvent {
  final String taskId;
  final String title;

  TaskCompleted({required this.taskId, required this.title});
}

class TaskUpdated extends AppEvent {
  final String taskId;
  final Map<String, dynamic> changes;

  TaskUpdated({required this.taskId, required this.changes});
}

class TaskDeleted extends AppEvent {
  final String taskId;

  TaskDeleted({required this.taskId});
}

// --- Project Events ---

class ProjectCreated extends AppEvent {
  final String projectId;
  final String name;

  ProjectCreated({required this.projectId, required this.name});
}

class ProjectArchived extends AppEvent {
  final String projectId;

  ProjectArchived({required this.projectId});
}

// --- Gamification Events ---

class XPEarned extends AppEvent {
  final int amount;
  final String reason;

  XPEarned({required this.amount, required this.reason});
}

class StreakUpdated extends AppEvent {
  final int currentStreak;

  StreakUpdated({required this.currentStreak});
}

// --- Sync Events ---

class SyncStarted extends AppEvent {}

class SyncCompleted extends AppEvent {
  final int pushed;
  final int pulled;

  SyncCompleted({required this.pushed, required this.pulled});
}

class SyncFailed extends AppEvent {
  final String error;

  SyncFailed({required this.error});
}
