/// UNJYNX TODO Feature Plugin.
///
/// Provides task management functionality including:
/// - CRUD operations for todos
/// - Task filtering and sorting
/// - Priority management
/// - Project assignment
library feature_todos;

export 'src/domain/entities/todo.dart';
export 'src/domain/entities/todo_filter.dart';
export 'src/domain/repositories/todo_repository.dart';
export 'src/domain/usecases/create_todo.dart';
export 'src/domain/usecases/get_todos.dart';
export 'src/domain/usecases/update_todo.dart';
export 'src/domain/usecases/delete_todo.dart';
export 'src/domain/usecases/complete_todo.dart';
export 'src/data/datasources/todo_drift_datasource.dart';
export 'src/data/repositories/todo_drift_repository.dart';
export 'src/data/repositories/todo_sync_repository.dart';
export 'src/presentation/pages/todo_detail_page.dart';
export 'src/presentation/providers/todo_providers.dart';
export 'src/presentation/pages/todo_list_page.dart';
export 'src/presentation/pages/kanban_board_page.dart';
export 'src/presentation/pages/recurring_builder_page.dart';
export 'src/presentation/pages/table_view_page.dart';
export 'src/presentation/pages/templates_page.dart';
export 'src/presentation/pages/timeline_page.dart';
export 'src/domain/entities/task_comment.dart';
export 'src/domain/services/rrule_service.dart';
export 'src/presentation/providers/comment_providers.dart';
export 'src/presentation/widgets/comment_section.dart';
export 'src/todo_plugin_impl.dart';
