// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'drift_database.dart';

// ignore_for_file: type=lint
class $LocalTasksTable extends LocalTasks
    with TableInfo<$LocalTasksTable, LocalTask> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalTasksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    false,
    additionalChecks: GeneratedColumn.checkTextLength(
      minTextLength: 1,
      maxTextLength: 500,
    ),
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _descriptionMeta = const VerificationMeta(
    'description',
  );
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
    'description',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  static const VerificationMeta _priorityMeta = const VerificationMeta(
    'priority',
  );
  @override
  late final GeneratedColumn<String> priority = GeneratedColumn<String>(
    'priority',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('none'),
  );
  static const VerificationMeta _projectIdMeta = const VerificationMeta(
    'projectId',
  );
  @override
  late final GeneratedColumn<String> projectId = GeneratedColumn<String>(
    'project_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _dueDateMeta = const VerificationMeta(
    'dueDate',
  );
  @override
  late final GeneratedColumn<DateTime> dueDate = GeneratedColumn<DateTime>(
    'due_date',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _completedAtMeta = const VerificationMeta(
    'completedAt',
  );
  @override
  late final GeneratedColumn<DateTime> completedAt = GeneratedColumn<DateTime>(
    'completed_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _rruleMeta = const VerificationMeta('rrule');
  @override
  late final GeneratedColumn<String> rrule = GeneratedColumn<String>(
    'rrule',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sortOrderMeta = const VerificationMeta(
    'sortOrder',
  );
  @override
  late final GeneratedColumn<int> sortOrder = GeneratedColumn<int>(
    'sort_order',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _needsSyncMeta = const VerificationMeta(
    'needsSync',
  );
  @override
  late final GeneratedColumn<bool> needsSync = GeneratedColumn<bool>(
    'needs_sync',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("needs_sync" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    title,
    description,
    status,
    priority,
    projectId,
    dueDate,
    completedAt,
    rrule,
    sortOrder,
    createdAt,
    updatedAt,
    needsSync,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_tasks';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalTask> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
        _descriptionMeta,
        description.isAcceptableOrUnknown(
          data['description']!,
          _descriptionMeta,
        ),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('priority')) {
      context.handle(
        _priorityMeta,
        priority.isAcceptableOrUnknown(data['priority']!, _priorityMeta),
      );
    }
    if (data.containsKey('project_id')) {
      context.handle(
        _projectIdMeta,
        projectId.isAcceptableOrUnknown(data['project_id']!, _projectIdMeta),
      );
    }
    if (data.containsKey('due_date')) {
      context.handle(
        _dueDateMeta,
        dueDate.isAcceptableOrUnknown(data['due_date']!, _dueDateMeta),
      );
    }
    if (data.containsKey('completed_at')) {
      context.handle(
        _completedAtMeta,
        completedAt.isAcceptableOrUnknown(
          data['completed_at']!,
          _completedAtMeta,
        ),
      );
    }
    if (data.containsKey('rrule')) {
      context.handle(
        _rruleMeta,
        rrule.isAcceptableOrUnknown(data['rrule']!, _rruleMeta),
      );
    }
    if (data.containsKey('sort_order')) {
      context.handle(
        _sortOrderMeta,
        sortOrder.isAcceptableOrUnknown(data['sort_order']!, _sortOrderMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    if (data.containsKey('needs_sync')) {
      context.handle(
        _needsSyncMeta,
        needsSync.isAcceptableOrUnknown(data['needs_sync']!, _needsSyncMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalTask map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalTask(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      )!,
      description: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}description'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      priority: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}priority'],
      )!,
      projectId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}project_id'],
      ),
      dueDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}due_date'],
      ),
      completedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}completed_at'],
      ),
      rrule: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}rrule'],
      ),
      sortOrder: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}sort_order'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      needsSync: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}needs_sync'],
      )!,
    );
  }

  @override
  $LocalTasksTable createAlias(String alias) {
    return $LocalTasksTable(attachedDatabase, alias);
  }
}

class LocalTask extends DataClass implements Insertable<LocalTask> {
  final String id;
  final String title;
  final String description;
  final String status;
  final String priority;
  final String? projectId;
  final DateTime? dueDate;
  final DateTime? completedAt;
  final String? rrule;
  final int sortOrder;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool needsSync;
  const LocalTask({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.priority,
    this.projectId,
    this.dueDate,
    this.completedAt,
    this.rrule,
    required this.sortOrder,
    required this.createdAt,
    required this.updatedAt,
    required this.needsSync,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['title'] = Variable<String>(title);
    map['description'] = Variable<String>(description);
    map['status'] = Variable<String>(status);
    map['priority'] = Variable<String>(priority);
    if (!nullToAbsent || projectId != null) {
      map['project_id'] = Variable<String>(projectId);
    }
    if (!nullToAbsent || dueDate != null) {
      map['due_date'] = Variable<DateTime>(dueDate);
    }
    if (!nullToAbsent || completedAt != null) {
      map['completed_at'] = Variable<DateTime>(completedAt);
    }
    if (!nullToAbsent || rrule != null) {
      map['rrule'] = Variable<String>(rrule);
    }
    map['sort_order'] = Variable<int>(sortOrder);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['needs_sync'] = Variable<bool>(needsSync);
    return map;
  }

  LocalTasksCompanion toCompanion(bool nullToAbsent) {
    return LocalTasksCompanion(
      id: Value(id),
      title: Value(title),
      description: Value(description),
      status: Value(status),
      priority: Value(priority),
      projectId: projectId == null && nullToAbsent
          ? const Value.absent()
          : Value(projectId),
      dueDate: dueDate == null && nullToAbsent
          ? const Value.absent()
          : Value(dueDate),
      completedAt: completedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(completedAt),
      rrule: rrule == null && nullToAbsent
          ? const Value.absent()
          : Value(rrule),
      sortOrder: Value(sortOrder),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
      needsSync: Value(needsSync),
    );
  }

  factory LocalTask.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalTask(
      id: serializer.fromJson<String>(json['id']),
      title: serializer.fromJson<String>(json['title']),
      description: serializer.fromJson<String>(json['description']),
      status: serializer.fromJson<String>(json['status']),
      priority: serializer.fromJson<String>(json['priority']),
      projectId: serializer.fromJson<String?>(json['projectId']),
      dueDate: serializer.fromJson<DateTime?>(json['dueDate']),
      completedAt: serializer.fromJson<DateTime?>(json['completedAt']),
      rrule: serializer.fromJson<String?>(json['rrule']),
      sortOrder: serializer.fromJson<int>(json['sortOrder']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      needsSync: serializer.fromJson<bool>(json['needsSync']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'title': serializer.toJson<String>(title),
      'description': serializer.toJson<String>(description),
      'status': serializer.toJson<String>(status),
      'priority': serializer.toJson<String>(priority),
      'projectId': serializer.toJson<String?>(projectId),
      'dueDate': serializer.toJson<DateTime?>(dueDate),
      'completedAt': serializer.toJson<DateTime?>(completedAt),
      'rrule': serializer.toJson<String?>(rrule),
      'sortOrder': serializer.toJson<int>(sortOrder),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'needsSync': serializer.toJson<bool>(needsSync),
    };
  }

  LocalTask copyWith({
    String? id,
    String? title,
    String? description,
    String? status,
    String? priority,
    Value<String?> projectId = const Value.absent(),
    Value<DateTime?> dueDate = const Value.absent(),
    Value<DateTime?> completedAt = const Value.absent(),
    Value<String?> rrule = const Value.absent(),
    int? sortOrder,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? needsSync,
  }) => LocalTask(
    id: id ?? this.id,
    title: title ?? this.title,
    description: description ?? this.description,
    status: status ?? this.status,
    priority: priority ?? this.priority,
    projectId: projectId.present ? projectId.value : this.projectId,
    dueDate: dueDate.present ? dueDate.value : this.dueDate,
    completedAt: completedAt.present ? completedAt.value : this.completedAt,
    rrule: rrule.present ? rrule.value : this.rrule,
    sortOrder: sortOrder ?? this.sortOrder,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    needsSync: needsSync ?? this.needsSync,
  );
  LocalTask copyWithCompanion(LocalTasksCompanion data) {
    return LocalTask(
      id: data.id.present ? data.id.value : this.id,
      title: data.title.present ? data.title.value : this.title,
      description: data.description.present
          ? data.description.value
          : this.description,
      status: data.status.present ? data.status.value : this.status,
      priority: data.priority.present ? data.priority.value : this.priority,
      projectId: data.projectId.present ? data.projectId.value : this.projectId,
      dueDate: data.dueDate.present ? data.dueDate.value : this.dueDate,
      completedAt: data.completedAt.present
          ? data.completedAt.value
          : this.completedAt,
      rrule: data.rrule.present ? data.rrule.value : this.rrule,
      sortOrder: data.sortOrder.present ? data.sortOrder.value : this.sortOrder,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      needsSync: data.needsSync.present ? data.needsSync.value : this.needsSync,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalTask(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('status: $status, ')
          ..write('priority: $priority, ')
          ..write('projectId: $projectId, ')
          ..write('dueDate: $dueDate, ')
          ..write('completedAt: $completedAt, ')
          ..write('rrule: $rrule, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('needsSync: $needsSync')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    title,
    description,
    status,
    priority,
    projectId,
    dueDate,
    completedAt,
    rrule,
    sortOrder,
    createdAt,
    updatedAt,
    needsSync,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalTask &&
          other.id == this.id &&
          other.title == this.title &&
          other.description == this.description &&
          other.status == this.status &&
          other.priority == this.priority &&
          other.projectId == this.projectId &&
          other.dueDate == this.dueDate &&
          other.completedAt == this.completedAt &&
          other.rrule == this.rrule &&
          other.sortOrder == this.sortOrder &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.needsSync == this.needsSync);
}

class LocalTasksCompanion extends UpdateCompanion<LocalTask> {
  final Value<String> id;
  final Value<String> title;
  final Value<String> description;
  final Value<String> status;
  final Value<String> priority;
  final Value<String?> projectId;
  final Value<DateTime?> dueDate;
  final Value<DateTime?> completedAt;
  final Value<String?> rrule;
  final Value<int> sortOrder;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<bool> needsSync;
  final Value<int> rowid;
  const LocalTasksCompanion({
    this.id = const Value.absent(),
    this.title = const Value.absent(),
    this.description = const Value.absent(),
    this.status = const Value.absent(),
    this.priority = const Value.absent(),
    this.projectId = const Value.absent(),
    this.dueDate = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.rrule = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalTasksCompanion.insert({
    required String id,
    required String title,
    this.description = const Value.absent(),
    this.status = const Value.absent(),
    this.priority = const Value.absent(),
    this.projectId = const Value.absent(),
    this.dueDate = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.rrule = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       title = Value(title);
  static Insertable<LocalTask> custom({
    Expression<String>? id,
    Expression<String>? title,
    Expression<String>? description,
    Expression<String>? status,
    Expression<String>? priority,
    Expression<String>? projectId,
    Expression<DateTime>? dueDate,
    Expression<DateTime>? completedAt,
    Expression<String>? rrule,
    Expression<int>? sortOrder,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<bool>? needsSync,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (status != null) 'status': status,
      if (priority != null) 'priority': priority,
      if (projectId != null) 'project_id': projectId,
      if (dueDate != null) 'due_date': dueDate,
      if (completedAt != null) 'completed_at': completedAt,
      if (rrule != null) 'rrule': rrule,
      if (sortOrder != null) 'sort_order': sortOrder,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (needsSync != null) 'needs_sync': needsSync,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalTasksCompanion copyWith({
    Value<String>? id,
    Value<String>? title,
    Value<String>? description,
    Value<String>? status,
    Value<String>? priority,
    Value<String?>? projectId,
    Value<DateTime?>? dueDate,
    Value<DateTime?>? completedAt,
    Value<String?>? rrule,
    Value<int>? sortOrder,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<bool>? needsSync,
    Value<int>? rowid,
  }) {
    return LocalTasksCompanion(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      projectId: projectId ?? this.projectId,
      dueDate: dueDate ?? this.dueDate,
      completedAt: completedAt ?? this.completedAt,
      rrule: rrule ?? this.rrule,
      sortOrder: sortOrder ?? this.sortOrder,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      needsSync: needsSync ?? this.needsSync,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (priority.present) {
      map['priority'] = Variable<String>(priority.value);
    }
    if (projectId.present) {
      map['project_id'] = Variable<String>(projectId.value);
    }
    if (dueDate.present) {
      map['due_date'] = Variable<DateTime>(dueDate.value);
    }
    if (completedAt.present) {
      map['completed_at'] = Variable<DateTime>(completedAt.value);
    }
    if (rrule.present) {
      map['rrule'] = Variable<String>(rrule.value);
    }
    if (sortOrder.present) {
      map['sort_order'] = Variable<int>(sortOrder.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (needsSync.present) {
      map['needs_sync'] = Variable<bool>(needsSync.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalTasksCompanion(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('status: $status, ')
          ..write('priority: $priority, ')
          ..write('projectId: $projectId, ')
          ..write('dueDate: $dueDate, ')
          ..write('completedAt: $completedAt, ')
          ..write('rrule: $rrule, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('needsSync: $needsSync, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalProjectsTable extends LocalProjects
    with TableInfo<$LocalProjectsTable, LocalProject> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalProjectsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    additionalChecks: GeneratedColumn.checkTextLength(
      minTextLength: 1,
      maxTextLength: 200,
    ),
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _descriptionMeta = const VerificationMeta(
    'description',
  );
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
    'description',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _colorMeta = const VerificationMeta('color');
  @override
  late final GeneratedColumn<String> color = GeneratedColumn<String>(
    'color',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('#6C5CE7'),
  );
  static const VerificationMeta _iconMeta = const VerificationMeta('icon');
  @override
  late final GeneratedColumn<String> icon = GeneratedColumn<String>(
    'icon',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('folder'),
  );
  static const VerificationMeta _isArchivedMeta = const VerificationMeta(
    'isArchived',
  );
  @override
  late final GeneratedColumn<bool> isArchived = GeneratedColumn<bool>(
    'is_archived',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_archived" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _sortOrderMeta = const VerificationMeta(
    'sortOrder',
  );
  @override
  late final GeneratedColumn<int> sortOrder = GeneratedColumn<int>(
    'sort_order',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    description,
    color,
    icon,
    isArchived,
    sortOrder,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_projects';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalProject> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
        _descriptionMeta,
        description.isAcceptableOrUnknown(
          data['description']!,
          _descriptionMeta,
        ),
      );
    }
    if (data.containsKey('color')) {
      context.handle(
        _colorMeta,
        color.isAcceptableOrUnknown(data['color']!, _colorMeta),
      );
    }
    if (data.containsKey('icon')) {
      context.handle(
        _iconMeta,
        icon.isAcceptableOrUnknown(data['icon']!, _iconMeta),
      );
    }
    if (data.containsKey('is_archived')) {
      context.handle(
        _isArchivedMeta,
        isArchived.isAcceptableOrUnknown(data['is_archived']!, _isArchivedMeta),
      );
    }
    if (data.containsKey('sort_order')) {
      context.handle(
        _sortOrderMeta,
        sortOrder.isAcceptableOrUnknown(data['sort_order']!, _sortOrderMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalProject map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalProject(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      description: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}description'],
      ),
      color: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}color'],
      )!,
      icon: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}icon'],
      )!,
      isArchived: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_archived'],
      )!,
      sortOrder: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}sort_order'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $LocalProjectsTable createAlias(String alias) {
    return $LocalProjectsTable(attachedDatabase, alias);
  }
}

class LocalProject extends DataClass implements Insertable<LocalProject> {
  final String id;
  final String name;
  final String? description;
  final String color;
  final String icon;
  final bool isArchived;
  final int sortOrder;
  final DateTime createdAt;
  final DateTime updatedAt;
  const LocalProject({
    required this.id,
    required this.name,
    this.description,
    required this.color,
    required this.icon,
    required this.isArchived,
    required this.sortOrder,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || description != null) {
      map['description'] = Variable<String>(description);
    }
    map['color'] = Variable<String>(color);
    map['icon'] = Variable<String>(icon);
    map['is_archived'] = Variable<bool>(isArchived);
    map['sort_order'] = Variable<int>(sortOrder);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalProjectsCompanion toCompanion(bool nullToAbsent) {
    return LocalProjectsCompanion(
      id: Value(id),
      name: Value(name),
      description: description == null && nullToAbsent
          ? const Value.absent()
          : Value(description),
      color: Value(color),
      icon: Value(icon),
      isArchived: Value(isArchived),
      sortOrder: Value(sortOrder),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalProject.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalProject(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      description: serializer.fromJson<String?>(json['description']),
      color: serializer.fromJson<String>(json['color']),
      icon: serializer.fromJson<String>(json['icon']),
      isArchived: serializer.fromJson<bool>(json['isArchived']),
      sortOrder: serializer.fromJson<int>(json['sortOrder']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'description': serializer.toJson<String?>(description),
      'color': serializer.toJson<String>(color),
      'icon': serializer.toJson<String>(icon),
      'isArchived': serializer.toJson<bool>(isArchived),
      'sortOrder': serializer.toJson<int>(sortOrder),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalProject copyWith({
    String? id,
    String? name,
    Value<String?> description = const Value.absent(),
    String? color,
    String? icon,
    bool? isArchived,
    int? sortOrder,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => LocalProject(
    id: id ?? this.id,
    name: name ?? this.name,
    description: description.present ? description.value : this.description,
    color: color ?? this.color,
    icon: icon ?? this.icon,
    isArchived: isArchived ?? this.isArchived,
    sortOrder: sortOrder ?? this.sortOrder,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  LocalProject copyWithCompanion(LocalProjectsCompanion data) {
    return LocalProject(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      description: data.description.present
          ? data.description.value
          : this.description,
      color: data.color.present ? data.color.value : this.color,
      icon: data.icon.present ? data.icon.value : this.icon,
      isArchived: data.isArchived.present
          ? data.isArchived.value
          : this.isArchived,
      sortOrder: data.sortOrder.present ? data.sortOrder.value : this.sortOrder,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalProject(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('description: $description, ')
          ..write('color: $color, ')
          ..write('icon: $icon, ')
          ..write('isArchived: $isArchived, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    description,
    color,
    icon,
    isArchived,
    sortOrder,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalProject &&
          other.id == this.id &&
          other.name == this.name &&
          other.description == this.description &&
          other.color == this.color &&
          other.icon == this.icon &&
          other.isArchived == this.isArchived &&
          other.sortOrder == this.sortOrder &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class LocalProjectsCompanion extends UpdateCompanion<LocalProject> {
  final Value<String> id;
  final Value<String> name;
  final Value<String?> description;
  final Value<String> color;
  final Value<String> icon;
  final Value<bool> isArchived;
  final Value<int> sortOrder;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const LocalProjectsCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.description = const Value.absent(),
    this.color = const Value.absent(),
    this.icon = const Value.absent(),
    this.isArchived = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalProjectsCompanion.insert({
    required String id,
    required String name,
    this.description = const Value.absent(),
    this.color = const Value.absent(),
    this.icon = const Value.absent(),
    this.isArchived = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       name = Value(name);
  static Insertable<LocalProject> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? description,
    Expression<String>? color,
    Expression<String>? icon,
    Expression<bool>? isArchived,
    Expression<int>? sortOrder,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (color != null) 'color': color,
      if (icon != null) 'icon': icon,
      if (isArchived != null) 'is_archived': isArchived,
      if (sortOrder != null) 'sort_order': sortOrder,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalProjectsCompanion copyWith({
    Value<String>? id,
    Value<String>? name,
    Value<String?>? description,
    Value<String>? color,
    Value<String>? icon,
    Value<bool>? isArchived,
    Value<int>? sortOrder,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return LocalProjectsCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      color: color ?? this.color,
      icon: icon ?? this.icon,
      isArchived: isArchived ?? this.isArchived,
      sortOrder: sortOrder ?? this.sortOrder,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (color.present) {
      map['color'] = Variable<String>(color.value);
    }
    if (icon.present) {
      map['icon'] = Variable<String>(icon.value);
    }
    if (isArchived.present) {
      map['is_archived'] = Variable<bool>(isArchived.value);
    }
    if (sortOrder.present) {
      map['sort_order'] = Variable<int>(sortOrder.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalProjectsCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('description: $description, ')
          ..write('color: $color, ')
          ..write('icon: $icon, ')
          ..write('isArchived: $isArchived, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalDailyContentTable extends LocalDailyContent
    with TableInfo<$LocalDailyContentTable, LocalDailyContentData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalDailyContentTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _categoryMeta = const VerificationMeta(
    'category',
  );
  @override
  late final GeneratedColumn<String> category = GeneratedColumn<String>(
    'category',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bodyMeta = const VerificationMeta('body');
  @override
  late final GeneratedColumn<String> body = GeneratedColumn<String>(
    'body',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _authorMeta = const VerificationMeta('author');
  @override
  late final GeneratedColumn<String> author = GeneratedColumn<String>(
    'author',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sourceMeta = const VerificationMeta('source');
  @override
  late final GeneratedColumn<String> source = GeneratedColumn<String>(
    'source',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _languageMeta = const VerificationMeta(
    'language',
  );
  @override
  late final GeneratedColumn<String> language = GeneratedColumn<String>(
    'language',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('en'),
  );
  static const VerificationMeta _isSavedMeta = const VerificationMeta(
    'isSaved',
  );
  @override
  late final GeneratedColumn<bool> isSaved = GeneratedColumn<bool>(
    'is_saved',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_saved" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _fetchedAtMeta = const VerificationMeta(
    'fetchedAt',
  );
  @override
  late final GeneratedColumn<DateTime> fetchedAt = GeneratedColumn<DateTime>(
    'fetched_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    category,
    body,
    author,
    source,
    language,
    isSaved,
    fetchedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_daily_content';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalDailyContentData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('category')) {
      context.handle(
        _categoryMeta,
        category.isAcceptableOrUnknown(data['category']!, _categoryMeta),
      );
    } else if (isInserting) {
      context.missing(_categoryMeta);
    }
    if (data.containsKey('body')) {
      context.handle(
        _bodyMeta,
        body.isAcceptableOrUnknown(data['body']!, _bodyMeta),
      );
    } else if (isInserting) {
      context.missing(_bodyMeta);
    }
    if (data.containsKey('author')) {
      context.handle(
        _authorMeta,
        author.isAcceptableOrUnknown(data['author']!, _authorMeta),
      );
    }
    if (data.containsKey('source')) {
      context.handle(
        _sourceMeta,
        source.isAcceptableOrUnknown(data['source']!, _sourceMeta),
      );
    }
    if (data.containsKey('language')) {
      context.handle(
        _languageMeta,
        language.isAcceptableOrUnknown(data['language']!, _languageMeta),
      );
    }
    if (data.containsKey('is_saved')) {
      context.handle(
        _isSavedMeta,
        isSaved.isAcceptableOrUnknown(data['is_saved']!, _isSavedMeta),
      );
    }
    if (data.containsKey('fetched_at')) {
      context.handle(
        _fetchedAtMeta,
        fetchedAt.isAcceptableOrUnknown(data['fetched_at']!, _fetchedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalDailyContentData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalDailyContentData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      category: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}category'],
      )!,
      body: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}body'],
      )!,
      author: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}author'],
      ),
      source: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source'],
      ),
      language: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}language'],
      )!,
      isSaved: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_saved'],
      )!,
      fetchedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}fetched_at'],
      )!,
    );
  }

  @override
  $LocalDailyContentTable createAlias(String alias) {
    return $LocalDailyContentTable(attachedDatabase, alias);
  }
}

class LocalDailyContentData extends DataClass
    implements Insertable<LocalDailyContentData> {
  final String id;
  final String category;
  final String body;
  final String? author;
  final String? source;
  final String language;
  final bool isSaved;
  final DateTime fetchedAt;
  const LocalDailyContentData({
    required this.id,
    required this.category,
    required this.body,
    this.author,
    this.source,
    required this.language,
    required this.isSaved,
    required this.fetchedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['category'] = Variable<String>(category);
    map['body'] = Variable<String>(body);
    if (!nullToAbsent || author != null) {
      map['author'] = Variable<String>(author);
    }
    if (!nullToAbsent || source != null) {
      map['source'] = Variable<String>(source);
    }
    map['language'] = Variable<String>(language);
    map['is_saved'] = Variable<bool>(isSaved);
    map['fetched_at'] = Variable<DateTime>(fetchedAt);
    return map;
  }

  LocalDailyContentCompanion toCompanion(bool nullToAbsent) {
    return LocalDailyContentCompanion(
      id: Value(id),
      category: Value(category),
      body: Value(body),
      author: author == null && nullToAbsent
          ? const Value.absent()
          : Value(author),
      source: source == null && nullToAbsent
          ? const Value.absent()
          : Value(source),
      language: Value(language),
      isSaved: Value(isSaved),
      fetchedAt: Value(fetchedAt),
    );
  }

  factory LocalDailyContentData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalDailyContentData(
      id: serializer.fromJson<String>(json['id']),
      category: serializer.fromJson<String>(json['category']),
      body: serializer.fromJson<String>(json['body']),
      author: serializer.fromJson<String?>(json['author']),
      source: serializer.fromJson<String?>(json['source']),
      language: serializer.fromJson<String>(json['language']),
      isSaved: serializer.fromJson<bool>(json['isSaved']),
      fetchedAt: serializer.fromJson<DateTime>(json['fetchedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'category': serializer.toJson<String>(category),
      'body': serializer.toJson<String>(body),
      'author': serializer.toJson<String?>(author),
      'source': serializer.toJson<String?>(source),
      'language': serializer.toJson<String>(language),
      'isSaved': serializer.toJson<bool>(isSaved),
      'fetchedAt': serializer.toJson<DateTime>(fetchedAt),
    };
  }

  LocalDailyContentData copyWith({
    String? id,
    String? category,
    String? body,
    Value<String?> author = const Value.absent(),
    Value<String?> source = const Value.absent(),
    String? language,
    bool? isSaved,
    DateTime? fetchedAt,
  }) => LocalDailyContentData(
    id: id ?? this.id,
    category: category ?? this.category,
    body: body ?? this.body,
    author: author.present ? author.value : this.author,
    source: source.present ? source.value : this.source,
    language: language ?? this.language,
    isSaved: isSaved ?? this.isSaved,
    fetchedAt: fetchedAt ?? this.fetchedAt,
  );
  LocalDailyContentData copyWithCompanion(LocalDailyContentCompanion data) {
    return LocalDailyContentData(
      id: data.id.present ? data.id.value : this.id,
      category: data.category.present ? data.category.value : this.category,
      body: data.body.present ? data.body.value : this.body,
      author: data.author.present ? data.author.value : this.author,
      source: data.source.present ? data.source.value : this.source,
      language: data.language.present ? data.language.value : this.language,
      isSaved: data.isSaved.present ? data.isSaved.value : this.isSaved,
      fetchedAt: data.fetchedAt.present ? data.fetchedAt.value : this.fetchedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalDailyContentData(')
          ..write('id: $id, ')
          ..write('category: $category, ')
          ..write('body: $body, ')
          ..write('author: $author, ')
          ..write('source: $source, ')
          ..write('language: $language, ')
          ..write('isSaved: $isSaved, ')
          ..write('fetchedAt: $fetchedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    category,
    body,
    author,
    source,
    language,
    isSaved,
    fetchedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalDailyContentData &&
          other.id == this.id &&
          other.category == this.category &&
          other.body == this.body &&
          other.author == this.author &&
          other.source == this.source &&
          other.language == this.language &&
          other.isSaved == this.isSaved &&
          other.fetchedAt == this.fetchedAt);
}

class LocalDailyContentCompanion
    extends UpdateCompanion<LocalDailyContentData> {
  final Value<String> id;
  final Value<String> category;
  final Value<String> body;
  final Value<String?> author;
  final Value<String?> source;
  final Value<String> language;
  final Value<bool> isSaved;
  final Value<DateTime> fetchedAt;
  final Value<int> rowid;
  const LocalDailyContentCompanion({
    this.id = const Value.absent(),
    this.category = const Value.absent(),
    this.body = const Value.absent(),
    this.author = const Value.absent(),
    this.source = const Value.absent(),
    this.language = const Value.absent(),
    this.isSaved = const Value.absent(),
    this.fetchedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalDailyContentCompanion.insert({
    required String id,
    required String category,
    required String body,
    this.author = const Value.absent(),
    this.source = const Value.absent(),
    this.language = const Value.absent(),
    this.isSaved = const Value.absent(),
    this.fetchedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       category = Value(category),
       body = Value(body);
  static Insertable<LocalDailyContentData> custom({
    Expression<String>? id,
    Expression<String>? category,
    Expression<String>? body,
    Expression<String>? author,
    Expression<String>? source,
    Expression<String>? language,
    Expression<bool>? isSaved,
    Expression<DateTime>? fetchedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (category != null) 'category': category,
      if (body != null) 'body': body,
      if (author != null) 'author': author,
      if (source != null) 'source': source,
      if (language != null) 'language': language,
      if (isSaved != null) 'is_saved': isSaved,
      if (fetchedAt != null) 'fetched_at': fetchedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalDailyContentCompanion copyWith({
    Value<String>? id,
    Value<String>? category,
    Value<String>? body,
    Value<String?>? author,
    Value<String?>? source,
    Value<String>? language,
    Value<bool>? isSaved,
    Value<DateTime>? fetchedAt,
    Value<int>? rowid,
  }) {
    return LocalDailyContentCompanion(
      id: id ?? this.id,
      category: category ?? this.category,
      body: body ?? this.body,
      author: author ?? this.author,
      source: source ?? this.source,
      language: language ?? this.language,
      isSaved: isSaved ?? this.isSaved,
      fetchedAt: fetchedAt ?? this.fetchedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (category.present) {
      map['category'] = Variable<String>(category.value);
    }
    if (body.present) {
      map['body'] = Variable<String>(body.value);
    }
    if (author.present) {
      map['author'] = Variable<String>(author.value);
    }
    if (source.present) {
      map['source'] = Variable<String>(source.value);
    }
    if (language.present) {
      map['language'] = Variable<String>(language.value);
    }
    if (isSaved.present) {
      map['is_saved'] = Variable<bool>(isSaved.value);
    }
    if (fetchedAt.present) {
      map['fetched_at'] = Variable<DateTime>(fetchedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalDailyContentCompanion(')
          ..write('id: $id, ')
          ..write('category: $category, ')
          ..write('body: $body, ')
          ..write('author: $author, ')
          ..write('source: $source, ')
          ..write('language: $language, ')
          ..write('isSaved: $isSaved, ')
          ..write('fetchedAt: $fetchedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalContentPreferencesTable extends LocalContentPreferences
    with TableInfo<$LocalContentPreferencesTable, LocalContentPreference> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalContentPreferencesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _categoryMeta = const VerificationMeta(
    'category',
  );
  @override
  late final GeneratedColumn<String> category = GeneratedColumn<String>(
    'category',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _deliverAtMeta = const VerificationMeta(
    'deliverAt',
  );
  @override
  late final GeneratedColumn<String> deliverAt = GeneratedColumn<String>(
    'deliver_at',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('07:00'),
  );
  static const VerificationMeta _isActiveMeta = const VerificationMeta(
    'isActive',
  );
  @override
  late final GeneratedColumn<bool> isActive = GeneratedColumn<bool>(
    'is_active',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_active" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  @override
  List<GeneratedColumn> get $columns => [category, deliverAt, isActive];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_content_preferences';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalContentPreference> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('category')) {
      context.handle(
        _categoryMeta,
        category.isAcceptableOrUnknown(data['category']!, _categoryMeta),
      );
    } else if (isInserting) {
      context.missing(_categoryMeta);
    }
    if (data.containsKey('deliver_at')) {
      context.handle(
        _deliverAtMeta,
        deliverAt.isAcceptableOrUnknown(data['deliver_at']!, _deliverAtMeta),
      );
    }
    if (data.containsKey('is_active')) {
      context.handle(
        _isActiveMeta,
        isActive.isAcceptableOrUnknown(data['is_active']!, _isActiveMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {category};
  @override
  LocalContentPreference map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalContentPreference(
      category: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}category'],
      )!,
      deliverAt: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}deliver_at'],
      )!,
      isActive: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_active'],
      )!,
    );
  }

  @override
  $LocalContentPreferencesTable createAlias(String alias) {
    return $LocalContentPreferencesTable(attachedDatabase, alias);
  }
}

class LocalContentPreference extends DataClass
    implements Insertable<LocalContentPreference> {
  final String category;
  final String deliverAt;
  final bool isActive;
  const LocalContentPreference({
    required this.category,
    required this.deliverAt,
    required this.isActive,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['category'] = Variable<String>(category);
    map['deliver_at'] = Variable<String>(deliverAt);
    map['is_active'] = Variable<bool>(isActive);
    return map;
  }

  LocalContentPreferencesCompanion toCompanion(bool nullToAbsent) {
    return LocalContentPreferencesCompanion(
      category: Value(category),
      deliverAt: Value(deliverAt),
      isActive: Value(isActive),
    );
  }

  factory LocalContentPreference.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalContentPreference(
      category: serializer.fromJson<String>(json['category']),
      deliverAt: serializer.fromJson<String>(json['deliverAt']),
      isActive: serializer.fromJson<bool>(json['isActive']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'category': serializer.toJson<String>(category),
      'deliverAt': serializer.toJson<String>(deliverAt),
      'isActive': serializer.toJson<bool>(isActive),
    };
  }

  LocalContentPreference copyWith({
    String? category,
    String? deliverAt,
    bool? isActive,
  }) => LocalContentPreference(
    category: category ?? this.category,
    deliverAt: deliverAt ?? this.deliverAt,
    isActive: isActive ?? this.isActive,
  );
  LocalContentPreference copyWithCompanion(
    LocalContentPreferencesCompanion data,
  ) {
    return LocalContentPreference(
      category: data.category.present ? data.category.value : this.category,
      deliverAt: data.deliverAt.present ? data.deliverAt.value : this.deliverAt,
      isActive: data.isActive.present ? data.isActive.value : this.isActive,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalContentPreference(')
          ..write('category: $category, ')
          ..write('deliverAt: $deliverAt, ')
          ..write('isActive: $isActive')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(category, deliverAt, isActive);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalContentPreference &&
          other.category == this.category &&
          other.deliverAt == this.deliverAt &&
          other.isActive == this.isActive);
}

class LocalContentPreferencesCompanion
    extends UpdateCompanion<LocalContentPreference> {
  final Value<String> category;
  final Value<String> deliverAt;
  final Value<bool> isActive;
  final Value<int> rowid;
  const LocalContentPreferencesCompanion({
    this.category = const Value.absent(),
    this.deliverAt = const Value.absent(),
    this.isActive = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalContentPreferencesCompanion.insert({
    required String category,
    this.deliverAt = const Value.absent(),
    this.isActive = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : category = Value(category);
  static Insertable<LocalContentPreference> custom({
    Expression<String>? category,
    Expression<String>? deliverAt,
    Expression<bool>? isActive,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (category != null) 'category': category,
      if (deliverAt != null) 'deliver_at': deliverAt,
      if (isActive != null) 'is_active': isActive,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalContentPreferencesCompanion copyWith({
    Value<String>? category,
    Value<String>? deliverAt,
    Value<bool>? isActive,
    Value<int>? rowid,
  }) {
    return LocalContentPreferencesCompanion(
      category: category ?? this.category,
      deliverAt: deliverAt ?? this.deliverAt,
      isActive: isActive ?? this.isActive,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (category.present) {
      map['category'] = Variable<String>(category.value);
    }
    if (deliverAt.present) {
      map['deliver_at'] = Variable<String>(deliverAt.value);
    }
    if (isActive.present) {
      map['is_active'] = Variable<bool>(isActive.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalContentPreferencesCompanion(')
          ..write('category: $category, ')
          ..write('deliverAt: $deliverAt, ')
          ..write('isActive: $isActive, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalRitualLogTable extends LocalRitualLog
    with TableInfo<$LocalRitualLogTable, LocalRitualLogData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalRitualLogTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _ritualTypeMeta = const VerificationMeta(
    'ritualType',
  );
  @override
  late final GeneratedColumn<String> ritualType = GeneratedColumn<String>(
    'ritual_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _moodMeta = const VerificationMeta('mood');
  @override
  late final GeneratedColumn<int> mood = GeneratedColumn<int>(
    'mood',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _gratitudeTextMeta = const VerificationMeta(
    'gratitudeText',
  );
  @override
  late final GeneratedColumn<String> gratitudeText = GeneratedColumn<String>(
    'gratitude_text',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _intentionTextMeta = const VerificationMeta(
    'intentionText',
  );
  @override
  late final GeneratedColumn<String> intentionText = GeneratedColumn<String>(
    'intention_text',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _reflectionTextMeta = const VerificationMeta(
    'reflectionText',
  );
  @override
  late final GeneratedColumn<String> reflectionText = GeneratedColumn<String>(
    'reflection_text',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _completedAtMeta = const VerificationMeta(
    'completedAt',
  );
  @override
  late final GeneratedColumn<DateTime> completedAt = GeneratedColumn<DateTime>(
    'completed_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _ritualDateMeta = const VerificationMeta(
    'ritualDate',
  );
  @override
  late final GeneratedColumn<DateTime> ritualDate = GeneratedColumn<DateTime>(
    'ritual_date',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _needsSyncMeta = const VerificationMeta(
    'needsSync',
  );
  @override
  late final GeneratedColumn<bool> needsSync = GeneratedColumn<bool>(
    'needs_sync',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("needs_sync" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    ritualType,
    mood,
    gratitudeText,
    intentionText,
    reflectionText,
    completedAt,
    ritualDate,
    needsSync,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_ritual_log';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalRitualLogData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('ritual_type')) {
      context.handle(
        _ritualTypeMeta,
        ritualType.isAcceptableOrUnknown(data['ritual_type']!, _ritualTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_ritualTypeMeta);
    }
    if (data.containsKey('mood')) {
      context.handle(
        _moodMeta,
        mood.isAcceptableOrUnknown(data['mood']!, _moodMeta),
      );
    }
    if (data.containsKey('gratitude_text')) {
      context.handle(
        _gratitudeTextMeta,
        gratitudeText.isAcceptableOrUnknown(
          data['gratitude_text']!,
          _gratitudeTextMeta,
        ),
      );
    }
    if (data.containsKey('intention_text')) {
      context.handle(
        _intentionTextMeta,
        intentionText.isAcceptableOrUnknown(
          data['intention_text']!,
          _intentionTextMeta,
        ),
      );
    }
    if (data.containsKey('reflection_text')) {
      context.handle(
        _reflectionTextMeta,
        reflectionText.isAcceptableOrUnknown(
          data['reflection_text']!,
          _reflectionTextMeta,
        ),
      );
    }
    if (data.containsKey('completed_at')) {
      context.handle(
        _completedAtMeta,
        completedAt.isAcceptableOrUnknown(
          data['completed_at']!,
          _completedAtMeta,
        ),
      );
    }
    if (data.containsKey('ritual_date')) {
      context.handle(
        _ritualDateMeta,
        ritualDate.isAcceptableOrUnknown(data['ritual_date']!, _ritualDateMeta),
      );
    } else if (isInserting) {
      context.missing(_ritualDateMeta);
    }
    if (data.containsKey('needs_sync')) {
      context.handle(
        _needsSyncMeta,
        needsSync.isAcceptableOrUnknown(data['needs_sync']!, _needsSyncMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalRitualLogData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalRitualLogData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      ritualType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}ritual_type'],
      )!,
      mood: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}mood'],
      ),
      gratitudeText: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}gratitude_text'],
      ),
      intentionText: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}intention_text'],
      ),
      reflectionText: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}reflection_text'],
      ),
      completedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}completed_at'],
      )!,
      ritualDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}ritual_date'],
      )!,
      needsSync: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}needs_sync'],
      )!,
    );
  }

  @override
  $LocalRitualLogTable createAlias(String alias) {
    return $LocalRitualLogTable(attachedDatabase, alias);
  }
}

class LocalRitualLogData extends DataClass
    implements Insertable<LocalRitualLogData> {
  final String id;

  /// 'morning' or 'evening'
  final String ritualType;
  final int? mood;
  final String? gratitudeText;
  final String? intentionText;
  final String? reflectionText;
  final DateTime completedAt;

  /// Date of the ritual (no time, for dedup).
  final DateTime ritualDate;
  final bool needsSync;
  const LocalRitualLogData({
    required this.id,
    required this.ritualType,
    this.mood,
    this.gratitudeText,
    this.intentionText,
    this.reflectionText,
    required this.completedAt,
    required this.ritualDate,
    required this.needsSync,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['ritual_type'] = Variable<String>(ritualType);
    if (!nullToAbsent || mood != null) {
      map['mood'] = Variable<int>(mood);
    }
    if (!nullToAbsent || gratitudeText != null) {
      map['gratitude_text'] = Variable<String>(gratitudeText);
    }
    if (!nullToAbsent || intentionText != null) {
      map['intention_text'] = Variable<String>(intentionText);
    }
    if (!nullToAbsent || reflectionText != null) {
      map['reflection_text'] = Variable<String>(reflectionText);
    }
    map['completed_at'] = Variable<DateTime>(completedAt);
    map['ritual_date'] = Variable<DateTime>(ritualDate);
    map['needs_sync'] = Variable<bool>(needsSync);
    return map;
  }

  LocalRitualLogCompanion toCompanion(bool nullToAbsent) {
    return LocalRitualLogCompanion(
      id: Value(id),
      ritualType: Value(ritualType),
      mood: mood == null && nullToAbsent ? const Value.absent() : Value(mood),
      gratitudeText: gratitudeText == null && nullToAbsent
          ? const Value.absent()
          : Value(gratitudeText),
      intentionText: intentionText == null && nullToAbsent
          ? const Value.absent()
          : Value(intentionText),
      reflectionText: reflectionText == null && nullToAbsent
          ? const Value.absent()
          : Value(reflectionText),
      completedAt: Value(completedAt),
      ritualDate: Value(ritualDate),
      needsSync: Value(needsSync),
    );
  }

  factory LocalRitualLogData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalRitualLogData(
      id: serializer.fromJson<String>(json['id']),
      ritualType: serializer.fromJson<String>(json['ritualType']),
      mood: serializer.fromJson<int?>(json['mood']),
      gratitudeText: serializer.fromJson<String?>(json['gratitudeText']),
      intentionText: serializer.fromJson<String?>(json['intentionText']),
      reflectionText: serializer.fromJson<String?>(json['reflectionText']),
      completedAt: serializer.fromJson<DateTime>(json['completedAt']),
      ritualDate: serializer.fromJson<DateTime>(json['ritualDate']),
      needsSync: serializer.fromJson<bool>(json['needsSync']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'ritualType': serializer.toJson<String>(ritualType),
      'mood': serializer.toJson<int?>(mood),
      'gratitudeText': serializer.toJson<String?>(gratitudeText),
      'intentionText': serializer.toJson<String?>(intentionText),
      'reflectionText': serializer.toJson<String?>(reflectionText),
      'completedAt': serializer.toJson<DateTime>(completedAt),
      'ritualDate': serializer.toJson<DateTime>(ritualDate),
      'needsSync': serializer.toJson<bool>(needsSync),
    };
  }

  LocalRitualLogData copyWith({
    String? id,
    String? ritualType,
    Value<int?> mood = const Value.absent(),
    Value<String?> gratitudeText = const Value.absent(),
    Value<String?> intentionText = const Value.absent(),
    Value<String?> reflectionText = const Value.absent(),
    DateTime? completedAt,
    DateTime? ritualDate,
    bool? needsSync,
  }) => LocalRitualLogData(
    id: id ?? this.id,
    ritualType: ritualType ?? this.ritualType,
    mood: mood.present ? mood.value : this.mood,
    gratitudeText: gratitudeText.present
        ? gratitudeText.value
        : this.gratitudeText,
    intentionText: intentionText.present
        ? intentionText.value
        : this.intentionText,
    reflectionText: reflectionText.present
        ? reflectionText.value
        : this.reflectionText,
    completedAt: completedAt ?? this.completedAt,
    ritualDate: ritualDate ?? this.ritualDate,
    needsSync: needsSync ?? this.needsSync,
  );
  LocalRitualLogData copyWithCompanion(LocalRitualLogCompanion data) {
    return LocalRitualLogData(
      id: data.id.present ? data.id.value : this.id,
      ritualType: data.ritualType.present
          ? data.ritualType.value
          : this.ritualType,
      mood: data.mood.present ? data.mood.value : this.mood,
      gratitudeText: data.gratitudeText.present
          ? data.gratitudeText.value
          : this.gratitudeText,
      intentionText: data.intentionText.present
          ? data.intentionText.value
          : this.intentionText,
      reflectionText: data.reflectionText.present
          ? data.reflectionText.value
          : this.reflectionText,
      completedAt: data.completedAt.present
          ? data.completedAt.value
          : this.completedAt,
      ritualDate: data.ritualDate.present
          ? data.ritualDate.value
          : this.ritualDate,
      needsSync: data.needsSync.present ? data.needsSync.value : this.needsSync,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalRitualLogData(')
          ..write('id: $id, ')
          ..write('ritualType: $ritualType, ')
          ..write('mood: $mood, ')
          ..write('gratitudeText: $gratitudeText, ')
          ..write('intentionText: $intentionText, ')
          ..write('reflectionText: $reflectionText, ')
          ..write('completedAt: $completedAt, ')
          ..write('ritualDate: $ritualDate, ')
          ..write('needsSync: $needsSync')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    ritualType,
    mood,
    gratitudeText,
    intentionText,
    reflectionText,
    completedAt,
    ritualDate,
    needsSync,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalRitualLogData &&
          other.id == this.id &&
          other.ritualType == this.ritualType &&
          other.mood == this.mood &&
          other.gratitudeText == this.gratitudeText &&
          other.intentionText == this.intentionText &&
          other.reflectionText == this.reflectionText &&
          other.completedAt == this.completedAt &&
          other.ritualDate == this.ritualDate &&
          other.needsSync == this.needsSync);
}

class LocalRitualLogCompanion extends UpdateCompanion<LocalRitualLogData> {
  final Value<String> id;
  final Value<String> ritualType;
  final Value<int?> mood;
  final Value<String?> gratitudeText;
  final Value<String?> intentionText;
  final Value<String?> reflectionText;
  final Value<DateTime> completedAt;
  final Value<DateTime> ritualDate;
  final Value<bool> needsSync;
  final Value<int> rowid;
  const LocalRitualLogCompanion({
    this.id = const Value.absent(),
    this.ritualType = const Value.absent(),
    this.mood = const Value.absent(),
    this.gratitudeText = const Value.absent(),
    this.intentionText = const Value.absent(),
    this.reflectionText = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.ritualDate = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalRitualLogCompanion.insert({
    required String id,
    required String ritualType,
    this.mood = const Value.absent(),
    this.gratitudeText = const Value.absent(),
    this.intentionText = const Value.absent(),
    this.reflectionText = const Value.absent(),
    this.completedAt = const Value.absent(),
    required DateTime ritualDate,
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       ritualType = Value(ritualType),
       ritualDate = Value(ritualDate);
  static Insertable<LocalRitualLogData> custom({
    Expression<String>? id,
    Expression<String>? ritualType,
    Expression<int>? mood,
    Expression<String>? gratitudeText,
    Expression<String>? intentionText,
    Expression<String>? reflectionText,
    Expression<DateTime>? completedAt,
    Expression<DateTime>? ritualDate,
    Expression<bool>? needsSync,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (ritualType != null) 'ritual_type': ritualType,
      if (mood != null) 'mood': mood,
      if (gratitudeText != null) 'gratitude_text': gratitudeText,
      if (intentionText != null) 'intention_text': intentionText,
      if (reflectionText != null) 'reflection_text': reflectionText,
      if (completedAt != null) 'completed_at': completedAt,
      if (ritualDate != null) 'ritual_date': ritualDate,
      if (needsSync != null) 'needs_sync': needsSync,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalRitualLogCompanion copyWith({
    Value<String>? id,
    Value<String>? ritualType,
    Value<int?>? mood,
    Value<String?>? gratitudeText,
    Value<String?>? intentionText,
    Value<String?>? reflectionText,
    Value<DateTime>? completedAt,
    Value<DateTime>? ritualDate,
    Value<bool>? needsSync,
    Value<int>? rowid,
  }) {
    return LocalRitualLogCompanion(
      id: id ?? this.id,
      ritualType: ritualType ?? this.ritualType,
      mood: mood ?? this.mood,
      gratitudeText: gratitudeText ?? this.gratitudeText,
      intentionText: intentionText ?? this.intentionText,
      reflectionText: reflectionText ?? this.reflectionText,
      completedAt: completedAt ?? this.completedAt,
      ritualDate: ritualDate ?? this.ritualDate,
      needsSync: needsSync ?? this.needsSync,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (ritualType.present) {
      map['ritual_type'] = Variable<String>(ritualType.value);
    }
    if (mood.present) {
      map['mood'] = Variable<int>(mood.value);
    }
    if (gratitudeText.present) {
      map['gratitude_text'] = Variable<String>(gratitudeText.value);
    }
    if (intentionText.present) {
      map['intention_text'] = Variable<String>(intentionText.value);
    }
    if (reflectionText.present) {
      map['reflection_text'] = Variable<String>(reflectionText.value);
    }
    if (completedAt.present) {
      map['completed_at'] = Variable<DateTime>(completedAt.value);
    }
    if (ritualDate.present) {
      map['ritual_date'] = Variable<DateTime>(ritualDate.value);
    }
    if (needsSync.present) {
      map['needs_sync'] = Variable<bool>(needsSync.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalRitualLogCompanion(')
          ..write('id: $id, ')
          ..write('ritualType: $ritualType, ')
          ..write('mood: $mood, ')
          ..write('gratitudeText: $gratitudeText, ')
          ..write('intentionText: $intentionText, ')
          ..write('reflectionText: $reflectionText, ')
          ..write('completedAt: $completedAt, ')
          ..write('ritualDate: $ritualDate, ')
          ..write('needsSync: $needsSync, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalProgressSnapshotsTable extends LocalProgressSnapshots
    with TableInfo<$LocalProgressSnapshotsTable, LocalProgressSnapshot> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalProgressSnapshotsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _snapshotDateMeta = const VerificationMeta(
    'snapshotDate',
  );
  @override
  late final GeneratedColumn<DateTime> snapshotDate = GeneratedColumn<DateTime>(
    'snapshot_date',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _tasksCreatedMeta = const VerificationMeta(
    'tasksCreated',
  );
  @override
  late final GeneratedColumn<int> tasksCreated = GeneratedColumn<int>(
    'tasks_created',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _tasksCompletedMeta = const VerificationMeta(
    'tasksCompleted',
  );
  @override
  late final GeneratedColumn<int> tasksCompleted = GeneratedColumn<int>(
    'tasks_completed',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _focusMinutesMeta = const VerificationMeta(
    'focusMinutes',
  );
  @override
  late final GeneratedColumn<int> focusMinutes = GeneratedColumn<int>(
    'focus_minutes',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _habitsDoneMeta = const VerificationMeta(
    'habitsDone',
  );
  @override
  late final GeneratedColumn<int> habitsDone = GeneratedColumn<int>(
    'habits_done',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _pomodorosCompletedMeta =
      const VerificationMeta('pomodorosCompleted');
  @override
  late final GeneratedColumn<int> pomodorosCompleted = GeneratedColumn<int>(
    'pomodoros_completed',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _needsSyncMeta = const VerificationMeta(
    'needsSync',
  );
  @override
  late final GeneratedColumn<bool> needsSync = GeneratedColumn<bool>(
    'needs_sync',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("needs_sync" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    snapshotDate,
    tasksCreated,
    tasksCompleted,
    focusMinutes,
    habitsDone,
    pomodorosCompleted,
    needsSync,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_progress_snapshots';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalProgressSnapshot> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('snapshot_date')) {
      context.handle(
        _snapshotDateMeta,
        snapshotDate.isAcceptableOrUnknown(
          data['snapshot_date']!,
          _snapshotDateMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_snapshotDateMeta);
    }
    if (data.containsKey('tasks_created')) {
      context.handle(
        _tasksCreatedMeta,
        tasksCreated.isAcceptableOrUnknown(
          data['tasks_created']!,
          _tasksCreatedMeta,
        ),
      );
    }
    if (data.containsKey('tasks_completed')) {
      context.handle(
        _tasksCompletedMeta,
        tasksCompleted.isAcceptableOrUnknown(
          data['tasks_completed']!,
          _tasksCompletedMeta,
        ),
      );
    }
    if (data.containsKey('focus_minutes')) {
      context.handle(
        _focusMinutesMeta,
        focusMinutes.isAcceptableOrUnknown(
          data['focus_minutes']!,
          _focusMinutesMeta,
        ),
      );
    }
    if (data.containsKey('habits_done')) {
      context.handle(
        _habitsDoneMeta,
        habitsDone.isAcceptableOrUnknown(data['habits_done']!, _habitsDoneMeta),
      );
    }
    if (data.containsKey('pomodoros_completed')) {
      context.handle(
        _pomodorosCompletedMeta,
        pomodorosCompleted.isAcceptableOrUnknown(
          data['pomodoros_completed']!,
          _pomodorosCompletedMeta,
        ),
      );
    }
    if (data.containsKey('needs_sync')) {
      context.handle(
        _needsSyncMeta,
        needsSync.isAcceptableOrUnknown(data['needs_sync']!, _needsSyncMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalProgressSnapshot map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalProgressSnapshot(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      snapshotDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}snapshot_date'],
      )!,
      tasksCreated: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}tasks_created'],
      )!,
      tasksCompleted: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}tasks_completed'],
      )!,
      focusMinutes: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}focus_minutes'],
      )!,
      habitsDone: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}habits_done'],
      )!,
      pomodorosCompleted: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}pomodoros_completed'],
      )!,
      needsSync: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}needs_sync'],
      )!,
    );
  }

  @override
  $LocalProgressSnapshotsTable createAlias(String alias) {
    return $LocalProgressSnapshotsTable(attachedDatabase, alias);
  }
}

class LocalProgressSnapshot extends DataClass
    implements Insertable<LocalProgressSnapshot> {
  final String id;
  final DateTime snapshotDate;
  final int tasksCreated;
  final int tasksCompleted;
  final int focusMinutes;
  final int habitsDone;
  final int pomodorosCompleted;
  final bool needsSync;
  const LocalProgressSnapshot({
    required this.id,
    required this.snapshotDate,
    required this.tasksCreated,
    required this.tasksCompleted,
    required this.focusMinutes,
    required this.habitsDone,
    required this.pomodorosCompleted,
    required this.needsSync,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['snapshot_date'] = Variable<DateTime>(snapshotDate);
    map['tasks_created'] = Variable<int>(tasksCreated);
    map['tasks_completed'] = Variable<int>(tasksCompleted);
    map['focus_minutes'] = Variable<int>(focusMinutes);
    map['habits_done'] = Variable<int>(habitsDone);
    map['pomodoros_completed'] = Variable<int>(pomodorosCompleted);
    map['needs_sync'] = Variable<bool>(needsSync);
    return map;
  }

  LocalProgressSnapshotsCompanion toCompanion(bool nullToAbsent) {
    return LocalProgressSnapshotsCompanion(
      id: Value(id),
      snapshotDate: Value(snapshotDate),
      tasksCreated: Value(tasksCreated),
      tasksCompleted: Value(tasksCompleted),
      focusMinutes: Value(focusMinutes),
      habitsDone: Value(habitsDone),
      pomodorosCompleted: Value(pomodorosCompleted),
      needsSync: Value(needsSync),
    );
  }

  factory LocalProgressSnapshot.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalProgressSnapshot(
      id: serializer.fromJson<String>(json['id']),
      snapshotDate: serializer.fromJson<DateTime>(json['snapshotDate']),
      tasksCreated: serializer.fromJson<int>(json['tasksCreated']),
      tasksCompleted: serializer.fromJson<int>(json['tasksCompleted']),
      focusMinutes: serializer.fromJson<int>(json['focusMinutes']),
      habitsDone: serializer.fromJson<int>(json['habitsDone']),
      pomodorosCompleted: serializer.fromJson<int>(json['pomodorosCompleted']),
      needsSync: serializer.fromJson<bool>(json['needsSync']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'snapshotDate': serializer.toJson<DateTime>(snapshotDate),
      'tasksCreated': serializer.toJson<int>(tasksCreated),
      'tasksCompleted': serializer.toJson<int>(tasksCompleted),
      'focusMinutes': serializer.toJson<int>(focusMinutes),
      'habitsDone': serializer.toJson<int>(habitsDone),
      'pomodorosCompleted': serializer.toJson<int>(pomodorosCompleted),
      'needsSync': serializer.toJson<bool>(needsSync),
    };
  }

  LocalProgressSnapshot copyWith({
    String? id,
    DateTime? snapshotDate,
    int? tasksCreated,
    int? tasksCompleted,
    int? focusMinutes,
    int? habitsDone,
    int? pomodorosCompleted,
    bool? needsSync,
  }) => LocalProgressSnapshot(
    id: id ?? this.id,
    snapshotDate: snapshotDate ?? this.snapshotDate,
    tasksCreated: tasksCreated ?? this.tasksCreated,
    tasksCompleted: tasksCompleted ?? this.tasksCompleted,
    focusMinutes: focusMinutes ?? this.focusMinutes,
    habitsDone: habitsDone ?? this.habitsDone,
    pomodorosCompleted: pomodorosCompleted ?? this.pomodorosCompleted,
    needsSync: needsSync ?? this.needsSync,
  );
  LocalProgressSnapshot copyWithCompanion(
    LocalProgressSnapshotsCompanion data,
  ) {
    return LocalProgressSnapshot(
      id: data.id.present ? data.id.value : this.id,
      snapshotDate: data.snapshotDate.present
          ? data.snapshotDate.value
          : this.snapshotDate,
      tasksCreated: data.tasksCreated.present
          ? data.tasksCreated.value
          : this.tasksCreated,
      tasksCompleted: data.tasksCompleted.present
          ? data.tasksCompleted.value
          : this.tasksCompleted,
      focusMinutes: data.focusMinutes.present
          ? data.focusMinutes.value
          : this.focusMinutes,
      habitsDone: data.habitsDone.present
          ? data.habitsDone.value
          : this.habitsDone,
      pomodorosCompleted: data.pomodorosCompleted.present
          ? data.pomodorosCompleted.value
          : this.pomodorosCompleted,
      needsSync: data.needsSync.present ? data.needsSync.value : this.needsSync,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalProgressSnapshot(')
          ..write('id: $id, ')
          ..write('snapshotDate: $snapshotDate, ')
          ..write('tasksCreated: $tasksCreated, ')
          ..write('tasksCompleted: $tasksCompleted, ')
          ..write('focusMinutes: $focusMinutes, ')
          ..write('habitsDone: $habitsDone, ')
          ..write('pomodorosCompleted: $pomodorosCompleted, ')
          ..write('needsSync: $needsSync')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    snapshotDate,
    tasksCreated,
    tasksCompleted,
    focusMinutes,
    habitsDone,
    pomodorosCompleted,
    needsSync,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalProgressSnapshot &&
          other.id == this.id &&
          other.snapshotDate == this.snapshotDate &&
          other.tasksCreated == this.tasksCreated &&
          other.tasksCompleted == this.tasksCompleted &&
          other.focusMinutes == this.focusMinutes &&
          other.habitsDone == this.habitsDone &&
          other.pomodorosCompleted == this.pomodorosCompleted &&
          other.needsSync == this.needsSync);
}

class LocalProgressSnapshotsCompanion
    extends UpdateCompanion<LocalProgressSnapshot> {
  final Value<String> id;
  final Value<DateTime> snapshotDate;
  final Value<int> tasksCreated;
  final Value<int> tasksCompleted;
  final Value<int> focusMinutes;
  final Value<int> habitsDone;
  final Value<int> pomodorosCompleted;
  final Value<bool> needsSync;
  final Value<int> rowid;
  const LocalProgressSnapshotsCompanion({
    this.id = const Value.absent(),
    this.snapshotDate = const Value.absent(),
    this.tasksCreated = const Value.absent(),
    this.tasksCompleted = const Value.absent(),
    this.focusMinutes = const Value.absent(),
    this.habitsDone = const Value.absent(),
    this.pomodorosCompleted = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalProgressSnapshotsCompanion.insert({
    required String id,
    required DateTime snapshotDate,
    this.tasksCreated = const Value.absent(),
    this.tasksCompleted = const Value.absent(),
    this.focusMinutes = const Value.absent(),
    this.habitsDone = const Value.absent(),
    this.pomodorosCompleted = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       snapshotDate = Value(snapshotDate);
  static Insertable<LocalProgressSnapshot> custom({
    Expression<String>? id,
    Expression<DateTime>? snapshotDate,
    Expression<int>? tasksCreated,
    Expression<int>? tasksCompleted,
    Expression<int>? focusMinutes,
    Expression<int>? habitsDone,
    Expression<int>? pomodorosCompleted,
    Expression<bool>? needsSync,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (snapshotDate != null) 'snapshot_date': snapshotDate,
      if (tasksCreated != null) 'tasks_created': tasksCreated,
      if (tasksCompleted != null) 'tasks_completed': tasksCompleted,
      if (focusMinutes != null) 'focus_minutes': focusMinutes,
      if (habitsDone != null) 'habits_done': habitsDone,
      if (pomodorosCompleted != null) 'pomodoros_completed': pomodorosCompleted,
      if (needsSync != null) 'needs_sync': needsSync,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalProgressSnapshotsCompanion copyWith({
    Value<String>? id,
    Value<DateTime>? snapshotDate,
    Value<int>? tasksCreated,
    Value<int>? tasksCompleted,
    Value<int>? focusMinutes,
    Value<int>? habitsDone,
    Value<int>? pomodorosCompleted,
    Value<bool>? needsSync,
    Value<int>? rowid,
  }) {
    return LocalProgressSnapshotsCompanion(
      id: id ?? this.id,
      snapshotDate: snapshotDate ?? this.snapshotDate,
      tasksCreated: tasksCreated ?? this.tasksCreated,
      tasksCompleted: tasksCompleted ?? this.tasksCompleted,
      focusMinutes: focusMinutes ?? this.focusMinutes,
      habitsDone: habitsDone ?? this.habitsDone,
      pomodorosCompleted: pomodorosCompleted ?? this.pomodorosCompleted,
      needsSync: needsSync ?? this.needsSync,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (snapshotDate.present) {
      map['snapshot_date'] = Variable<DateTime>(snapshotDate.value);
    }
    if (tasksCreated.present) {
      map['tasks_created'] = Variable<int>(tasksCreated.value);
    }
    if (tasksCompleted.present) {
      map['tasks_completed'] = Variable<int>(tasksCompleted.value);
    }
    if (focusMinutes.present) {
      map['focus_minutes'] = Variable<int>(focusMinutes.value);
    }
    if (habitsDone.present) {
      map['habits_done'] = Variable<int>(habitsDone.value);
    }
    if (pomodorosCompleted.present) {
      map['pomodoros_completed'] = Variable<int>(pomodorosCompleted.value);
    }
    if (needsSync.present) {
      map['needs_sync'] = Variable<bool>(needsSync.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalProgressSnapshotsCompanion(')
          ..write('id: $id, ')
          ..write('snapshotDate: $snapshotDate, ')
          ..write('tasksCreated: $tasksCreated, ')
          ..write('tasksCompleted: $tasksCompleted, ')
          ..write('focusMinutes: $focusMinutes, ')
          ..write('habitsDone: $habitsDone, ')
          ..write('pomodorosCompleted: $pomodorosCompleted, ')
          ..write('needsSync: $needsSync, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalPomodoroSessionsTable extends LocalPomodoroSessions
    with TableInfo<$LocalPomodoroSessionsTable, LocalPomodoroSession> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalPomodoroSessionsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _taskIdMeta = const VerificationMeta('taskId');
  @override
  late final GeneratedColumn<String> taskId = GeneratedColumn<String>(
    'task_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _durationSecondsMeta = const VerificationMeta(
    'durationSeconds',
  );
  @override
  late final GeneratedColumn<int> durationSeconds = GeneratedColumn<int>(
    'duration_seconds',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _focusRatingMeta = const VerificationMeta(
    'focusRating',
  );
  @override
  late final GeneratedColumn<int> focusRating = GeneratedColumn<int>(
    'focus_rating',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _ambientSoundMeta = const VerificationMeta(
    'ambientSound',
  );
  @override
  late final GeneratedColumn<String> ambientSound = GeneratedColumn<String>(
    'ambient_sound',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _startedAtMeta = const VerificationMeta(
    'startedAt',
  );
  @override
  late final GeneratedColumn<DateTime> startedAt = GeneratedColumn<DateTime>(
    'started_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _completedAtMeta = const VerificationMeta(
    'completedAt',
  );
  @override
  late final GeneratedColumn<DateTime> completedAt = GeneratedColumn<DateTime>(
    'completed_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _needsSyncMeta = const VerificationMeta(
    'needsSync',
  );
  @override
  late final GeneratedColumn<bool> needsSync = GeneratedColumn<bool>(
    'needs_sync',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("needs_sync" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    taskId,
    durationSeconds,
    focusRating,
    ambientSound,
    startedAt,
    completedAt,
    needsSync,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_pomodoro_sessions';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalPomodoroSession> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('task_id')) {
      context.handle(
        _taskIdMeta,
        taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta),
      );
    }
    if (data.containsKey('duration_seconds')) {
      context.handle(
        _durationSecondsMeta,
        durationSeconds.isAcceptableOrUnknown(
          data['duration_seconds']!,
          _durationSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_durationSecondsMeta);
    }
    if (data.containsKey('focus_rating')) {
      context.handle(
        _focusRatingMeta,
        focusRating.isAcceptableOrUnknown(
          data['focus_rating']!,
          _focusRatingMeta,
        ),
      );
    }
    if (data.containsKey('ambient_sound')) {
      context.handle(
        _ambientSoundMeta,
        ambientSound.isAcceptableOrUnknown(
          data['ambient_sound']!,
          _ambientSoundMeta,
        ),
      );
    }
    if (data.containsKey('started_at')) {
      context.handle(
        _startedAtMeta,
        startedAt.isAcceptableOrUnknown(data['started_at']!, _startedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_startedAtMeta);
    }
    if (data.containsKey('completed_at')) {
      context.handle(
        _completedAtMeta,
        completedAt.isAcceptableOrUnknown(
          data['completed_at']!,
          _completedAtMeta,
        ),
      );
    }
    if (data.containsKey('needs_sync')) {
      context.handle(
        _needsSyncMeta,
        needsSync.isAcceptableOrUnknown(data['needs_sync']!, _needsSyncMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalPomodoroSession map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalPomodoroSession(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      taskId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}task_id'],
      ),
      durationSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}duration_seconds'],
      )!,
      focusRating: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}focus_rating'],
      ),
      ambientSound: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}ambient_sound'],
      ),
      startedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}started_at'],
      )!,
      completedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}completed_at'],
      ),
      needsSync: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}needs_sync'],
      )!,
    );
  }

  @override
  $LocalPomodoroSessionsTable createAlias(String alias) {
    return $LocalPomodoroSessionsTable(attachedDatabase, alias);
  }
}

class LocalPomodoroSession extends DataClass
    implements Insertable<LocalPomodoroSession> {
  final String id;
  final String? taskId;
  final int durationSeconds;
  final int? focusRating;
  final String? ambientSound;
  final DateTime startedAt;
  final DateTime? completedAt;
  final bool needsSync;
  const LocalPomodoroSession({
    required this.id,
    this.taskId,
    required this.durationSeconds,
    this.focusRating,
    this.ambientSound,
    required this.startedAt,
    this.completedAt,
    required this.needsSync,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    if (!nullToAbsent || taskId != null) {
      map['task_id'] = Variable<String>(taskId);
    }
    map['duration_seconds'] = Variable<int>(durationSeconds);
    if (!nullToAbsent || focusRating != null) {
      map['focus_rating'] = Variable<int>(focusRating);
    }
    if (!nullToAbsent || ambientSound != null) {
      map['ambient_sound'] = Variable<String>(ambientSound);
    }
    map['started_at'] = Variable<DateTime>(startedAt);
    if (!nullToAbsent || completedAt != null) {
      map['completed_at'] = Variable<DateTime>(completedAt);
    }
    map['needs_sync'] = Variable<bool>(needsSync);
    return map;
  }

  LocalPomodoroSessionsCompanion toCompanion(bool nullToAbsent) {
    return LocalPomodoroSessionsCompanion(
      id: Value(id),
      taskId: taskId == null && nullToAbsent
          ? const Value.absent()
          : Value(taskId),
      durationSeconds: Value(durationSeconds),
      focusRating: focusRating == null && nullToAbsent
          ? const Value.absent()
          : Value(focusRating),
      ambientSound: ambientSound == null && nullToAbsent
          ? const Value.absent()
          : Value(ambientSound),
      startedAt: Value(startedAt),
      completedAt: completedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(completedAt),
      needsSync: Value(needsSync),
    );
  }

  factory LocalPomodoroSession.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalPomodoroSession(
      id: serializer.fromJson<String>(json['id']),
      taskId: serializer.fromJson<String?>(json['taskId']),
      durationSeconds: serializer.fromJson<int>(json['durationSeconds']),
      focusRating: serializer.fromJson<int?>(json['focusRating']),
      ambientSound: serializer.fromJson<String?>(json['ambientSound']),
      startedAt: serializer.fromJson<DateTime>(json['startedAt']),
      completedAt: serializer.fromJson<DateTime?>(json['completedAt']),
      needsSync: serializer.fromJson<bool>(json['needsSync']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'taskId': serializer.toJson<String?>(taskId),
      'durationSeconds': serializer.toJson<int>(durationSeconds),
      'focusRating': serializer.toJson<int?>(focusRating),
      'ambientSound': serializer.toJson<String?>(ambientSound),
      'startedAt': serializer.toJson<DateTime>(startedAt),
      'completedAt': serializer.toJson<DateTime?>(completedAt),
      'needsSync': serializer.toJson<bool>(needsSync),
    };
  }

  LocalPomodoroSession copyWith({
    String? id,
    Value<String?> taskId = const Value.absent(),
    int? durationSeconds,
    Value<int?> focusRating = const Value.absent(),
    Value<String?> ambientSound = const Value.absent(),
    DateTime? startedAt,
    Value<DateTime?> completedAt = const Value.absent(),
    bool? needsSync,
  }) => LocalPomodoroSession(
    id: id ?? this.id,
    taskId: taskId.present ? taskId.value : this.taskId,
    durationSeconds: durationSeconds ?? this.durationSeconds,
    focusRating: focusRating.present ? focusRating.value : this.focusRating,
    ambientSound: ambientSound.present ? ambientSound.value : this.ambientSound,
    startedAt: startedAt ?? this.startedAt,
    completedAt: completedAt.present ? completedAt.value : this.completedAt,
    needsSync: needsSync ?? this.needsSync,
  );
  LocalPomodoroSession copyWithCompanion(LocalPomodoroSessionsCompanion data) {
    return LocalPomodoroSession(
      id: data.id.present ? data.id.value : this.id,
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      durationSeconds: data.durationSeconds.present
          ? data.durationSeconds.value
          : this.durationSeconds,
      focusRating: data.focusRating.present
          ? data.focusRating.value
          : this.focusRating,
      ambientSound: data.ambientSound.present
          ? data.ambientSound.value
          : this.ambientSound,
      startedAt: data.startedAt.present ? data.startedAt.value : this.startedAt,
      completedAt: data.completedAt.present
          ? data.completedAt.value
          : this.completedAt,
      needsSync: data.needsSync.present ? data.needsSync.value : this.needsSync,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalPomodoroSession(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('durationSeconds: $durationSeconds, ')
          ..write('focusRating: $focusRating, ')
          ..write('ambientSound: $ambientSound, ')
          ..write('startedAt: $startedAt, ')
          ..write('completedAt: $completedAt, ')
          ..write('needsSync: $needsSync')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    taskId,
    durationSeconds,
    focusRating,
    ambientSound,
    startedAt,
    completedAt,
    needsSync,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalPomodoroSession &&
          other.id == this.id &&
          other.taskId == this.taskId &&
          other.durationSeconds == this.durationSeconds &&
          other.focusRating == this.focusRating &&
          other.ambientSound == this.ambientSound &&
          other.startedAt == this.startedAt &&
          other.completedAt == this.completedAt &&
          other.needsSync == this.needsSync);
}

class LocalPomodoroSessionsCompanion
    extends UpdateCompanion<LocalPomodoroSession> {
  final Value<String> id;
  final Value<String?> taskId;
  final Value<int> durationSeconds;
  final Value<int?> focusRating;
  final Value<String?> ambientSound;
  final Value<DateTime> startedAt;
  final Value<DateTime?> completedAt;
  final Value<bool> needsSync;
  final Value<int> rowid;
  const LocalPomodoroSessionsCompanion({
    this.id = const Value.absent(),
    this.taskId = const Value.absent(),
    this.durationSeconds = const Value.absent(),
    this.focusRating = const Value.absent(),
    this.ambientSound = const Value.absent(),
    this.startedAt = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalPomodoroSessionsCompanion.insert({
    required String id,
    this.taskId = const Value.absent(),
    required int durationSeconds,
    this.focusRating = const Value.absent(),
    this.ambientSound = const Value.absent(),
    required DateTime startedAt,
    this.completedAt = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       durationSeconds = Value(durationSeconds),
       startedAt = Value(startedAt);
  static Insertable<LocalPomodoroSession> custom({
    Expression<String>? id,
    Expression<String>? taskId,
    Expression<int>? durationSeconds,
    Expression<int>? focusRating,
    Expression<String>? ambientSound,
    Expression<DateTime>? startedAt,
    Expression<DateTime>? completedAt,
    Expression<bool>? needsSync,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (taskId != null) 'task_id': taskId,
      if (durationSeconds != null) 'duration_seconds': durationSeconds,
      if (focusRating != null) 'focus_rating': focusRating,
      if (ambientSound != null) 'ambient_sound': ambientSound,
      if (startedAt != null) 'started_at': startedAt,
      if (completedAt != null) 'completed_at': completedAt,
      if (needsSync != null) 'needs_sync': needsSync,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalPomodoroSessionsCompanion copyWith({
    Value<String>? id,
    Value<String?>? taskId,
    Value<int>? durationSeconds,
    Value<int?>? focusRating,
    Value<String?>? ambientSound,
    Value<DateTime>? startedAt,
    Value<DateTime?>? completedAt,
    Value<bool>? needsSync,
    Value<int>? rowid,
  }) {
    return LocalPomodoroSessionsCompanion(
      id: id ?? this.id,
      taskId: taskId ?? this.taskId,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      focusRating: focusRating ?? this.focusRating,
      ambientSound: ambientSound ?? this.ambientSound,
      startedAt: startedAt ?? this.startedAt,
      completedAt: completedAt ?? this.completedAt,
      needsSync: needsSync ?? this.needsSync,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (taskId.present) {
      map['task_id'] = Variable<String>(taskId.value);
    }
    if (durationSeconds.present) {
      map['duration_seconds'] = Variable<int>(durationSeconds.value);
    }
    if (focusRating.present) {
      map['focus_rating'] = Variable<int>(focusRating.value);
    }
    if (ambientSound.present) {
      map['ambient_sound'] = Variable<String>(ambientSound.value);
    }
    if (startedAt.present) {
      map['started_at'] = Variable<DateTime>(startedAt.value);
    }
    if (completedAt.present) {
      map['completed_at'] = Variable<DateTime>(completedAt.value);
    }
    if (needsSync.present) {
      map['needs_sync'] = Variable<bool>(needsSync.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalPomodoroSessionsCompanion(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('durationSeconds: $durationSeconds, ')
          ..write('focusRating: $focusRating, ')
          ..write('ambientSound: $ambientSound, ')
          ..write('startedAt: $startedAt, ')
          ..write('completedAt: $completedAt, ')
          ..write('needsSync: $needsSync, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalGhostModeSessionsTable extends LocalGhostModeSessions
    with TableInfo<$LocalGhostModeSessionsTable, LocalGhostModeSession> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalGhostModeSessionsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _startedAtMeta = const VerificationMeta(
    'startedAt',
  );
  @override
  late final GeneratedColumn<DateTime> startedAt = GeneratedColumn<DateTime>(
    'started_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _endedAtMeta = const VerificationMeta(
    'endedAt',
  );
  @override
  late final GeneratedColumn<DateTime> endedAt = GeneratedColumn<DateTime>(
    'ended_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _tasksCompletedMeta = const VerificationMeta(
    'tasksCompleted',
  );
  @override
  late final GeneratedColumn<int> tasksCompleted = GeneratedColumn<int>(
    'tasks_completed',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _focusMinutesMeta = const VerificationMeta(
    'focusMinutes',
  );
  @override
  late final GeneratedColumn<int> focusMinutes = GeneratedColumn<int>(
    'focus_minutes',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    startedAt,
    endedAt,
    tasksCompleted,
    focusMinutes,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_ghost_mode_sessions';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalGhostModeSession> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('started_at')) {
      context.handle(
        _startedAtMeta,
        startedAt.isAcceptableOrUnknown(data['started_at']!, _startedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_startedAtMeta);
    }
    if (data.containsKey('ended_at')) {
      context.handle(
        _endedAtMeta,
        endedAt.isAcceptableOrUnknown(data['ended_at']!, _endedAtMeta),
      );
    }
    if (data.containsKey('tasks_completed')) {
      context.handle(
        _tasksCompletedMeta,
        tasksCompleted.isAcceptableOrUnknown(
          data['tasks_completed']!,
          _tasksCompletedMeta,
        ),
      );
    }
    if (data.containsKey('focus_minutes')) {
      context.handle(
        _focusMinutesMeta,
        focusMinutes.isAcceptableOrUnknown(
          data['focus_minutes']!,
          _focusMinutesMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalGhostModeSession map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalGhostModeSession(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      startedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}started_at'],
      )!,
      endedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}ended_at'],
      ),
      tasksCompleted: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}tasks_completed'],
      )!,
      focusMinutes: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}focus_minutes'],
      )!,
    );
  }

  @override
  $LocalGhostModeSessionsTable createAlias(String alias) {
    return $LocalGhostModeSessionsTable(attachedDatabase, alias);
  }
}

class LocalGhostModeSession extends DataClass
    implements Insertable<LocalGhostModeSession> {
  final String id;
  final DateTime startedAt;
  final DateTime? endedAt;
  final int tasksCompleted;
  final int focusMinutes;
  const LocalGhostModeSession({
    required this.id,
    required this.startedAt,
    this.endedAt,
    required this.tasksCompleted,
    required this.focusMinutes,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['started_at'] = Variable<DateTime>(startedAt);
    if (!nullToAbsent || endedAt != null) {
      map['ended_at'] = Variable<DateTime>(endedAt);
    }
    map['tasks_completed'] = Variable<int>(tasksCompleted);
    map['focus_minutes'] = Variable<int>(focusMinutes);
    return map;
  }

  LocalGhostModeSessionsCompanion toCompanion(bool nullToAbsent) {
    return LocalGhostModeSessionsCompanion(
      id: Value(id),
      startedAt: Value(startedAt),
      endedAt: endedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(endedAt),
      tasksCompleted: Value(tasksCompleted),
      focusMinutes: Value(focusMinutes),
    );
  }

  factory LocalGhostModeSession.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalGhostModeSession(
      id: serializer.fromJson<String>(json['id']),
      startedAt: serializer.fromJson<DateTime>(json['startedAt']),
      endedAt: serializer.fromJson<DateTime?>(json['endedAt']),
      tasksCompleted: serializer.fromJson<int>(json['tasksCompleted']),
      focusMinutes: serializer.fromJson<int>(json['focusMinutes']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'startedAt': serializer.toJson<DateTime>(startedAt),
      'endedAt': serializer.toJson<DateTime?>(endedAt),
      'tasksCompleted': serializer.toJson<int>(tasksCompleted),
      'focusMinutes': serializer.toJson<int>(focusMinutes),
    };
  }

  LocalGhostModeSession copyWith({
    String? id,
    DateTime? startedAt,
    Value<DateTime?> endedAt = const Value.absent(),
    int? tasksCompleted,
    int? focusMinutes,
  }) => LocalGhostModeSession(
    id: id ?? this.id,
    startedAt: startedAt ?? this.startedAt,
    endedAt: endedAt.present ? endedAt.value : this.endedAt,
    tasksCompleted: tasksCompleted ?? this.tasksCompleted,
    focusMinutes: focusMinutes ?? this.focusMinutes,
  );
  LocalGhostModeSession copyWithCompanion(
    LocalGhostModeSessionsCompanion data,
  ) {
    return LocalGhostModeSession(
      id: data.id.present ? data.id.value : this.id,
      startedAt: data.startedAt.present ? data.startedAt.value : this.startedAt,
      endedAt: data.endedAt.present ? data.endedAt.value : this.endedAt,
      tasksCompleted: data.tasksCompleted.present
          ? data.tasksCompleted.value
          : this.tasksCompleted,
      focusMinutes: data.focusMinutes.present
          ? data.focusMinutes.value
          : this.focusMinutes,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalGhostModeSession(')
          ..write('id: $id, ')
          ..write('startedAt: $startedAt, ')
          ..write('endedAt: $endedAt, ')
          ..write('tasksCompleted: $tasksCompleted, ')
          ..write('focusMinutes: $focusMinutes')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, startedAt, endedAt, tasksCompleted, focusMinutes);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalGhostModeSession &&
          other.id == this.id &&
          other.startedAt == this.startedAt &&
          other.endedAt == this.endedAt &&
          other.tasksCompleted == this.tasksCompleted &&
          other.focusMinutes == this.focusMinutes);
}

class LocalGhostModeSessionsCompanion
    extends UpdateCompanion<LocalGhostModeSession> {
  final Value<String> id;
  final Value<DateTime> startedAt;
  final Value<DateTime?> endedAt;
  final Value<int> tasksCompleted;
  final Value<int> focusMinutes;
  final Value<int> rowid;
  const LocalGhostModeSessionsCompanion({
    this.id = const Value.absent(),
    this.startedAt = const Value.absent(),
    this.endedAt = const Value.absent(),
    this.tasksCompleted = const Value.absent(),
    this.focusMinutes = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalGhostModeSessionsCompanion.insert({
    required String id,
    required DateTime startedAt,
    this.endedAt = const Value.absent(),
    this.tasksCompleted = const Value.absent(),
    this.focusMinutes = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       startedAt = Value(startedAt);
  static Insertable<LocalGhostModeSession> custom({
    Expression<String>? id,
    Expression<DateTime>? startedAt,
    Expression<DateTime>? endedAt,
    Expression<int>? tasksCompleted,
    Expression<int>? focusMinutes,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (startedAt != null) 'started_at': startedAt,
      if (endedAt != null) 'ended_at': endedAt,
      if (tasksCompleted != null) 'tasks_completed': tasksCompleted,
      if (focusMinutes != null) 'focus_minutes': focusMinutes,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalGhostModeSessionsCompanion copyWith({
    Value<String>? id,
    Value<DateTime>? startedAt,
    Value<DateTime?>? endedAt,
    Value<int>? tasksCompleted,
    Value<int>? focusMinutes,
    Value<int>? rowid,
  }) {
    return LocalGhostModeSessionsCompanion(
      id: id ?? this.id,
      startedAt: startedAt ?? this.startedAt,
      endedAt: endedAt ?? this.endedAt,
      tasksCompleted: tasksCompleted ?? this.tasksCompleted,
      focusMinutes: focusMinutes ?? this.focusMinutes,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (startedAt.present) {
      map['started_at'] = Variable<DateTime>(startedAt.value);
    }
    if (endedAt.present) {
      map['ended_at'] = Variable<DateTime>(endedAt.value);
    }
    if (tasksCompleted.present) {
      map['tasks_completed'] = Variable<int>(tasksCompleted.value);
    }
    if (focusMinutes.present) {
      map['focus_minutes'] = Variable<int>(focusMinutes.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalGhostModeSessionsCompanion(')
          ..write('id: $id, ')
          ..write('startedAt: $startedAt, ')
          ..write('endedAt: $endedAt, ')
          ..write('tasksCompleted: $tasksCompleted, ')
          ..write('focusMinutes: $focusMinutes, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalStreaksTable extends LocalStreaks
    with TableInfo<$LocalStreaksTable, LocalStreak> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalStreaksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _currentMeta = const VerificationMeta(
    'current',
  );
  @override
  late final GeneratedColumn<int> current = GeneratedColumn<int>(
    'current',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _longestMeta = const VerificationMeta(
    'longest',
  );
  @override
  late final GeneratedColumn<int> longest = GeneratedColumn<int>(
    'longest',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _lastActiveDateMeta = const VerificationMeta(
    'lastActiveDate',
  );
  @override
  late final GeneratedColumn<DateTime> lastActiveDate =
      GeneratedColumn<DateTime>(
        'last_active_date',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _freezeUsedMeta = const VerificationMeta(
    'freezeUsed',
  );
  @override
  late final GeneratedColumn<int> freezeUsed = GeneratedColumn<int>(
    'freeze_used',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _freezeAvailableMeta = const VerificationMeta(
    'freezeAvailable',
  );
  @override
  late final GeneratedColumn<int> freezeAvailable = GeneratedColumn<int>(
    'freeze_available',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _needsSyncMeta = const VerificationMeta(
    'needsSync',
  );
  @override
  late final GeneratedColumn<bool> needsSync = GeneratedColumn<bool>(
    'needs_sync',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("needs_sync" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    current,
    longest,
    lastActiveDate,
    freezeUsed,
    freezeAvailable,
    needsSync,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_streaks';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalStreak> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('current')) {
      context.handle(
        _currentMeta,
        current.isAcceptableOrUnknown(data['current']!, _currentMeta),
      );
    }
    if (data.containsKey('longest')) {
      context.handle(
        _longestMeta,
        longest.isAcceptableOrUnknown(data['longest']!, _longestMeta),
      );
    }
    if (data.containsKey('last_active_date')) {
      context.handle(
        _lastActiveDateMeta,
        lastActiveDate.isAcceptableOrUnknown(
          data['last_active_date']!,
          _lastActiveDateMeta,
        ),
      );
    }
    if (data.containsKey('freeze_used')) {
      context.handle(
        _freezeUsedMeta,
        freezeUsed.isAcceptableOrUnknown(data['freeze_used']!, _freezeUsedMeta),
      );
    }
    if (data.containsKey('freeze_available')) {
      context.handle(
        _freezeAvailableMeta,
        freezeAvailable.isAcceptableOrUnknown(
          data['freeze_available']!,
          _freezeAvailableMeta,
        ),
      );
    }
    if (data.containsKey('needs_sync')) {
      context.handle(
        _needsSyncMeta,
        needsSync.isAcceptableOrUnknown(data['needs_sync']!, _needsSyncMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalStreak map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalStreak(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      current: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}current'],
      )!,
      longest: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}longest'],
      )!,
      lastActiveDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_active_date'],
      ),
      freezeUsed: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}freeze_used'],
      )!,
      freezeAvailable: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}freeze_available'],
      )!,
      needsSync: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}needs_sync'],
      )!,
    );
  }

  @override
  $LocalStreaksTable createAlias(String alias) {
    return $LocalStreaksTable(attachedDatabase, alias);
  }
}

class LocalStreak extends DataClass implements Insertable<LocalStreak> {
  final String id;
  final int current;
  final int longest;
  final DateTime? lastActiveDate;
  final int freezeUsed;
  final int freezeAvailable;
  final bool needsSync;
  const LocalStreak({
    required this.id,
    required this.current,
    required this.longest,
    this.lastActiveDate,
    required this.freezeUsed,
    required this.freezeAvailable,
    required this.needsSync,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['current'] = Variable<int>(current);
    map['longest'] = Variable<int>(longest);
    if (!nullToAbsent || lastActiveDate != null) {
      map['last_active_date'] = Variable<DateTime>(lastActiveDate);
    }
    map['freeze_used'] = Variable<int>(freezeUsed);
    map['freeze_available'] = Variable<int>(freezeAvailable);
    map['needs_sync'] = Variable<bool>(needsSync);
    return map;
  }

  LocalStreaksCompanion toCompanion(bool nullToAbsent) {
    return LocalStreaksCompanion(
      id: Value(id),
      current: Value(current),
      longest: Value(longest),
      lastActiveDate: lastActiveDate == null && nullToAbsent
          ? const Value.absent()
          : Value(lastActiveDate),
      freezeUsed: Value(freezeUsed),
      freezeAvailable: Value(freezeAvailable),
      needsSync: Value(needsSync),
    );
  }

  factory LocalStreak.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalStreak(
      id: serializer.fromJson<String>(json['id']),
      current: serializer.fromJson<int>(json['current']),
      longest: serializer.fromJson<int>(json['longest']),
      lastActiveDate: serializer.fromJson<DateTime?>(json['lastActiveDate']),
      freezeUsed: serializer.fromJson<int>(json['freezeUsed']),
      freezeAvailable: serializer.fromJson<int>(json['freezeAvailable']),
      needsSync: serializer.fromJson<bool>(json['needsSync']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'current': serializer.toJson<int>(current),
      'longest': serializer.toJson<int>(longest),
      'lastActiveDate': serializer.toJson<DateTime?>(lastActiveDate),
      'freezeUsed': serializer.toJson<int>(freezeUsed),
      'freezeAvailable': serializer.toJson<int>(freezeAvailable),
      'needsSync': serializer.toJson<bool>(needsSync),
    };
  }

  LocalStreak copyWith({
    String? id,
    int? current,
    int? longest,
    Value<DateTime?> lastActiveDate = const Value.absent(),
    int? freezeUsed,
    int? freezeAvailable,
    bool? needsSync,
  }) => LocalStreak(
    id: id ?? this.id,
    current: current ?? this.current,
    longest: longest ?? this.longest,
    lastActiveDate: lastActiveDate.present
        ? lastActiveDate.value
        : this.lastActiveDate,
    freezeUsed: freezeUsed ?? this.freezeUsed,
    freezeAvailable: freezeAvailable ?? this.freezeAvailable,
    needsSync: needsSync ?? this.needsSync,
  );
  LocalStreak copyWithCompanion(LocalStreaksCompanion data) {
    return LocalStreak(
      id: data.id.present ? data.id.value : this.id,
      current: data.current.present ? data.current.value : this.current,
      longest: data.longest.present ? data.longest.value : this.longest,
      lastActiveDate: data.lastActiveDate.present
          ? data.lastActiveDate.value
          : this.lastActiveDate,
      freezeUsed: data.freezeUsed.present
          ? data.freezeUsed.value
          : this.freezeUsed,
      freezeAvailable: data.freezeAvailable.present
          ? data.freezeAvailable.value
          : this.freezeAvailable,
      needsSync: data.needsSync.present ? data.needsSync.value : this.needsSync,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalStreak(')
          ..write('id: $id, ')
          ..write('current: $current, ')
          ..write('longest: $longest, ')
          ..write('lastActiveDate: $lastActiveDate, ')
          ..write('freezeUsed: $freezeUsed, ')
          ..write('freezeAvailable: $freezeAvailable, ')
          ..write('needsSync: $needsSync')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    current,
    longest,
    lastActiveDate,
    freezeUsed,
    freezeAvailable,
    needsSync,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalStreak &&
          other.id == this.id &&
          other.current == this.current &&
          other.longest == this.longest &&
          other.lastActiveDate == this.lastActiveDate &&
          other.freezeUsed == this.freezeUsed &&
          other.freezeAvailable == this.freezeAvailable &&
          other.needsSync == this.needsSync);
}

class LocalStreaksCompanion extends UpdateCompanion<LocalStreak> {
  final Value<String> id;
  final Value<int> current;
  final Value<int> longest;
  final Value<DateTime?> lastActiveDate;
  final Value<int> freezeUsed;
  final Value<int> freezeAvailable;
  final Value<bool> needsSync;
  final Value<int> rowid;
  const LocalStreaksCompanion({
    this.id = const Value.absent(),
    this.current = const Value.absent(),
    this.longest = const Value.absent(),
    this.lastActiveDate = const Value.absent(),
    this.freezeUsed = const Value.absent(),
    this.freezeAvailable = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalStreaksCompanion.insert({
    required String id,
    this.current = const Value.absent(),
    this.longest = const Value.absent(),
    this.lastActiveDate = const Value.absent(),
    this.freezeUsed = const Value.absent(),
    this.freezeAvailable = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id);
  static Insertable<LocalStreak> custom({
    Expression<String>? id,
    Expression<int>? current,
    Expression<int>? longest,
    Expression<DateTime>? lastActiveDate,
    Expression<int>? freezeUsed,
    Expression<int>? freezeAvailable,
    Expression<bool>? needsSync,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (current != null) 'current': current,
      if (longest != null) 'longest': longest,
      if (lastActiveDate != null) 'last_active_date': lastActiveDate,
      if (freezeUsed != null) 'freeze_used': freezeUsed,
      if (freezeAvailable != null) 'freeze_available': freezeAvailable,
      if (needsSync != null) 'needs_sync': needsSync,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalStreaksCompanion copyWith({
    Value<String>? id,
    Value<int>? current,
    Value<int>? longest,
    Value<DateTime?>? lastActiveDate,
    Value<int>? freezeUsed,
    Value<int>? freezeAvailable,
    Value<bool>? needsSync,
    Value<int>? rowid,
  }) {
    return LocalStreaksCompanion(
      id: id ?? this.id,
      current: current ?? this.current,
      longest: longest ?? this.longest,
      lastActiveDate: lastActiveDate ?? this.lastActiveDate,
      freezeUsed: freezeUsed ?? this.freezeUsed,
      freezeAvailable: freezeAvailable ?? this.freezeAvailable,
      needsSync: needsSync ?? this.needsSync,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (current.present) {
      map['current'] = Variable<int>(current.value);
    }
    if (longest.present) {
      map['longest'] = Variable<int>(longest.value);
    }
    if (lastActiveDate.present) {
      map['last_active_date'] = Variable<DateTime>(lastActiveDate.value);
    }
    if (freezeUsed.present) {
      map['freeze_used'] = Variable<int>(freezeUsed.value);
    }
    if (freezeAvailable.present) {
      map['freeze_available'] = Variable<int>(freezeAvailable.value);
    }
    if (needsSync.present) {
      map['needs_sync'] = Variable<bool>(needsSync.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalStreaksCompanion(')
          ..write('id: $id, ')
          ..write('current: $current, ')
          ..write('longest: $longest, ')
          ..write('lastActiveDate: $lastActiveDate, ')
          ..write('freezeUsed: $freezeUsed, ')
          ..write('freezeAvailable: $freezeAvailable, ')
          ..write('needsSync: $needsSync, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalPersonalBestsTable extends LocalPersonalBests
    with TableInfo<$LocalPersonalBestsTable, LocalPersonalBest> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalPersonalBestsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _metricKeyMeta = const VerificationMeta(
    'metricKey',
  );
  @override
  late final GeneratedColumn<String> metricKey = GeneratedColumn<String>(
    'metric_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<int> value = GeneratedColumn<int>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _detailMeta = const VerificationMeta('detail');
  @override
  late final GeneratedColumn<String> detail = GeneratedColumn<String>(
    'detail',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _achievedAtMeta = const VerificationMeta(
    'achievedAt',
  );
  @override
  late final GeneratedColumn<DateTime> achievedAt = GeneratedColumn<DateTime>(
    'achieved_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    metricKey,
    value,
    detail,
    achievedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_personal_bests';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalPersonalBest> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('metric_key')) {
      context.handle(
        _metricKeyMeta,
        metricKey.isAcceptableOrUnknown(data['metric_key']!, _metricKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_metricKeyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    if (data.containsKey('detail')) {
      context.handle(
        _detailMeta,
        detail.isAcceptableOrUnknown(data['detail']!, _detailMeta),
      );
    }
    if (data.containsKey('achieved_at')) {
      context.handle(
        _achievedAtMeta,
        achievedAt.isAcceptableOrUnknown(data['achieved_at']!, _achievedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalPersonalBest map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalPersonalBest(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      metricKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}metric_key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}value'],
      )!,
      detail: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}detail'],
      ),
      achievedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}achieved_at'],
      )!,
    );
  }

  @override
  $LocalPersonalBestsTable createAlias(String alias) {
    return $LocalPersonalBestsTable(attachedDatabase, alias);
  }
}

class LocalPersonalBest extends DataClass
    implements Insertable<LocalPersonalBest> {
  final String id;

  /// e.g. 'most_tasks_day', 'longest_streak', 'fastest_project'
  final String metricKey;
  final int value;
  final String? detail;
  final DateTime achievedAt;
  const LocalPersonalBest({
    required this.id,
    required this.metricKey,
    required this.value,
    this.detail,
    required this.achievedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['metric_key'] = Variable<String>(metricKey);
    map['value'] = Variable<int>(value);
    if (!nullToAbsent || detail != null) {
      map['detail'] = Variable<String>(detail);
    }
    map['achieved_at'] = Variable<DateTime>(achievedAt);
    return map;
  }

  LocalPersonalBestsCompanion toCompanion(bool nullToAbsent) {
    return LocalPersonalBestsCompanion(
      id: Value(id),
      metricKey: Value(metricKey),
      value: Value(value),
      detail: detail == null && nullToAbsent
          ? const Value.absent()
          : Value(detail),
      achievedAt: Value(achievedAt),
    );
  }

  factory LocalPersonalBest.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalPersonalBest(
      id: serializer.fromJson<String>(json['id']),
      metricKey: serializer.fromJson<String>(json['metricKey']),
      value: serializer.fromJson<int>(json['value']),
      detail: serializer.fromJson<String?>(json['detail']),
      achievedAt: serializer.fromJson<DateTime>(json['achievedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'metricKey': serializer.toJson<String>(metricKey),
      'value': serializer.toJson<int>(value),
      'detail': serializer.toJson<String?>(detail),
      'achievedAt': serializer.toJson<DateTime>(achievedAt),
    };
  }

  LocalPersonalBest copyWith({
    String? id,
    String? metricKey,
    int? value,
    Value<String?> detail = const Value.absent(),
    DateTime? achievedAt,
  }) => LocalPersonalBest(
    id: id ?? this.id,
    metricKey: metricKey ?? this.metricKey,
    value: value ?? this.value,
    detail: detail.present ? detail.value : this.detail,
    achievedAt: achievedAt ?? this.achievedAt,
  );
  LocalPersonalBest copyWithCompanion(LocalPersonalBestsCompanion data) {
    return LocalPersonalBest(
      id: data.id.present ? data.id.value : this.id,
      metricKey: data.metricKey.present ? data.metricKey.value : this.metricKey,
      value: data.value.present ? data.value.value : this.value,
      detail: data.detail.present ? data.detail.value : this.detail,
      achievedAt: data.achievedAt.present
          ? data.achievedAt.value
          : this.achievedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalPersonalBest(')
          ..write('id: $id, ')
          ..write('metricKey: $metricKey, ')
          ..write('value: $value, ')
          ..write('detail: $detail, ')
          ..write('achievedAt: $achievedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, metricKey, value, detail, achievedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalPersonalBest &&
          other.id == this.id &&
          other.metricKey == this.metricKey &&
          other.value == this.value &&
          other.detail == this.detail &&
          other.achievedAt == this.achievedAt);
}

class LocalPersonalBestsCompanion extends UpdateCompanion<LocalPersonalBest> {
  final Value<String> id;
  final Value<String> metricKey;
  final Value<int> value;
  final Value<String?> detail;
  final Value<DateTime> achievedAt;
  final Value<int> rowid;
  const LocalPersonalBestsCompanion({
    this.id = const Value.absent(),
    this.metricKey = const Value.absent(),
    this.value = const Value.absent(),
    this.detail = const Value.absent(),
    this.achievedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalPersonalBestsCompanion.insert({
    required String id,
    required String metricKey,
    required int value,
    this.detail = const Value.absent(),
    this.achievedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       metricKey = Value(metricKey),
       value = Value(value);
  static Insertable<LocalPersonalBest> custom({
    Expression<String>? id,
    Expression<String>? metricKey,
    Expression<int>? value,
    Expression<String>? detail,
    Expression<DateTime>? achievedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (metricKey != null) 'metric_key': metricKey,
      if (value != null) 'value': value,
      if (detail != null) 'detail': detail,
      if (achievedAt != null) 'achieved_at': achievedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalPersonalBestsCompanion copyWith({
    Value<String>? id,
    Value<String>? metricKey,
    Value<int>? value,
    Value<String?>? detail,
    Value<DateTime>? achievedAt,
    Value<int>? rowid,
  }) {
    return LocalPersonalBestsCompanion(
      id: id ?? this.id,
      metricKey: metricKey ?? this.metricKey,
      value: value ?? this.value,
      detail: detail ?? this.detail,
      achievedAt: achievedAt ?? this.achievedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (metricKey.present) {
      map['metric_key'] = Variable<String>(metricKey.value);
    }
    if (value.present) {
      map['value'] = Variable<int>(value.value);
    }
    if (detail.present) {
      map['detail'] = Variable<String>(detail.value);
    }
    if (achievedAt.present) {
      map['achieved_at'] = Variable<DateTime>(achievedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalPersonalBestsCompanion(')
          ..write('id: $id, ')
          ..write('metricKey: $metricKey, ')
          ..write('value: $value, ')
          ..write('detail: $detail, ')
          ..write('achievedAt: $achievedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalTaskTemplatesTable extends LocalTaskTemplates
    with TableInfo<$LocalTaskTemplatesTable, LocalTaskTemplate> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalTaskTemplatesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    additionalChecks: GeneratedColumn.checkTextLength(
      minTextLength: 1,
      maxTextLength: 200,
    ),
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _descriptionMeta = const VerificationMeta(
    'description',
  );
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
    'description',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _fieldsJsonMeta = const VerificationMeta(
    'fieldsJson',
  );
  @override
  late final GeneratedColumn<String> fieldsJson = GeneratedColumn<String>(
    'fields_json',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _subtasksJsonMeta = const VerificationMeta(
    'subtasksJson',
  );
  @override
  late final GeneratedColumn<String> subtasksJson = GeneratedColumn<String>(
    'subtasks_json',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _categoryMeta = const VerificationMeta(
    'category',
  );
  @override
  late final GeneratedColumn<String> category = GeneratedColumn<String>(
    'category',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('personal'),
  );
  static const VerificationMeta _isSystemMeta = const VerificationMeta(
    'isSystem',
  );
  @override
  late final GeneratedColumn<bool> isSystem = GeneratedColumn<bool>(
    'is_system',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_system" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
    'user_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _industryModeMeta = const VerificationMeta(
    'industryMode',
  );
  @override
  late final GeneratedColumn<String> industryMode = GeneratedColumn<String>(
    'industry_mode',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    description,
    fieldsJson,
    subtasksJson,
    category,
    isSystem,
    userId,
    industryMode,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_task_templates';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalTaskTemplate> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
        _descriptionMeta,
        description.isAcceptableOrUnknown(
          data['description']!,
          _descriptionMeta,
        ),
      );
    }
    if (data.containsKey('fields_json')) {
      context.handle(
        _fieldsJsonMeta,
        fieldsJson.isAcceptableOrUnknown(data['fields_json']!, _fieldsJsonMeta),
      );
    }
    if (data.containsKey('subtasks_json')) {
      context.handle(
        _subtasksJsonMeta,
        subtasksJson.isAcceptableOrUnknown(
          data['subtasks_json']!,
          _subtasksJsonMeta,
        ),
      );
    }
    if (data.containsKey('category')) {
      context.handle(
        _categoryMeta,
        category.isAcceptableOrUnknown(data['category']!, _categoryMeta),
      );
    }
    if (data.containsKey('is_system')) {
      context.handle(
        _isSystemMeta,
        isSystem.isAcceptableOrUnknown(data['is_system']!, _isSystemMeta),
      );
    }
    if (data.containsKey('user_id')) {
      context.handle(
        _userIdMeta,
        userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta),
      );
    }
    if (data.containsKey('industry_mode')) {
      context.handle(
        _industryModeMeta,
        industryMode.isAcceptableOrUnknown(
          data['industry_mode']!,
          _industryModeMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalTaskTemplate map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalTaskTemplate(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      description: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}description'],
      ),
      fieldsJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}fields_json'],
      ),
      subtasksJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}subtasks_json'],
      ),
      category: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}category'],
      )!,
      isSystem: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_system'],
      )!,
      userId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_id'],
      ),
      industryMode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}industry_mode'],
      ),
    );
  }

  @override
  $LocalTaskTemplatesTable createAlias(String alias) {
    return $LocalTaskTemplatesTable(attachedDatabase, alias);
  }
}

class LocalTaskTemplate extends DataClass
    implements Insertable<LocalTaskTemplate> {
  final String id;
  final String name;
  final String? description;

  /// JSON: default field values (priority, tags, etc.)
  final String? fieldsJson;

  /// JSON: list of subtask titles
  final String? subtasksJson;
  final String category;
  final bool isSystem;

  /// null = system template, non-null = user-created
  final String? userId;
  final String? industryMode;
  const LocalTaskTemplate({
    required this.id,
    required this.name,
    this.description,
    this.fieldsJson,
    this.subtasksJson,
    required this.category,
    required this.isSystem,
    this.userId,
    this.industryMode,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || description != null) {
      map['description'] = Variable<String>(description);
    }
    if (!nullToAbsent || fieldsJson != null) {
      map['fields_json'] = Variable<String>(fieldsJson);
    }
    if (!nullToAbsent || subtasksJson != null) {
      map['subtasks_json'] = Variable<String>(subtasksJson);
    }
    map['category'] = Variable<String>(category);
    map['is_system'] = Variable<bool>(isSystem);
    if (!nullToAbsent || userId != null) {
      map['user_id'] = Variable<String>(userId);
    }
    if (!nullToAbsent || industryMode != null) {
      map['industry_mode'] = Variable<String>(industryMode);
    }
    return map;
  }

  LocalTaskTemplatesCompanion toCompanion(bool nullToAbsent) {
    return LocalTaskTemplatesCompanion(
      id: Value(id),
      name: Value(name),
      description: description == null && nullToAbsent
          ? const Value.absent()
          : Value(description),
      fieldsJson: fieldsJson == null && nullToAbsent
          ? const Value.absent()
          : Value(fieldsJson),
      subtasksJson: subtasksJson == null && nullToAbsent
          ? const Value.absent()
          : Value(subtasksJson),
      category: Value(category),
      isSystem: Value(isSystem),
      userId: userId == null && nullToAbsent
          ? const Value.absent()
          : Value(userId),
      industryMode: industryMode == null && nullToAbsent
          ? const Value.absent()
          : Value(industryMode),
    );
  }

  factory LocalTaskTemplate.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalTaskTemplate(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      description: serializer.fromJson<String?>(json['description']),
      fieldsJson: serializer.fromJson<String?>(json['fieldsJson']),
      subtasksJson: serializer.fromJson<String?>(json['subtasksJson']),
      category: serializer.fromJson<String>(json['category']),
      isSystem: serializer.fromJson<bool>(json['isSystem']),
      userId: serializer.fromJson<String?>(json['userId']),
      industryMode: serializer.fromJson<String?>(json['industryMode']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'description': serializer.toJson<String?>(description),
      'fieldsJson': serializer.toJson<String?>(fieldsJson),
      'subtasksJson': serializer.toJson<String?>(subtasksJson),
      'category': serializer.toJson<String>(category),
      'isSystem': serializer.toJson<bool>(isSystem),
      'userId': serializer.toJson<String?>(userId),
      'industryMode': serializer.toJson<String?>(industryMode),
    };
  }

  LocalTaskTemplate copyWith({
    String? id,
    String? name,
    Value<String?> description = const Value.absent(),
    Value<String?> fieldsJson = const Value.absent(),
    Value<String?> subtasksJson = const Value.absent(),
    String? category,
    bool? isSystem,
    Value<String?> userId = const Value.absent(),
    Value<String?> industryMode = const Value.absent(),
  }) => LocalTaskTemplate(
    id: id ?? this.id,
    name: name ?? this.name,
    description: description.present ? description.value : this.description,
    fieldsJson: fieldsJson.present ? fieldsJson.value : this.fieldsJson,
    subtasksJson: subtasksJson.present ? subtasksJson.value : this.subtasksJson,
    category: category ?? this.category,
    isSystem: isSystem ?? this.isSystem,
    userId: userId.present ? userId.value : this.userId,
    industryMode: industryMode.present ? industryMode.value : this.industryMode,
  );
  LocalTaskTemplate copyWithCompanion(LocalTaskTemplatesCompanion data) {
    return LocalTaskTemplate(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      description: data.description.present
          ? data.description.value
          : this.description,
      fieldsJson: data.fieldsJson.present
          ? data.fieldsJson.value
          : this.fieldsJson,
      subtasksJson: data.subtasksJson.present
          ? data.subtasksJson.value
          : this.subtasksJson,
      category: data.category.present ? data.category.value : this.category,
      isSystem: data.isSystem.present ? data.isSystem.value : this.isSystem,
      userId: data.userId.present ? data.userId.value : this.userId,
      industryMode: data.industryMode.present
          ? data.industryMode.value
          : this.industryMode,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalTaskTemplate(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('description: $description, ')
          ..write('fieldsJson: $fieldsJson, ')
          ..write('subtasksJson: $subtasksJson, ')
          ..write('category: $category, ')
          ..write('isSystem: $isSystem, ')
          ..write('userId: $userId, ')
          ..write('industryMode: $industryMode')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    description,
    fieldsJson,
    subtasksJson,
    category,
    isSystem,
    userId,
    industryMode,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalTaskTemplate &&
          other.id == this.id &&
          other.name == this.name &&
          other.description == this.description &&
          other.fieldsJson == this.fieldsJson &&
          other.subtasksJson == this.subtasksJson &&
          other.category == this.category &&
          other.isSystem == this.isSystem &&
          other.userId == this.userId &&
          other.industryMode == this.industryMode);
}

class LocalTaskTemplatesCompanion extends UpdateCompanion<LocalTaskTemplate> {
  final Value<String> id;
  final Value<String> name;
  final Value<String?> description;
  final Value<String?> fieldsJson;
  final Value<String?> subtasksJson;
  final Value<String> category;
  final Value<bool> isSystem;
  final Value<String?> userId;
  final Value<String?> industryMode;
  final Value<int> rowid;
  const LocalTaskTemplatesCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.description = const Value.absent(),
    this.fieldsJson = const Value.absent(),
    this.subtasksJson = const Value.absent(),
    this.category = const Value.absent(),
    this.isSystem = const Value.absent(),
    this.userId = const Value.absent(),
    this.industryMode = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalTaskTemplatesCompanion.insert({
    required String id,
    required String name,
    this.description = const Value.absent(),
    this.fieldsJson = const Value.absent(),
    this.subtasksJson = const Value.absent(),
    this.category = const Value.absent(),
    this.isSystem = const Value.absent(),
    this.userId = const Value.absent(),
    this.industryMode = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       name = Value(name);
  static Insertable<LocalTaskTemplate> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? description,
    Expression<String>? fieldsJson,
    Expression<String>? subtasksJson,
    Expression<String>? category,
    Expression<bool>? isSystem,
    Expression<String>? userId,
    Expression<String>? industryMode,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (fieldsJson != null) 'fields_json': fieldsJson,
      if (subtasksJson != null) 'subtasks_json': subtasksJson,
      if (category != null) 'category': category,
      if (isSystem != null) 'is_system': isSystem,
      if (userId != null) 'user_id': userId,
      if (industryMode != null) 'industry_mode': industryMode,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalTaskTemplatesCompanion copyWith({
    Value<String>? id,
    Value<String>? name,
    Value<String?>? description,
    Value<String?>? fieldsJson,
    Value<String?>? subtasksJson,
    Value<String>? category,
    Value<bool>? isSystem,
    Value<String?>? userId,
    Value<String?>? industryMode,
    Value<int>? rowid,
  }) {
    return LocalTaskTemplatesCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      fieldsJson: fieldsJson ?? this.fieldsJson,
      subtasksJson: subtasksJson ?? this.subtasksJson,
      category: category ?? this.category,
      isSystem: isSystem ?? this.isSystem,
      userId: userId ?? this.userId,
      industryMode: industryMode ?? this.industryMode,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (fieldsJson.present) {
      map['fields_json'] = Variable<String>(fieldsJson.value);
    }
    if (subtasksJson.present) {
      map['subtasks_json'] = Variable<String>(subtasksJson.value);
    }
    if (category.present) {
      map['category'] = Variable<String>(category.value);
    }
    if (isSystem.present) {
      map['is_system'] = Variable<bool>(isSystem.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (industryMode.present) {
      map['industry_mode'] = Variable<String>(industryMode.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalTaskTemplatesCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('description: $description, ')
          ..write('fieldsJson: $fieldsJson, ')
          ..write('subtasksJson: $subtasksJson, ')
          ..write('category: $category, ')
          ..write('isSystem: $isSystem, ')
          ..write('userId: $userId, ')
          ..write('industryMode: $industryMode, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalRecurringRulesTable extends LocalRecurringRules
    with TableInfo<$LocalRecurringRulesTable, LocalRecurringRule> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalRecurringRulesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _taskIdMeta = const VerificationMeta('taskId');
  @override
  late final GeneratedColumn<String> taskId = GeneratedColumn<String>(
    'task_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _rruleStrMeta = const VerificationMeta(
    'rruleStr',
  );
  @override
  late final GeneratedColumn<String> rruleStr = GeneratedColumn<String>(
    'rrule_str',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nextAtMeta = const VerificationMeta('nextAt');
  @override
  late final GeneratedColumn<DateTime> nextAt = GeneratedColumn<DateTime>(
    'next_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastGeneratedAtMeta = const VerificationMeta(
    'lastGeneratedAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastGeneratedAt =
      GeneratedColumn<DateTime>(
        'last_generated_at',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    taskId,
    rruleStr,
    nextAt,
    lastGeneratedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_recurring_rules';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalRecurringRule> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('task_id')) {
      context.handle(
        _taskIdMeta,
        taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta),
      );
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('rrule_str')) {
      context.handle(
        _rruleStrMeta,
        rruleStr.isAcceptableOrUnknown(data['rrule_str']!, _rruleStrMeta),
      );
    } else if (isInserting) {
      context.missing(_rruleStrMeta);
    }
    if (data.containsKey('next_at')) {
      context.handle(
        _nextAtMeta,
        nextAt.isAcceptableOrUnknown(data['next_at']!, _nextAtMeta),
      );
    }
    if (data.containsKey('last_generated_at')) {
      context.handle(
        _lastGeneratedAtMeta,
        lastGeneratedAt.isAcceptableOrUnknown(
          data['last_generated_at']!,
          _lastGeneratedAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalRecurringRule map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalRecurringRule(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      taskId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}task_id'],
      )!,
      rruleStr: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}rrule_str'],
      )!,
      nextAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}next_at'],
      ),
      lastGeneratedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_generated_at'],
      ),
    );
  }

  @override
  $LocalRecurringRulesTable createAlias(String alias) {
    return $LocalRecurringRulesTable(attachedDatabase, alias);
  }
}

class LocalRecurringRule extends DataClass
    implements Insertable<LocalRecurringRule> {
  final String id;
  final String taskId;
  final String rruleStr;
  final DateTime? nextAt;
  final DateTime? lastGeneratedAt;
  const LocalRecurringRule({
    required this.id,
    required this.taskId,
    required this.rruleStr,
    this.nextAt,
    this.lastGeneratedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['task_id'] = Variable<String>(taskId);
    map['rrule_str'] = Variable<String>(rruleStr);
    if (!nullToAbsent || nextAt != null) {
      map['next_at'] = Variable<DateTime>(nextAt);
    }
    if (!nullToAbsent || lastGeneratedAt != null) {
      map['last_generated_at'] = Variable<DateTime>(lastGeneratedAt);
    }
    return map;
  }

  LocalRecurringRulesCompanion toCompanion(bool nullToAbsent) {
    return LocalRecurringRulesCompanion(
      id: Value(id),
      taskId: Value(taskId),
      rruleStr: Value(rruleStr),
      nextAt: nextAt == null && nullToAbsent
          ? const Value.absent()
          : Value(nextAt),
      lastGeneratedAt: lastGeneratedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastGeneratedAt),
    );
  }

  factory LocalRecurringRule.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalRecurringRule(
      id: serializer.fromJson<String>(json['id']),
      taskId: serializer.fromJson<String>(json['taskId']),
      rruleStr: serializer.fromJson<String>(json['rruleStr']),
      nextAt: serializer.fromJson<DateTime?>(json['nextAt']),
      lastGeneratedAt: serializer.fromJson<DateTime?>(json['lastGeneratedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'taskId': serializer.toJson<String>(taskId),
      'rruleStr': serializer.toJson<String>(rruleStr),
      'nextAt': serializer.toJson<DateTime?>(nextAt),
      'lastGeneratedAt': serializer.toJson<DateTime?>(lastGeneratedAt),
    };
  }

  LocalRecurringRule copyWith({
    String? id,
    String? taskId,
    String? rruleStr,
    Value<DateTime?> nextAt = const Value.absent(),
    Value<DateTime?> lastGeneratedAt = const Value.absent(),
  }) => LocalRecurringRule(
    id: id ?? this.id,
    taskId: taskId ?? this.taskId,
    rruleStr: rruleStr ?? this.rruleStr,
    nextAt: nextAt.present ? nextAt.value : this.nextAt,
    lastGeneratedAt: lastGeneratedAt.present
        ? lastGeneratedAt.value
        : this.lastGeneratedAt,
  );
  LocalRecurringRule copyWithCompanion(LocalRecurringRulesCompanion data) {
    return LocalRecurringRule(
      id: data.id.present ? data.id.value : this.id,
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      rruleStr: data.rruleStr.present ? data.rruleStr.value : this.rruleStr,
      nextAt: data.nextAt.present ? data.nextAt.value : this.nextAt,
      lastGeneratedAt: data.lastGeneratedAt.present
          ? data.lastGeneratedAt.value
          : this.lastGeneratedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalRecurringRule(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('rruleStr: $rruleStr, ')
          ..write('nextAt: $nextAt, ')
          ..write('lastGeneratedAt: $lastGeneratedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, taskId, rruleStr, nextAt, lastGeneratedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalRecurringRule &&
          other.id == this.id &&
          other.taskId == this.taskId &&
          other.rruleStr == this.rruleStr &&
          other.nextAt == this.nextAt &&
          other.lastGeneratedAt == this.lastGeneratedAt);
}

class LocalRecurringRulesCompanion extends UpdateCompanion<LocalRecurringRule> {
  final Value<String> id;
  final Value<String> taskId;
  final Value<String> rruleStr;
  final Value<DateTime?> nextAt;
  final Value<DateTime?> lastGeneratedAt;
  final Value<int> rowid;
  const LocalRecurringRulesCompanion({
    this.id = const Value.absent(),
    this.taskId = const Value.absent(),
    this.rruleStr = const Value.absent(),
    this.nextAt = const Value.absent(),
    this.lastGeneratedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalRecurringRulesCompanion.insert({
    required String id,
    required String taskId,
    required String rruleStr,
    this.nextAt = const Value.absent(),
    this.lastGeneratedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       taskId = Value(taskId),
       rruleStr = Value(rruleStr);
  static Insertable<LocalRecurringRule> custom({
    Expression<String>? id,
    Expression<String>? taskId,
    Expression<String>? rruleStr,
    Expression<DateTime>? nextAt,
    Expression<DateTime>? lastGeneratedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (taskId != null) 'task_id': taskId,
      if (rruleStr != null) 'rrule_str': rruleStr,
      if (nextAt != null) 'next_at': nextAt,
      if (lastGeneratedAt != null) 'last_generated_at': lastGeneratedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalRecurringRulesCompanion copyWith({
    Value<String>? id,
    Value<String>? taskId,
    Value<String>? rruleStr,
    Value<DateTime?>? nextAt,
    Value<DateTime?>? lastGeneratedAt,
    Value<int>? rowid,
  }) {
    return LocalRecurringRulesCompanion(
      id: id ?? this.id,
      taskId: taskId ?? this.taskId,
      rruleStr: rruleStr ?? this.rruleStr,
      nextAt: nextAt ?? this.nextAt,
      lastGeneratedAt: lastGeneratedAt ?? this.lastGeneratedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (taskId.present) {
      map['task_id'] = Variable<String>(taskId.value);
    }
    if (rruleStr.present) {
      map['rrule_str'] = Variable<String>(rruleStr.value);
    }
    if (nextAt.present) {
      map['next_at'] = Variable<DateTime>(nextAt.value);
    }
    if (lastGeneratedAt.present) {
      map['last_generated_at'] = Variable<DateTime>(lastGeneratedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalRecurringRulesCompanion(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('rruleStr: $rruleStr, ')
          ..write('nextAt: $nextAt, ')
          ..write('lastGeneratedAt: $lastGeneratedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalRemindersTable extends LocalReminders
    with TableInfo<$LocalRemindersTable, LocalReminder> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalRemindersTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _taskIdMeta = const VerificationMeta('taskId');
  @override
  late final GeneratedColumn<String> taskId = GeneratedColumn<String>(
    'task_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _channelMeta = const VerificationMeta(
    'channel',
  );
  @override
  late final GeneratedColumn<String> channel = GeneratedColumn<String>(
    'channel',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _offsetMinutesMeta = const VerificationMeta(
    'offsetMinutes',
  );
  @override
  late final GeneratedColumn<int> offsetMinutes = GeneratedColumn<int>(
    'offset_minutes',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _scheduledAtMeta = const VerificationMeta(
    'scheduledAt',
  );
  @override
  late final GeneratedColumn<DateTime> scheduledAt = GeneratedColumn<DateTime>(
    'scheduled_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sentAtMeta = const VerificationMeta('sentAt');
  @override
  late final GeneratedColumn<DateTime> sentAt = GeneratedColumn<DateTime>(
    'sent_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  static const VerificationMeta _needsSyncMeta = const VerificationMeta(
    'needsSync',
  );
  @override
  late final GeneratedColumn<bool> needsSync = GeneratedColumn<bool>(
    'needs_sync',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("needs_sync" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    taskId,
    channel,
    offsetMinutes,
    scheduledAt,
    sentAt,
    status,
    needsSync,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_reminders';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalReminder> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('task_id')) {
      context.handle(
        _taskIdMeta,
        taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta),
      );
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('channel')) {
      context.handle(
        _channelMeta,
        channel.isAcceptableOrUnknown(data['channel']!, _channelMeta),
      );
    } else if (isInserting) {
      context.missing(_channelMeta);
    }
    if (data.containsKey('offset_minutes')) {
      context.handle(
        _offsetMinutesMeta,
        offsetMinutes.isAcceptableOrUnknown(
          data['offset_minutes']!,
          _offsetMinutesMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_offsetMinutesMeta);
    }
    if (data.containsKey('scheduled_at')) {
      context.handle(
        _scheduledAtMeta,
        scheduledAt.isAcceptableOrUnknown(
          data['scheduled_at']!,
          _scheduledAtMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_scheduledAtMeta);
    }
    if (data.containsKey('sent_at')) {
      context.handle(
        _sentAtMeta,
        sentAt.isAcceptableOrUnknown(data['sent_at']!, _sentAtMeta),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('needs_sync')) {
      context.handle(
        _needsSyncMeta,
        needsSync.isAcceptableOrUnknown(data['needs_sync']!, _needsSyncMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalReminder map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalReminder(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      taskId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}task_id'],
      )!,
      channel: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}channel'],
      )!,
      offsetMinutes: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}offset_minutes'],
      )!,
      scheduledAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}scheduled_at'],
      )!,
      sentAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}sent_at'],
      ),
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      needsSync: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}needs_sync'],
      )!,
    );
  }

  @override
  $LocalRemindersTable createAlias(String alias) {
    return $LocalRemindersTable(attachedDatabase, alias);
  }
}

class LocalReminder extends DataClass implements Insertable<LocalReminder> {
  final String id;
  final String taskId;

  /// 'push', 'telegram', 'email', 'whatsapp', 'sms', etc.
  final String channel;
  final int offsetMinutes;
  final DateTime scheduledAt;
  final DateTime? sentAt;

  /// 'pending', 'sent', 'failed', 'cancelled'
  final String status;
  final bool needsSync;
  const LocalReminder({
    required this.id,
    required this.taskId,
    required this.channel,
    required this.offsetMinutes,
    required this.scheduledAt,
    this.sentAt,
    required this.status,
    required this.needsSync,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['task_id'] = Variable<String>(taskId);
    map['channel'] = Variable<String>(channel);
    map['offset_minutes'] = Variable<int>(offsetMinutes);
    map['scheduled_at'] = Variable<DateTime>(scheduledAt);
    if (!nullToAbsent || sentAt != null) {
      map['sent_at'] = Variable<DateTime>(sentAt);
    }
    map['status'] = Variable<String>(status);
    map['needs_sync'] = Variable<bool>(needsSync);
    return map;
  }

  LocalRemindersCompanion toCompanion(bool nullToAbsent) {
    return LocalRemindersCompanion(
      id: Value(id),
      taskId: Value(taskId),
      channel: Value(channel),
      offsetMinutes: Value(offsetMinutes),
      scheduledAt: Value(scheduledAt),
      sentAt: sentAt == null && nullToAbsent
          ? const Value.absent()
          : Value(sentAt),
      status: Value(status),
      needsSync: Value(needsSync),
    );
  }

  factory LocalReminder.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalReminder(
      id: serializer.fromJson<String>(json['id']),
      taskId: serializer.fromJson<String>(json['taskId']),
      channel: serializer.fromJson<String>(json['channel']),
      offsetMinutes: serializer.fromJson<int>(json['offsetMinutes']),
      scheduledAt: serializer.fromJson<DateTime>(json['scheduledAt']),
      sentAt: serializer.fromJson<DateTime?>(json['sentAt']),
      status: serializer.fromJson<String>(json['status']),
      needsSync: serializer.fromJson<bool>(json['needsSync']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'taskId': serializer.toJson<String>(taskId),
      'channel': serializer.toJson<String>(channel),
      'offsetMinutes': serializer.toJson<int>(offsetMinutes),
      'scheduledAt': serializer.toJson<DateTime>(scheduledAt),
      'sentAt': serializer.toJson<DateTime?>(sentAt),
      'status': serializer.toJson<String>(status),
      'needsSync': serializer.toJson<bool>(needsSync),
    };
  }

  LocalReminder copyWith({
    String? id,
    String? taskId,
    String? channel,
    int? offsetMinutes,
    DateTime? scheduledAt,
    Value<DateTime?> sentAt = const Value.absent(),
    String? status,
    bool? needsSync,
  }) => LocalReminder(
    id: id ?? this.id,
    taskId: taskId ?? this.taskId,
    channel: channel ?? this.channel,
    offsetMinutes: offsetMinutes ?? this.offsetMinutes,
    scheduledAt: scheduledAt ?? this.scheduledAt,
    sentAt: sentAt.present ? sentAt.value : this.sentAt,
    status: status ?? this.status,
    needsSync: needsSync ?? this.needsSync,
  );
  LocalReminder copyWithCompanion(LocalRemindersCompanion data) {
    return LocalReminder(
      id: data.id.present ? data.id.value : this.id,
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      channel: data.channel.present ? data.channel.value : this.channel,
      offsetMinutes: data.offsetMinutes.present
          ? data.offsetMinutes.value
          : this.offsetMinutes,
      scheduledAt: data.scheduledAt.present
          ? data.scheduledAt.value
          : this.scheduledAt,
      sentAt: data.sentAt.present ? data.sentAt.value : this.sentAt,
      status: data.status.present ? data.status.value : this.status,
      needsSync: data.needsSync.present ? data.needsSync.value : this.needsSync,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalReminder(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('channel: $channel, ')
          ..write('offsetMinutes: $offsetMinutes, ')
          ..write('scheduledAt: $scheduledAt, ')
          ..write('sentAt: $sentAt, ')
          ..write('status: $status, ')
          ..write('needsSync: $needsSync')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    taskId,
    channel,
    offsetMinutes,
    scheduledAt,
    sentAt,
    status,
    needsSync,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalReminder &&
          other.id == this.id &&
          other.taskId == this.taskId &&
          other.channel == this.channel &&
          other.offsetMinutes == this.offsetMinutes &&
          other.scheduledAt == this.scheduledAt &&
          other.sentAt == this.sentAt &&
          other.status == this.status &&
          other.needsSync == this.needsSync);
}

class LocalRemindersCompanion extends UpdateCompanion<LocalReminder> {
  final Value<String> id;
  final Value<String> taskId;
  final Value<String> channel;
  final Value<int> offsetMinutes;
  final Value<DateTime> scheduledAt;
  final Value<DateTime?> sentAt;
  final Value<String> status;
  final Value<bool> needsSync;
  final Value<int> rowid;
  const LocalRemindersCompanion({
    this.id = const Value.absent(),
    this.taskId = const Value.absent(),
    this.channel = const Value.absent(),
    this.offsetMinutes = const Value.absent(),
    this.scheduledAt = const Value.absent(),
    this.sentAt = const Value.absent(),
    this.status = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalRemindersCompanion.insert({
    required String id,
    required String taskId,
    required String channel,
    required int offsetMinutes,
    required DateTime scheduledAt,
    this.sentAt = const Value.absent(),
    this.status = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       taskId = Value(taskId),
       channel = Value(channel),
       offsetMinutes = Value(offsetMinutes),
       scheduledAt = Value(scheduledAt);
  static Insertable<LocalReminder> custom({
    Expression<String>? id,
    Expression<String>? taskId,
    Expression<String>? channel,
    Expression<int>? offsetMinutes,
    Expression<DateTime>? scheduledAt,
    Expression<DateTime>? sentAt,
    Expression<String>? status,
    Expression<bool>? needsSync,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (taskId != null) 'task_id': taskId,
      if (channel != null) 'channel': channel,
      if (offsetMinutes != null) 'offset_minutes': offsetMinutes,
      if (scheduledAt != null) 'scheduled_at': scheduledAt,
      if (sentAt != null) 'sent_at': sentAt,
      if (status != null) 'status': status,
      if (needsSync != null) 'needs_sync': needsSync,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalRemindersCompanion copyWith({
    Value<String>? id,
    Value<String>? taskId,
    Value<String>? channel,
    Value<int>? offsetMinutes,
    Value<DateTime>? scheduledAt,
    Value<DateTime?>? sentAt,
    Value<String>? status,
    Value<bool>? needsSync,
    Value<int>? rowid,
  }) {
    return LocalRemindersCompanion(
      id: id ?? this.id,
      taskId: taskId ?? this.taskId,
      channel: channel ?? this.channel,
      offsetMinutes: offsetMinutes ?? this.offsetMinutes,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      sentAt: sentAt ?? this.sentAt,
      status: status ?? this.status,
      needsSync: needsSync ?? this.needsSync,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (taskId.present) {
      map['task_id'] = Variable<String>(taskId.value);
    }
    if (channel.present) {
      map['channel'] = Variable<String>(channel.value);
    }
    if (offsetMinutes.present) {
      map['offset_minutes'] = Variable<int>(offsetMinutes.value);
    }
    if (scheduledAt.present) {
      map['scheduled_at'] = Variable<DateTime>(scheduledAt.value);
    }
    if (sentAt.present) {
      map['sent_at'] = Variable<DateTime>(sentAt.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (needsSync.present) {
      map['needs_sync'] = Variable<bool>(needsSync.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalRemindersCompanion(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('channel: $channel, ')
          ..write('offsetMinutes: $offsetMinutes, ')
          ..write('scheduledAt: $scheduledAt, ')
          ..write('sentAt: $sentAt, ')
          ..write('status: $status, ')
          ..write('needsSync: $needsSync, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalSubtasksTable extends LocalSubtasks
    with TableInfo<$LocalSubtasksTable, LocalSubtask> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalSubtasksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _taskIdMeta = const VerificationMeta('taskId');
  @override
  late final GeneratedColumn<String> taskId = GeneratedColumn<String>(
    'task_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    false,
    additionalChecks: GeneratedColumn.checkTextLength(
      minTextLength: 1,
      maxTextLength: 500,
    ),
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isCompletedMeta = const VerificationMeta(
    'isCompleted',
  );
  @override
  late final GeneratedColumn<bool> isCompleted = GeneratedColumn<bool>(
    'is_completed',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_completed" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _sortOrderMeta = const VerificationMeta(
    'sortOrder',
  );
  @override
  late final GeneratedColumn<int> sortOrder = GeneratedColumn<int>(
    'sort_order',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _needsSyncMeta = const VerificationMeta(
    'needsSync',
  );
  @override
  late final GeneratedColumn<bool> needsSync = GeneratedColumn<bool>(
    'needs_sync',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("needs_sync" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    taskId,
    title,
    isCompleted,
    sortOrder,
    createdAt,
    updatedAt,
    needsSync,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_subtasks';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalSubtask> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('task_id')) {
      context.handle(
        _taskIdMeta,
        taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta),
      );
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('is_completed')) {
      context.handle(
        _isCompletedMeta,
        isCompleted.isAcceptableOrUnknown(
          data['is_completed']!,
          _isCompletedMeta,
        ),
      );
    }
    if (data.containsKey('sort_order')) {
      context.handle(
        _sortOrderMeta,
        sortOrder.isAcceptableOrUnknown(data['sort_order']!, _sortOrderMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    if (data.containsKey('needs_sync')) {
      context.handle(
        _needsSyncMeta,
        needsSync.isAcceptableOrUnknown(data['needs_sync']!, _needsSyncMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalSubtask map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalSubtask(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      taskId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}task_id'],
      )!,
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      )!,
      isCompleted: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_completed'],
      )!,
      sortOrder: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}sort_order'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      needsSync: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}needs_sync'],
      )!,
    );
  }

  @override
  $LocalSubtasksTable createAlias(String alias) {
    return $LocalSubtasksTable(attachedDatabase, alias);
  }
}

class LocalSubtask extends DataClass implements Insertable<LocalSubtask> {
  final String id;
  final String taskId;
  final String title;
  final bool isCompleted;
  final int sortOrder;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool needsSync;
  const LocalSubtask({
    required this.id,
    required this.taskId,
    required this.title,
    required this.isCompleted,
    required this.sortOrder,
    required this.createdAt,
    required this.updatedAt,
    required this.needsSync,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['task_id'] = Variable<String>(taskId);
    map['title'] = Variable<String>(title);
    map['is_completed'] = Variable<bool>(isCompleted);
    map['sort_order'] = Variable<int>(sortOrder);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['needs_sync'] = Variable<bool>(needsSync);
    return map;
  }

  LocalSubtasksCompanion toCompanion(bool nullToAbsent) {
    return LocalSubtasksCompanion(
      id: Value(id),
      taskId: Value(taskId),
      title: Value(title),
      isCompleted: Value(isCompleted),
      sortOrder: Value(sortOrder),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
      needsSync: Value(needsSync),
    );
  }

  factory LocalSubtask.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalSubtask(
      id: serializer.fromJson<String>(json['id']),
      taskId: serializer.fromJson<String>(json['taskId']),
      title: serializer.fromJson<String>(json['title']),
      isCompleted: serializer.fromJson<bool>(json['isCompleted']),
      sortOrder: serializer.fromJson<int>(json['sortOrder']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      needsSync: serializer.fromJson<bool>(json['needsSync']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'taskId': serializer.toJson<String>(taskId),
      'title': serializer.toJson<String>(title),
      'isCompleted': serializer.toJson<bool>(isCompleted),
      'sortOrder': serializer.toJson<int>(sortOrder),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'needsSync': serializer.toJson<bool>(needsSync),
    };
  }

  LocalSubtask copyWith({
    String? id,
    String? taskId,
    String? title,
    bool? isCompleted,
    int? sortOrder,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? needsSync,
  }) => LocalSubtask(
    id: id ?? this.id,
    taskId: taskId ?? this.taskId,
    title: title ?? this.title,
    isCompleted: isCompleted ?? this.isCompleted,
    sortOrder: sortOrder ?? this.sortOrder,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    needsSync: needsSync ?? this.needsSync,
  );
  LocalSubtask copyWithCompanion(LocalSubtasksCompanion data) {
    return LocalSubtask(
      id: data.id.present ? data.id.value : this.id,
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      title: data.title.present ? data.title.value : this.title,
      isCompleted: data.isCompleted.present
          ? data.isCompleted.value
          : this.isCompleted,
      sortOrder: data.sortOrder.present ? data.sortOrder.value : this.sortOrder,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      needsSync: data.needsSync.present ? data.needsSync.value : this.needsSync,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalSubtask(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('title: $title, ')
          ..write('isCompleted: $isCompleted, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('needsSync: $needsSync')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    taskId,
    title,
    isCompleted,
    sortOrder,
    createdAt,
    updatedAt,
    needsSync,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalSubtask &&
          other.id == this.id &&
          other.taskId == this.taskId &&
          other.title == this.title &&
          other.isCompleted == this.isCompleted &&
          other.sortOrder == this.sortOrder &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.needsSync == this.needsSync);
}

class LocalSubtasksCompanion extends UpdateCompanion<LocalSubtask> {
  final Value<String> id;
  final Value<String> taskId;
  final Value<String> title;
  final Value<bool> isCompleted;
  final Value<int> sortOrder;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<bool> needsSync;
  final Value<int> rowid;
  const LocalSubtasksCompanion({
    this.id = const Value.absent(),
    this.taskId = const Value.absent(),
    this.title = const Value.absent(),
    this.isCompleted = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalSubtasksCompanion.insert({
    required String id,
    required String taskId,
    required String title,
    this.isCompleted = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       taskId = Value(taskId),
       title = Value(title);
  static Insertable<LocalSubtask> custom({
    Expression<String>? id,
    Expression<String>? taskId,
    Expression<String>? title,
    Expression<bool>? isCompleted,
    Expression<int>? sortOrder,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<bool>? needsSync,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (taskId != null) 'task_id': taskId,
      if (title != null) 'title': title,
      if (isCompleted != null) 'is_completed': isCompleted,
      if (sortOrder != null) 'sort_order': sortOrder,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (needsSync != null) 'needs_sync': needsSync,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalSubtasksCompanion copyWith({
    Value<String>? id,
    Value<String>? taskId,
    Value<String>? title,
    Value<bool>? isCompleted,
    Value<int>? sortOrder,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<bool>? needsSync,
    Value<int>? rowid,
  }) {
    return LocalSubtasksCompanion(
      id: id ?? this.id,
      taskId: taskId ?? this.taskId,
      title: title ?? this.title,
      isCompleted: isCompleted ?? this.isCompleted,
      sortOrder: sortOrder ?? this.sortOrder,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      needsSync: needsSync ?? this.needsSync,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (taskId.present) {
      map['task_id'] = Variable<String>(taskId.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (isCompleted.present) {
      map['is_completed'] = Variable<bool>(isCompleted.value);
    }
    if (sortOrder.present) {
      map['sort_order'] = Variable<int>(sortOrder.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (needsSync.present) {
      map['needs_sync'] = Variable<bool>(needsSync.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalSubtasksCompanion(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('title: $title, ')
          ..write('isCompleted: $isCompleted, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('needsSync: $needsSync, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalTagsTable extends LocalTags
    with TableInfo<$LocalTagsTable, LocalTag> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalTagsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    additionalChecks: GeneratedColumn.checkTextLength(
      minTextLength: 1,
      maxTextLength: 100,
    ),
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _colorMeta = const VerificationMeta('color');
  @override
  late final GeneratedColumn<String> color = GeneratedColumn<String>(
    'color',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('#6C5CE7'),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [id, name, color, createdAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_tags';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalTag> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('color')) {
      context.handle(
        _colorMeta,
        color.isAcceptableOrUnknown(data['color']!, _colorMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalTag map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalTag(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      color: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}color'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $LocalTagsTable createAlias(String alias) {
    return $LocalTagsTable(attachedDatabase, alias);
  }
}

class LocalTag extends DataClass implements Insertable<LocalTag> {
  final String id;
  final String name;
  final String color;
  final DateTime createdAt;
  const LocalTag({
    required this.id,
    required this.name,
    required this.color,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    map['color'] = Variable<String>(color);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  LocalTagsCompanion toCompanion(bool nullToAbsent) {
    return LocalTagsCompanion(
      id: Value(id),
      name: Value(name),
      color: Value(color),
      createdAt: Value(createdAt),
    );
  }

  factory LocalTag.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalTag(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      color: serializer.fromJson<String>(json['color']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'color': serializer.toJson<String>(color),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  LocalTag copyWith({
    String? id,
    String? name,
    String? color,
    DateTime? createdAt,
  }) => LocalTag(
    id: id ?? this.id,
    name: name ?? this.name,
    color: color ?? this.color,
    createdAt: createdAt ?? this.createdAt,
  );
  LocalTag copyWithCompanion(LocalTagsCompanion data) {
    return LocalTag(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      color: data.color.present ? data.color.value : this.color,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalTag(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('color: $color, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, color, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalTag &&
          other.id == this.id &&
          other.name == this.name &&
          other.color == this.color &&
          other.createdAt == this.createdAt);
}

class LocalTagsCompanion extends UpdateCompanion<LocalTag> {
  final Value<String> id;
  final Value<String> name;
  final Value<String> color;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const LocalTagsCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.color = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalTagsCompanion.insert({
    required String id,
    required String name,
    this.color = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       name = Value(name);
  static Insertable<LocalTag> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? color,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (color != null) 'color': color,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalTagsCompanion copyWith({
    Value<String>? id,
    Value<String>? name,
    Value<String>? color,
    Value<DateTime>? createdAt,
    Value<int>? rowid,
  }) {
    return LocalTagsCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      color: color ?? this.color,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (color.present) {
      map['color'] = Variable<String>(color.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalTagsCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('color: $color, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalTaskTagsTable extends LocalTaskTags
    with TableInfo<$LocalTaskTagsTable, LocalTaskTag> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalTaskTagsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _taskIdMeta = const VerificationMeta('taskId');
  @override
  late final GeneratedColumn<String> taskId = GeneratedColumn<String>(
    'task_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _tagIdMeta = const VerificationMeta('tagId');
  @override
  late final GeneratedColumn<String> tagId = GeneratedColumn<String>(
    'tag_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [taskId, tagId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_task_tags';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalTaskTag> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('task_id')) {
      context.handle(
        _taskIdMeta,
        taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta),
      );
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('tag_id')) {
      context.handle(
        _tagIdMeta,
        tagId.isAcceptableOrUnknown(data['tag_id']!, _tagIdMeta),
      );
    } else if (isInserting) {
      context.missing(_tagIdMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {taskId, tagId};
  @override
  LocalTaskTag map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalTaskTag(
      taskId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}task_id'],
      )!,
      tagId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}tag_id'],
      )!,
    );
  }

  @override
  $LocalTaskTagsTable createAlias(String alias) {
    return $LocalTaskTagsTable(attachedDatabase, alias);
  }
}

class LocalTaskTag extends DataClass implements Insertable<LocalTaskTag> {
  final String taskId;
  final String tagId;
  const LocalTaskTag({required this.taskId, required this.tagId});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['task_id'] = Variable<String>(taskId);
    map['tag_id'] = Variable<String>(tagId);
    return map;
  }

  LocalTaskTagsCompanion toCompanion(bool nullToAbsent) {
    return LocalTaskTagsCompanion(taskId: Value(taskId), tagId: Value(tagId));
  }

  factory LocalTaskTag.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalTaskTag(
      taskId: serializer.fromJson<String>(json['taskId']),
      tagId: serializer.fromJson<String>(json['tagId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'taskId': serializer.toJson<String>(taskId),
      'tagId': serializer.toJson<String>(tagId),
    };
  }

  LocalTaskTag copyWith({String? taskId, String? tagId}) =>
      LocalTaskTag(taskId: taskId ?? this.taskId, tagId: tagId ?? this.tagId);
  LocalTaskTag copyWithCompanion(LocalTaskTagsCompanion data) {
    return LocalTaskTag(
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      tagId: data.tagId.present ? data.tagId.value : this.tagId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalTaskTag(')
          ..write('taskId: $taskId, ')
          ..write('tagId: $tagId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(taskId, tagId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalTaskTag &&
          other.taskId == this.taskId &&
          other.tagId == this.tagId);
}

class LocalTaskTagsCompanion extends UpdateCompanion<LocalTaskTag> {
  final Value<String> taskId;
  final Value<String> tagId;
  final Value<int> rowid;
  const LocalTaskTagsCompanion({
    this.taskId = const Value.absent(),
    this.tagId = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalTaskTagsCompanion.insert({
    required String taskId,
    required String tagId,
    this.rowid = const Value.absent(),
  }) : taskId = Value(taskId),
       tagId = Value(tagId);
  static Insertable<LocalTaskTag> custom({
    Expression<String>? taskId,
    Expression<String>? tagId,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (taskId != null) 'task_id': taskId,
      if (tagId != null) 'tag_id': tagId,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalTaskTagsCompanion copyWith({
    Value<String>? taskId,
    Value<String>? tagId,
    Value<int>? rowid,
  }) {
    return LocalTaskTagsCompanion(
      taskId: taskId ?? this.taskId,
      tagId: tagId ?? this.tagId,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (taskId.present) {
      map['task_id'] = Variable<String>(taskId.value);
    }
    if (tagId.present) {
      map['tag_id'] = Variable<String>(tagId.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalTaskTagsCompanion(')
          ..write('taskId: $taskId, ')
          ..write('tagId: $tagId, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalTimeBlocksTable extends LocalTimeBlocks
    with TableInfo<$LocalTimeBlocksTable, LocalTimeBlock> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalTimeBlocksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _taskIdMeta = const VerificationMeta('taskId');
  @override
  late final GeneratedColumn<String> taskId = GeneratedColumn<String>(
    'task_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _blockDateMeta = const VerificationMeta(
    'blockDate',
  );
  @override
  late final GeneratedColumn<DateTime> blockDate = GeneratedColumn<DateTime>(
    'block_date',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _startHourMeta = const VerificationMeta(
    'startHour',
  );
  @override
  late final GeneratedColumn<int> startHour = GeneratedColumn<int>(
    'start_hour',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _startMinuteMeta = const VerificationMeta(
    'startMinute',
  );
  @override
  late final GeneratedColumn<int> startMinute = GeneratedColumn<int>(
    'start_minute',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _durationMinutesMeta = const VerificationMeta(
    'durationMinutes',
  );
  @override
  late final GeneratedColumn<int> durationMinutes = GeneratedColumn<int>(
    'duration_minutes',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _needsSyncMeta = const VerificationMeta(
    'needsSync',
  );
  @override
  late final GeneratedColumn<bool> needsSync = GeneratedColumn<bool>(
    'needs_sync',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("needs_sync" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    taskId,
    blockDate,
    startHour,
    startMinute,
    durationMinutes,
    createdAt,
    needsSync,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_time_blocks';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalTimeBlock> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('task_id')) {
      context.handle(
        _taskIdMeta,
        taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta),
      );
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('block_date')) {
      context.handle(
        _blockDateMeta,
        blockDate.isAcceptableOrUnknown(data['block_date']!, _blockDateMeta),
      );
    } else if (isInserting) {
      context.missing(_blockDateMeta);
    }
    if (data.containsKey('start_hour')) {
      context.handle(
        _startHourMeta,
        startHour.isAcceptableOrUnknown(data['start_hour']!, _startHourMeta),
      );
    } else if (isInserting) {
      context.missing(_startHourMeta);
    }
    if (data.containsKey('start_minute')) {
      context.handle(
        _startMinuteMeta,
        startMinute.isAcceptableOrUnknown(
          data['start_minute']!,
          _startMinuteMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_startMinuteMeta);
    }
    if (data.containsKey('duration_minutes')) {
      context.handle(
        _durationMinutesMeta,
        durationMinutes.isAcceptableOrUnknown(
          data['duration_minutes']!,
          _durationMinutesMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_durationMinutesMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('needs_sync')) {
      context.handle(
        _needsSyncMeta,
        needsSync.isAcceptableOrUnknown(data['needs_sync']!, _needsSyncMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalTimeBlock map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalTimeBlock(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      taskId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}task_id'],
      )!,
      blockDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}block_date'],
      )!,
      startHour: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}start_hour'],
      )!,
      startMinute: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}start_minute'],
      )!,
      durationMinutes: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}duration_minutes'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      needsSync: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}needs_sync'],
      )!,
    );
  }

  @override
  $LocalTimeBlocksTable createAlias(String alias) {
    return $LocalTimeBlocksTable(attachedDatabase, alias);
  }
}

class LocalTimeBlock extends DataClass implements Insertable<LocalTimeBlock> {
  final String id;
  final String taskId;
  final DateTime blockDate;
  final int startHour;
  final int startMinute;
  final int durationMinutes;
  final DateTime createdAt;
  final bool needsSync;
  const LocalTimeBlock({
    required this.id,
    required this.taskId,
    required this.blockDate,
    required this.startHour,
    required this.startMinute,
    required this.durationMinutes,
    required this.createdAt,
    required this.needsSync,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['task_id'] = Variable<String>(taskId);
    map['block_date'] = Variable<DateTime>(blockDate);
    map['start_hour'] = Variable<int>(startHour);
    map['start_minute'] = Variable<int>(startMinute);
    map['duration_minutes'] = Variable<int>(durationMinutes);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['needs_sync'] = Variable<bool>(needsSync);
    return map;
  }

  LocalTimeBlocksCompanion toCompanion(bool nullToAbsent) {
    return LocalTimeBlocksCompanion(
      id: Value(id),
      taskId: Value(taskId),
      blockDate: Value(blockDate),
      startHour: Value(startHour),
      startMinute: Value(startMinute),
      durationMinutes: Value(durationMinutes),
      createdAt: Value(createdAt),
      needsSync: Value(needsSync),
    );
  }

  factory LocalTimeBlock.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalTimeBlock(
      id: serializer.fromJson<String>(json['id']),
      taskId: serializer.fromJson<String>(json['taskId']),
      blockDate: serializer.fromJson<DateTime>(json['blockDate']),
      startHour: serializer.fromJson<int>(json['startHour']),
      startMinute: serializer.fromJson<int>(json['startMinute']),
      durationMinutes: serializer.fromJson<int>(json['durationMinutes']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      needsSync: serializer.fromJson<bool>(json['needsSync']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'taskId': serializer.toJson<String>(taskId),
      'blockDate': serializer.toJson<DateTime>(blockDate),
      'startHour': serializer.toJson<int>(startHour),
      'startMinute': serializer.toJson<int>(startMinute),
      'durationMinutes': serializer.toJson<int>(durationMinutes),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'needsSync': serializer.toJson<bool>(needsSync),
    };
  }

  LocalTimeBlock copyWith({
    String? id,
    String? taskId,
    DateTime? blockDate,
    int? startHour,
    int? startMinute,
    int? durationMinutes,
    DateTime? createdAt,
    bool? needsSync,
  }) => LocalTimeBlock(
    id: id ?? this.id,
    taskId: taskId ?? this.taskId,
    blockDate: blockDate ?? this.blockDate,
    startHour: startHour ?? this.startHour,
    startMinute: startMinute ?? this.startMinute,
    durationMinutes: durationMinutes ?? this.durationMinutes,
    createdAt: createdAt ?? this.createdAt,
    needsSync: needsSync ?? this.needsSync,
  );
  LocalTimeBlock copyWithCompanion(LocalTimeBlocksCompanion data) {
    return LocalTimeBlock(
      id: data.id.present ? data.id.value : this.id,
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      blockDate: data.blockDate.present ? data.blockDate.value : this.blockDate,
      startHour: data.startHour.present ? data.startHour.value : this.startHour,
      startMinute: data.startMinute.present
          ? data.startMinute.value
          : this.startMinute,
      durationMinutes: data.durationMinutes.present
          ? data.durationMinutes.value
          : this.durationMinutes,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      needsSync: data.needsSync.present ? data.needsSync.value : this.needsSync,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalTimeBlock(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('blockDate: $blockDate, ')
          ..write('startHour: $startHour, ')
          ..write('startMinute: $startMinute, ')
          ..write('durationMinutes: $durationMinutes, ')
          ..write('createdAt: $createdAt, ')
          ..write('needsSync: $needsSync')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    taskId,
    blockDate,
    startHour,
    startMinute,
    durationMinutes,
    createdAt,
    needsSync,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalTimeBlock &&
          other.id == this.id &&
          other.taskId == this.taskId &&
          other.blockDate == this.blockDate &&
          other.startHour == this.startHour &&
          other.startMinute == this.startMinute &&
          other.durationMinutes == this.durationMinutes &&
          other.createdAt == this.createdAt &&
          other.needsSync == this.needsSync);
}

class LocalTimeBlocksCompanion extends UpdateCompanion<LocalTimeBlock> {
  final Value<String> id;
  final Value<String> taskId;
  final Value<DateTime> blockDate;
  final Value<int> startHour;
  final Value<int> startMinute;
  final Value<int> durationMinutes;
  final Value<DateTime> createdAt;
  final Value<bool> needsSync;
  final Value<int> rowid;
  const LocalTimeBlocksCompanion({
    this.id = const Value.absent(),
    this.taskId = const Value.absent(),
    this.blockDate = const Value.absent(),
    this.startHour = const Value.absent(),
    this.startMinute = const Value.absent(),
    this.durationMinutes = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalTimeBlocksCompanion.insert({
    required String id,
    required String taskId,
    required DateTime blockDate,
    required int startHour,
    required int startMinute,
    required int durationMinutes,
    this.createdAt = const Value.absent(),
    this.needsSync = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       taskId = Value(taskId),
       blockDate = Value(blockDate),
       startHour = Value(startHour),
       startMinute = Value(startMinute),
       durationMinutes = Value(durationMinutes);
  static Insertable<LocalTimeBlock> custom({
    Expression<String>? id,
    Expression<String>? taskId,
    Expression<DateTime>? blockDate,
    Expression<int>? startHour,
    Expression<int>? startMinute,
    Expression<int>? durationMinutes,
    Expression<DateTime>? createdAt,
    Expression<bool>? needsSync,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (taskId != null) 'task_id': taskId,
      if (blockDate != null) 'block_date': blockDate,
      if (startHour != null) 'start_hour': startHour,
      if (startMinute != null) 'start_minute': startMinute,
      if (durationMinutes != null) 'duration_minutes': durationMinutes,
      if (createdAt != null) 'created_at': createdAt,
      if (needsSync != null) 'needs_sync': needsSync,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalTimeBlocksCompanion copyWith({
    Value<String>? id,
    Value<String>? taskId,
    Value<DateTime>? blockDate,
    Value<int>? startHour,
    Value<int>? startMinute,
    Value<int>? durationMinutes,
    Value<DateTime>? createdAt,
    Value<bool>? needsSync,
    Value<int>? rowid,
  }) {
    return LocalTimeBlocksCompanion(
      id: id ?? this.id,
      taskId: taskId ?? this.taskId,
      blockDate: blockDate ?? this.blockDate,
      startHour: startHour ?? this.startHour,
      startMinute: startMinute ?? this.startMinute,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      createdAt: createdAt ?? this.createdAt,
      needsSync: needsSync ?? this.needsSync,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (taskId.present) {
      map['task_id'] = Variable<String>(taskId.value);
    }
    if (blockDate.present) {
      map['block_date'] = Variable<DateTime>(blockDate.value);
    }
    if (startHour.present) {
      map['start_hour'] = Variable<int>(startHour.value);
    }
    if (startMinute.present) {
      map['start_minute'] = Variable<int>(startMinute.value);
    }
    if (durationMinutes.present) {
      map['duration_minutes'] = Variable<int>(durationMinutes.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (needsSync.present) {
      map['needs_sync'] = Variable<bool>(needsSync.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalTimeBlocksCompanion(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('blockDate: $blockDate, ')
          ..write('startHour: $startHour, ')
          ..write('startMinute: $startMinute, ')
          ..write('durationMinutes: $durationMinutes, ')
          ..write('createdAt: $createdAt, ')
          ..write('needsSync: $needsSync, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $LocalTasksTable localTasks = $LocalTasksTable(this);
  late final $LocalProjectsTable localProjects = $LocalProjectsTable(this);
  late final $LocalDailyContentTable localDailyContent =
      $LocalDailyContentTable(this);
  late final $LocalContentPreferencesTable localContentPreferences =
      $LocalContentPreferencesTable(this);
  late final $LocalRitualLogTable localRitualLog = $LocalRitualLogTable(this);
  late final $LocalProgressSnapshotsTable localProgressSnapshots =
      $LocalProgressSnapshotsTable(this);
  late final $LocalPomodoroSessionsTable localPomodoroSessions =
      $LocalPomodoroSessionsTable(this);
  late final $LocalGhostModeSessionsTable localGhostModeSessions =
      $LocalGhostModeSessionsTable(this);
  late final $LocalStreaksTable localStreaks = $LocalStreaksTable(this);
  late final $LocalPersonalBestsTable localPersonalBests =
      $LocalPersonalBestsTable(this);
  late final $LocalTaskTemplatesTable localTaskTemplates =
      $LocalTaskTemplatesTable(this);
  late final $LocalRecurringRulesTable localRecurringRules =
      $LocalRecurringRulesTable(this);
  late final $LocalRemindersTable localReminders = $LocalRemindersTable(this);
  late final $LocalSubtasksTable localSubtasks = $LocalSubtasksTable(this);
  late final $LocalTagsTable localTags = $LocalTagsTable(this);
  late final $LocalTaskTagsTable localTaskTags = $LocalTaskTagsTable(this);
  late final $LocalTimeBlocksTable localTimeBlocks = $LocalTimeBlocksTable(
    this,
  );
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    localTasks,
    localProjects,
    localDailyContent,
    localContentPreferences,
    localRitualLog,
    localProgressSnapshots,
    localPomodoroSessions,
    localGhostModeSessions,
    localStreaks,
    localPersonalBests,
    localTaskTemplates,
    localRecurringRules,
    localReminders,
    localSubtasks,
    localTags,
    localTaskTags,
    localTimeBlocks,
  ];
}

typedef $$LocalTasksTableCreateCompanionBuilder =
    LocalTasksCompanion Function({
      required String id,
      required String title,
      Value<String> description,
      Value<String> status,
      Value<String> priority,
      Value<String?> projectId,
      Value<DateTime?> dueDate,
      Value<DateTime?> completedAt,
      Value<String?> rrule,
      Value<int> sortOrder,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<bool> needsSync,
      Value<int> rowid,
    });
typedef $$LocalTasksTableUpdateCompanionBuilder =
    LocalTasksCompanion Function({
      Value<String> id,
      Value<String> title,
      Value<String> description,
      Value<String> status,
      Value<String> priority,
      Value<String?> projectId,
      Value<DateTime?> dueDate,
      Value<DateTime?> completedAt,
      Value<String?> rrule,
      Value<int> sortOrder,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<bool> needsSync,
      Value<int> rowid,
    });

class $$LocalTasksTableFilterComposer
    extends Composer<_$AppDatabase, $LocalTasksTable> {
  $$LocalTasksTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get priority => $composableBuilder(
    column: $table.priority,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get projectId => $composableBuilder(
    column: $table.projectId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get dueDate => $composableBuilder(
    column: $table.dueDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get rrule => $composableBuilder(
    column: $table.rrule,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalTasksTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalTasksTable> {
  $$LocalTasksTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get priority => $composableBuilder(
    column: $table.priority,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get projectId => $composableBuilder(
    column: $table.projectId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get dueDate => $composableBuilder(
    column: $table.dueDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get rrule => $composableBuilder(
    column: $table.rrule,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalTasksTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalTasksTable> {
  $$LocalTasksTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get priority =>
      $composableBuilder(column: $table.priority, builder: (column) => column);

  GeneratedColumn<String> get projectId =>
      $composableBuilder(column: $table.projectId, builder: (column) => column);

  GeneratedColumn<DateTime> get dueDate =>
      $composableBuilder(column: $table.dueDate, builder: (column) => column);

  GeneratedColumn<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => column,
  );

  GeneratedColumn<String> get rrule =>
      $composableBuilder(column: $table.rrule, builder: (column) => column);

  GeneratedColumn<int> get sortOrder =>
      $composableBuilder(column: $table.sortOrder, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  GeneratedColumn<bool> get needsSync =>
      $composableBuilder(column: $table.needsSync, builder: (column) => column);
}

class $$LocalTasksTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalTasksTable,
          LocalTask,
          $$LocalTasksTableFilterComposer,
          $$LocalTasksTableOrderingComposer,
          $$LocalTasksTableAnnotationComposer,
          $$LocalTasksTableCreateCompanionBuilder,
          $$LocalTasksTableUpdateCompanionBuilder,
          (
            LocalTask,
            BaseReferences<_$AppDatabase, $LocalTasksTable, LocalTask>,
          ),
          LocalTask,
          PrefetchHooks Function()
        > {
  $$LocalTasksTableTableManager(_$AppDatabase db, $LocalTasksTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalTasksTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalTasksTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalTasksTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> title = const Value.absent(),
                Value<String> description = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String> priority = const Value.absent(),
                Value<String?> projectId = const Value.absent(),
                Value<DateTime?> dueDate = const Value.absent(),
                Value<DateTime?> completedAt = const Value.absent(),
                Value<String?> rrule = const Value.absent(),
                Value<int> sortOrder = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalTasksCompanion(
                id: id,
                title: title,
                description: description,
                status: status,
                priority: priority,
                projectId: projectId,
                dueDate: dueDate,
                completedAt: completedAt,
                rrule: rrule,
                sortOrder: sortOrder,
                createdAt: createdAt,
                updatedAt: updatedAt,
                needsSync: needsSync,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String title,
                Value<String> description = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String> priority = const Value.absent(),
                Value<String?> projectId = const Value.absent(),
                Value<DateTime?> dueDate = const Value.absent(),
                Value<DateTime?> completedAt = const Value.absent(),
                Value<String?> rrule = const Value.absent(),
                Value<int> sortOrder = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalTasksCompanion.insert(
                id: id,
                title: title,
                description: description,
                status: status,
                priority: priority,
                projectId: projectId,
                dueDate: dueDate,
                completedAt: completedAt,
                rrule: rrule,
                sortOrder: sortOrder,
                createdAt: createdAt,
                updatedAt: updatedAt,
                needsSync: needsSync,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalTasksTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalTasksTable,
      LocalTask,
      $$LocalTasksTableFilterComposer,
      $$LocalTasksTableOrderingComposer,
      $$LocalTasksTableAnnotationComposer,
      $$LocalTasksTableCreateCompanionBuilder,
      $$LocalTasksTableUpdateCompanionBuilder,
      (LocalTask, BaseReferences<_$AppDatabase, $LocalTasksTable, LocalTask>),
      LocalTask,
      PrefetchHooks Function()
    >;
typedef $$LocalProjectsTableCreateCompanionBuilder =
    LocalProjectsCompanion Function({
      required String id,
      required String name,
      Value<String?> description,
      Value<String> color,
      Value<String> icon,
      Value<bool> isArchived,
      Value<int> sortOrder,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });
typedef $$LocalProjectsTableUpdateCompanionBuilder =
    LocalProjectsCompanion Function({
      Value<String> id,
      Value<String> name,
      Value<String?> description,
      Value<String> color,
      Value<String> icon,
      Value<bool> isArchived,
      Value<int> sortOrder,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$LocalProjectsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalProjectsTable> {
  $$LocalProjectsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get color => $composableBuilder(
    column: $table.color,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get icon => $composableBuilder(
    column: $table.icon,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isArchived => $composableBuilder(
    column: $table.isArchived,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalProjectsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalProjectsTable> {
  $$LocalProjectsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get color => $composableBuilder(
    column: $table.color,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get icon => $composableBuilder(
    column: $table.icon,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isArchived => $composableBuilder(
    column: $table.isArchived,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalProjectsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalProjectsTable> {
  $$LocalProjectsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => column,
  );

  GeneratedColumn<String> get color =>
      $composableBuilder(column: $table.color, builder: (column) => column);

  GeneratedColumn<String> get icon =>
      $composableBuilder(column: $table.icon, builder: (column) => column);

  GeneratedColumn<bool> get isArchived => $composableBuilder(
    column: $table.isArchived,
    builder: (column) => column,
  );

  GeneratedColumn<int> get sortOrder =>
      $composableBuilder(column: $table.sortOrder, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalProjectsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalProjectsTable,
          LocalProject,
          $$LocalProjectsTableFilterComposer,
          $$LocalProjectsTableOrderingComposer,
          $$LocalProjectsTableAnnotationComposer,
          $$LocalProjectsTableCreateCompanionBuilder,
          $$LocalProjectsTableUpdateCompanionBuilder,
          (
            LocalProject,
            BaseReferences<_$AppDatabase, $LocalProjectsTable, LocalProject>,
          ),
          LocalProject,
          PrefetchHooks Function()
        > {
  $$LocalProjectsTableTableManager(_$AppDatabase db, $LocalProjectsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalProjectsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalProjectsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalProjectsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String?> description = const Value.absent(),
                Value<String> color = const Value.absent(),
                Value<String> icon = const Value.absent(),
                Value<bool> isArchived = const Value.absent(),
                Value<int> sortOrder = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalProjectsCompanion(
                id: id,
                name: name,
                description: description,
                color: color,
                icon: icon,
                isArchived: isArchived,
                sortOrder: sortOrder,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String name,
                Value<String?> description = const Value.absent(),
                Value<String> color = const Value.absent(),
                Value<String> icon = const Value.absent(),
                Value<bool> isArchived = const Value.absent(),
                Value<int> sortOrder = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalProjectsCompanion.insert(
                id: id,
                name: name,
                description: description,
                color: color,
                icon: icon,
                isArchived: isArchived,
                sortOrder: sortOrder,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalProjectsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalProjectsTable,
      LocalProject,
      $$LocalProjectsTableFilterComposer,
      $$LocalProjectsTableOrderingComposer,
      $$LocalProjectsTableAnnotationComposer,
      $$LocalProjectsTableCreateCompanionBuilder,
      $$LocalProjectsTableUpdateCompanionBuilder,
      (
        LocalProject,
        BaseReferences<_$AppDatabase, $LocalProjectsTable, LocalProject>,
      ),
      LocalProject,
      PrefetchHooks Function()
    >;
typedef $$LocalDailyContentTableCreateCompanionBuilder =
    LocalDailyContentCompanion Function({
      required String id,
      required String category,
      required String body,
      Value<String?> author,
      Value<String?> source,
      Value<String> language,
      Value<bool> isSaved,
      Value<DateTime> fetchedAt,
      Value<int> rowid,
    });
typedef $$LocalDailyContentTableUpdateCompanionBuilder =
    LocalDailyContentCompanion Function({
      Value<String> id,
      Value<String> category,
      Value<String> body,
      Value<String?> author,
      Value<String?> source,
      Value<String> language,
      Value<bool> isSaved,
      Value<DateTime> fetchedAt,
      Value<int> rowid,
    });

class $$LocalDailyContentTableFilterComposer
    extends Composer<_$AppDatabase, $LocalDailyContentTable> {
  $$LocalDailyContentTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get body => $composableBuilder(
    column: $table.body,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get author => $composableBuilder(
    column: $table.author,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get source => $composableBuilder(
    column: $table.source,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get language => $composableBuilder(
    column: $table.language,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSaved => $composableBuilder(
    column: $table.isSaved,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get fetchedAt => $composableBuilder(
    column: $table.fetchedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalDailyContentTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalDailyContentTable> {
  $$LocalDailyContentTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get body => $composableBuilder(
    column: $table.body,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get author => $composableBuilder(
    column: $table.author,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get source => $composableBuilder(
    column: $table.source,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get language => $composableBuilder(
    column: $table.language,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSaved => $composableBuilder(
    column: $table.isSaved,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get fetchedAt => $composableBuilder(
    column: $table.fetchedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalDailyContentTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalDailyContentTable> {
  $$LocalDailyContentTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get category =>
      $composableBuilder(column: $table.category, builder: (column) => column);

  GeneratedColumn<String> get body =>
      $composableBuilder(column: $table.body, builder: (column) => column);

  GeneratedColumn<String> get author =>
      $composableBuilder(column: $table.author, builder: (column) => column);

  GeneratedColumn<String> get source =>
      $composableBuilder(column: $table.source, builder: (column) => column);

  GeneratedColumn<String> get language =>
      $composableBuilder(column: $table.language, builder: (column) => column);

  GeneratedColumn<bool> get isSaved =>
      $composableBuilder(column: $table.isSaved, builder: (column) => column);

  GeneratedColumn<DateTime> get fetchedAt =>
      $composableBuilder(column: $table.fetchedAt, builder: (column) => column);
}

class $$LocalDailyContentTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalDailyContentTable,
          LocalDailyContentData,
          $$LocalDailyContentTableFilterComposer,
          $$LocalDailyContentTableOrderingComposer,
          $$LocalDailyContentTableAnnotationComposer,
          $$LocalDailyContentTableCreateCompanionBuilder,
          $$LocalDailyContentTableUpdateCompanionBuilder,
          (
            LocalDailyContentData,
            BaseReferences<
              _$AppDatabase,
              $LocalDailyContentTable,
              LocalDailyContentData
            >,
          ),
          LocalDailyContentData,
          PrefetchHooks Function()
        > {
  $$LocalDailyContentTableTableManager(
    _$AppDatabase db,
    $LocalDailyContentTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalDailyContentTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalDailyContentTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalDailyContentTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> category = const Value.absent(),
                Value<String> body = const Value.absent(),
                Value<String?> author = const Value.absent(),
                Value<String?> source = const Value.absent(),
                Value<String> language = const Value.absent(),
                Value<bool> isSaved = const Value.absent(),
                Value<DateTime> fetchedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalDailyContentCompanion(
                id: id,
                category: category,
                body: body,
                author: author,
                source: source,
                language: language,
                isSaved: isSaved,
                fetchedAt: fetchedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String category,
                required String body,
                Value<String?> author = const Value.absent(),
                Value<String?> source = const Value.absent(),
                Value<String> language = const Value.absent(),
                Value<bool> isSaved = const Value.absent(),
                Value<DateTime> fetchedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalDailyContentCompanion.insert(
                id: id,
                category: category,
                body: body,
                author: author,
                source: source,
                language: language,
                isSaved: isSaved,
                fetchedAt: fetchedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalDailyContentTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalDailyContentTable,
      LocalDailyContentData,
      $$LocalDailyContentTableFilterComposer,
      $$LocalDailyContentTableOrderingComposer,
      $$LocalDailyContentTableAnnotationComposer,
      $$LocalDailyContentTableCreateCompanionBuilder,
      $$LocalDailyContentTableUpdateCompanionBuilder,
      (
        LocalDailyContentData,
        BaseReferences<
          _$AppDatabase,
          $LocalDailyContentTable,
          LocalDailyContentData
        >,
      ),
      LocalDailyContentData,
      PrefetchHooks Function()
    >;
typedef $$LocalContentPreferencesTableCreateCompanionBuilder =
    LocalContentPreferencesCompanion Function({
      required String category,
      Value<String> deliverAt,
      Value<bool> isActive,
      Value<int> rowid,
    });
typedef $$LocalContentPreferencesTableUpdateCompanionBuilder =
    LocalContentPreferencesCompanion Function({
      Value<String> category,
      Value<String> deliverAt,
      Value<bool> isActive,
      Value<int> rowid,
    });

class $$LocalContentPreferencesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalContentPreferencesTable> {
  $$LocalContentPreferencesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get deliverAt => $composableBuilder(
    column: $table.deliverAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isActive => $composableBuilder(
    column: $table.isActive,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalContentPreferencesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalContentPreferencesTable> {
  $$LocalContentPreferencesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get deliverAt => $composableBuilder(
    column: $table.deliverAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isActive => $composableBuilder(
    column: $table.isActive,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalContentPreferencesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalContentPreferencesTable> {
  $$LocalContentPreferencesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get category =>
      $composableBuilder(column: $table.category, builder: (column) => column);

  GeneratedColumn<String> get deliverAt =>
      $composableBuilder(column: $table.deliverAt, builder: (column) => column);

  GeneratedColumn<bool> get isActive =>
      $composableBuilder(column: $table.isActive, builder: (column) => column);
}

class $$LocalContentPreferencesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalContentPreferencesTable,
          LocalContentPreference,
          $$LocalContentPreferencesTableFilterComposer,
          $$LocalContentPreferencesTableOrderingComposer,
          $$LocalContentPreferencesTableAnnotationComposer,
          $$LocalContentPreferencesTableCreateCompanionBuilder,
          $$LocalContentPreferencesTableUpdateCompanionBuilder,
          (
            LocalContentPreference,
            BaseReferences<
              _$AppDatabase,
              $LocalContentPreferencesTable,
              LocalContentPreference
            >,
          ),
          LocalContentPreference,
          PrefetchHooks Function()
        > {
  $$LocalContentPreferencesTableTableManager(
    _$AppDatabase db,
    $LocalContentPreferencesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalContentPreferencesTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$LocalContentPreferencesTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalContentPreferencesTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> category = const Value.absent(),
                Value<String> deliverAt = const Value.absent(),
                Value<bool> isActive = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalContentPreferencesCompanion(
                category: category,
                deliverAt: deliverAt,
                isActive: isActive,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String category,
                Value<String> deliverAt = const Value.absent(),
                Value<bool> isActive = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalContentPreferencesCompanion.insert(
                category: category,
                deliverAt: deliverAt,
                isActive: isActive,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalContentPreferencesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalContentPreferencesTable,
      LocalContentPreference,
      $$LocalContentPreferencesTableFilterComposer,
      $$LocalContentPreferencesTableOrderingComposer,
      $$LocalContentPreferencesTableAnnotationComposer,
      $$LocalContentPreferencesTableCreateCompanionBuilder,
      $$LocalContentPreferencesTableUpdateCompanionBuilder,
      (
        LocalContentPreference,
        BaseReferences<
          _$AppDatabase,
          $LocalContentPreferencesTable,
          LocalContentPreference
        >,
      ),
      LocalContentPreference,
      PrefetchHooks Function()
    >;
typedef $$LocalRitualLogTableCreateCompanionBuilder =
    LocalRitualLogCompanion Function({
      required String id,
      required String ritualType,
      Value<int?> mood,
      Value<String?> gratitudeText,
      Value<String?> intentionText,
      Value<String?> reflectionText,
      Value<DateTime> completedAt,
      required DateTime ritualDate,
      Value<bool> needsSync,
      Value<int> rowid,
    });
typedef $$LocalRitualLogTableUpdateCompanionBuilder =
    LocalRitualLogCompanion Function({
      Value<String> id,
      Value<String> ritualType,
      Value<int?> mood,
      Value<String?> gratitudeText,
      Value<String?> intentionText,
      Value<String?> reflectionText,
      Value<DateTime> completedAt,
      Value<DateTime> ritualDate,
      Value<bool> needsSync,
      Value<int> rowid,
    });

class $$LocalRitualLogTableFilterComposer
    extends Composer<_$AppDatabase, $LocalRitualLogTable> {
  $$LocalRitualLogTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get ritualType => $composableBuilder(
    column: $table.ritualType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get mood => $composableBuilder(
    column: $table.mood,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get gratitudeText => $composableBuilder(
    column: $table.gratitudeText,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get intentionText => $composableBuilder(
    column: $table.intentionText,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get reflectionText => $composableBuilder(
    column: $table.reflectionText,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get ritualDate => $composableBuilder(
    column: $table.ritualDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalRitualLogTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalRitualLogTable> {
  $$LocalRitualLogTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get ritualType => $composableBuilder(
    column: $table.ritualType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get mood => $composableBuilder(
    column: $table.mood,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get gratitudeText => $composableBuilder(
    column: $table.gratitudeText,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get intentionText => $composableBuilder(
    column: $table.intentionText,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get reflectionText => $composableBuilder(
    column: $table.reflectionText,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get ritualDate => $composableBuilder(
    column: $table.ritualDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalRitualLogTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalRitualLogTable> {
  $$LocalRitualLogTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get ritualType => $composableBuilder(
    column: $table.ritualType,
    builder: (column) => column,
  );

  GeneratedColumn<int> get mood =>
      $composableBuilder(column: $table.mood, builder: (column) => column);

  GeneratedColumn<String> get gratitudeText => $composableBuilder(
    column: $table.gratitudeText,
    builder: (column) => column,
  );

  GeneratedColumn<String> get intentionText => $composableBuilder(
    column: $table.intentionText,
    builder: (column) => column,
  );

  GeneratedColumn<String> get reflectionText => $composableBuilder(
    column: $table.reflectionText,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get ritualDate => $composableBuilder(
    column: $table.ritualDate,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get needsSync =>
      $composableBuilder(column: $table.needsSync, builder: (column) => column);
}

class $$LocalRitualLogTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalRitualLogTable,
          LocalRitualLogData,
          $$LocalRitualLogTableFilterComposer,
          $$LocalRitualLogTableOrderingComposer,
          $$LocalRitualLogTableAnnotationComposer,
          $$LocalRitualLogTableCreateCompanionBuilder,
          $$LocalRitualLogTableUpdateCompanionBuilder,
          (
            LocalRitualLogData,
            BaseReferences<
              _$AppDatabase,
              $LocalRitualLogTable,
              LocalRitualLogData
            >,
          ),
          LocalRitualLogData,
          PrefetchHooks Function()
        > {
  $$LocalRitualLogTableTableManager(
    _$AppDatabase db,
    $LocalRitualLogTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalRitualLogTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalRitualLogTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalRitualLogTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> ritualType = const Value.absent(),
                Value<int?> mood = const Value.absent(),
                Value<String?> gratitudeText = const Value.absent(),
                Value<String?> intentionText = const Value.absent(),
                Value<String?> reflectionText = const Value.absent(),
                Value<DateTime> completedAt = const Value.absent(),
                Value<DateTime> ritualDate = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalRitualLogCompanion(
                id: id,
                ritualType: ritualType,
                mood: mood,
                gratitudeText: gratitudeText,
                intentionText: intentionText,
                reflectionText: reflectionText,
                completedAt: completedAt,
                ritualDate: ritualDate,
                needsSync: needsSync,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String ritualType,
                Value<int?> mood = const Value.absent(),
                Value<String?> gratitudeText = const Value.absent(),
                Value<String?> intentionText = const Value.absent(),
                Value<String?> reflectionText = const Value.absent(),
                Value<DateTime> completedAt = const Value.absent(),
                required DateTime ritualDate,
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalRitualLogCompanion.insert(
                id: id,
                ritualType: ritualType,
                mood: mood,
                gratitudeText: gratitudeText,
                intentionText: intentionText,
                reflectionText: reflectionText,
                completedAt: completedAt,
                ritualDate: ritualDate,
                needsSync: needsSync,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalRitualLogTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalRitualLogTable,
      LocalRitualLogData,
      $$LocalRitualLogTableFilterComposer,
      $$LocalRitualLogTableOrderingComposer,
      $$LocalRitualLogTableAnnotationComposer,
      $$LocalRitualLogTableCreateCompanionBuilder,
      $$LocalRitualLogTableUpdateCompanionBuilder,
      (
        LocalRitualLogData,
        BaseReferences<_$AppDatabase, $LocalRitualLogTable, LocalRitualLogData>,
      ),
      LocalRitualLogData,
      PrefetchHooks Function()
    >;
typedef $$LocalProgressSnapshotsTableCreateCompanionBuilder =
    LocalProgressSnapshotsCompanion Function({
      required String id,
      required DateTime snapshotDate,
      Value<int> tasksCreated,
      Value<int> tasksCompleted,
      Value<int> focusMinutes,
      Value<int> habitsDone,
      Value<int> pomodorosCompleted,
      Value<bool> needsSync,
      Value<int> rowid,
    });
typedef $$LocalProgressSnapshotsTableUpdateCompanionBuilder =
    LocalProgressSnapshotsCompanion Function({
      Value<String> id,
      Value<DateTime> snapshotDate,
      Value<int> tasksCreated,
      Value<int> tasksCompleted,
      Value<int> focusMinutes,
      Value<int> habitsDone,
      Value<int> pomodorosCompleted,
      Value<bool> needsSync,
      Value<int> rowid,
    });

class $$LocalProgressSnapshotsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalProgressSnapshotsTable> {
  $$LocalProgressSnapshotsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get snapshotDate => $composableBuilder(
    column: $table.snapshotDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get tasksCreated => $composableBuilder(
    column: $table.tasksCreated,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get tasksCompleted => $composableBuilder(
    column: $table.tasksCompleted,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get focusMinutes => $composableBuilder(
    column: $table.focusMinutes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get habitsDone => $composableBuilder(
    column: $table.habitsDone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get pomodorosCompleted => $composableBuilder(
    column: $table.pomodorosCompleted,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalProgressSnapshotsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalProgressSnapshotsTable> {
  $$LocalProgressSnapshotsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get snapshotDate => $composableBuilder(
    column: $table.snapshotDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get tasksCreated => $composableBuilder(
    column: $table.tasksCreated,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get tasksCompleted => $composableBuilder(
    column: $table.tasksCompleted,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get focusMinutes => $composableBuilder(
    column: $table.focusMinutes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get habitsDone => $composableBuilder(
    column: $table.habitsDone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get pomodorosCompleted => $composableBuilder(
    column: $table.pomodorosCompleted,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalProgressSnapshotsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalProgressSnapshotsTable> {
  $$LocalProgressSnapshotsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<DateTime> get snapshotDate => $composableBuilder(
    column: $table.snapshotDate,
    builder: (column) => column,
  );

  GeneratedColumn<int> get tasksCreated => $composableBuilder(
    column: $table.tasksCreated,
    builder: (column) => column,
  );

  GeneratedColumn<int> get tasksCompleted => $composableBuilder(
    column: $table.tasksCompleted,
    builder: (column) => column,
  );

  GeneratedColumn<int> get focusMinutes => $composableBuilder(
    column: $table.focusMinutes,
    builder: (column) => column,
  );

  GeneratedColumn<int> get habitsDone => $composableBuilder(
    column: $table.habitsDone,
    builder: (column) => column,
  );

  GeneratedColumn<int> get pomodorosCompleted => $composableBuilder(
    column: $table.pomodorosCompleted,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get needsSync =>
      $composableBuilder(column: $table.needsSync, builder: (column) => column);
}

class $$LocalProgressSnapshotsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalProgressSnapshotsTable,
          LocalProgressSnapshot,
          $$LocalProgressSnapshotsTableFilterComposer,
          $$LocalProgressSnapshotsTableOrderingComposer,
          $$LocalProgressSnapshotsTableAnnotationComposer,
          $$LocalProgressSnapshotsTableCreateCompanionBuilder,
          $$LocalProgressSnapshotsTableUpdateCompanionBuilder,
          (
            LocalProgressSnapshot,
            BaseReferences<
              _$AppDatabase,
              $LocalProgressSnapshotsTable,
              LocalProgressSnapshot
            >,
          ),
          LocalProgressSnapshot,
          PrefetchHooks Function()
        > {
  $$LocalProgressSnapshotsTableTableManager(
    _$AppDatabase db,
    $LocalProgressSnapshotsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalProgressSnapshotsTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$LocalProgressSnapshotsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalProgressSnapshotsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<DateTime> snapshotDate = const Value.absent(),
                Value<int> tasksCreated = const Value.absent(),
                Value<int> tasksCompleted = const Value.absent(),
                Value<int> focusMinutes = const Value.absent(),
                Value<int> habitsDone = const Value.absent(),
                Value<int> pomodorosCompleted = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalProgressSnapshotsCompanion(
                id: id,
                snapshotDate: snapshotDate,
                tasksCreated: tasksCreated,
                tasksCompleted: tasksCompleted,
                focusMinutes: focusMinutes,
                habitsDone: habitsDone,
                pomodorosCompleted: pomodorosCompleted,
                needsSync: needsSync,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required DateTime snapshotDate,
                Value<int> tasksCreated = const Value.absent(),
                Value<int> tasksCompleted = const Value.absent(),
                Value<int> focusMinutes = const Value.absent(),
                Value<int> habitsDone = const Value.absent(),
                Value<int> pomodorosCompleted = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalProgressSnapshotsCompanion.insert(
                id: id,
                snapshotDate: snapshotDate,
                tasksCreated: tasksCreated,
                tasksCompleted: tasksCompleted,
                focusMinutes: focusMinutes,
                habitsDone: habitsDone,
                pomodorosCompleted: pomodorosCompleted,
                needsSync: needsSync,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalProgressSnapshotsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalProgressSnapshotsTable,
      LocalProgressSnapshot,
      $$LocalProgressSnapshotsTableFilterComposer,
      $$LocalProgressSnapshotsTableOrderingComposer,
      $$LocalProgressSnapshotsTableAnnotationComposer,
      $$LocalProgressSnapshotsTableCreateCompanionBuilder,
      $$LocalProgressSnapshotsTableUpdateCompanionBuilder,
      (
        LocalProgressSnapshot,
        BaseReferences<
          _$AppDatabase,
          $LocalProgressSnapshotsTable,
          LocalProgressSnapshot
        >,
      ),
      LocalProgressSnapshot,
      PrefetchHooks Function()
    >;
typedef $$LocalPomodoroSessionsTableCreateCompanionBuilder =
    LocalPomodoroSessionsCompanion Function({
      required String id,
      Value<String?> taskId,
      required int durationSeconds,
      Value<int?> focusRating,
      Value<String?> ambientSound,
      required DateTime startedAt,
      Value<DateTime?> completedAt,
      Value<bool> needsSync,
      Value<int> rowid,
    });
typedef $$LocalPomodoroSessionsTableUpdateCompanionBuilder =
    LocalPomodoroSessionsCompanion Function({
      Value<String> id,
      Value<String?> taskId,
      Value<int> durationSeconds,
      Value<int?> focusRating,
      Value<String?> ambientSound,
      Value<DateTime> startedAt,
      Value<DateTime?> completedAt,
      Value<bool> needsSync,
      Value<int> rowid,
    });

class $$LocalPomodoroSessionsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalPomodoroSessionsTable> {
  $$LocalPomodoroSessionsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get durationSeconds => $composableBuilder(
    column: $table.durationSeconds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get focusRating => $composableBuilder(
    column: $table.focusRating,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get ambientSound => $composableBuilder(
    column: $table.ambientSound,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get startedAt => $composableBuilder(
    column: $table.startedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalPomodoroSessionsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalPomodoroSessionsTable> {
  $$LocalPomodoroSessionsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get durationSeconds => $composableBuilder(
    column: $table.durationSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get focusRating => $composableBuilder(
    column: $table.focusRating,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get ambientSound => $composableBuilder(
    column: $table.ambientSound,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get startedAt => $composableBuilder(
    column: $table.startedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalPomodoroSessionsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalPomodoroSessionsTable> {
  $$LocalPomodoroSessionsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  GeneratedColumn<int> get durationSeconds => $composableBuilder(
    column: $table.durationSeconds,
    builder: (column) => column,
  );

  GeneratedColumn<int> get focusRating => $composableBuilder(
    column: $table.focusRating,
    builder: (column) => column,
  );

  GeneratedColumn<String> get ambientSound => $composableBuilder(
    column: $table.ambientSound,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get startedAt =>
      $composableBuilder(column: $table.startedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get needsSync =>
      $composableBuilder(column: $table.needsSync, builder: (column) => column);
}

class $$LocalPomodoroSessionsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalPomodoroSessionsTable,
          LocalPomodoroSession,
          $$LocalPomodoroSessionsTableFilterComposer,
          $$LocalPomodoroSessionsTableOrderingComposer,
          $$LocalPomodoroSessionsTableAnnotationComposer,
          $$LocalPomodoroSessionsTableCreateCompanionBuilder,
          $$LocalPomodoroSessionsTableUpdateCompanionBuilder,
          (
            LocalPomodoroSession,
            BaseReferences<
              _$AppDatabase,
              $LocalPomodoroSessionsTable,
              LocalPomodoroSession
            >,
          ),
          LocalPomodoroSession,
          PrefetchHooks Function()
        > {
  $$LocalPomodoroSessionsTableTableManager(
    _$AppDatabase db,
    $LocalPomodoroSessionsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalPomodoroSessionsTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$LocalPomodoroSessionsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalPomodoroSessionsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String?> taskId = const Value.absent(),
                Value<int> durationSeconds = const Value.absent(),
                Value<int?> focusRating = const Value.absent(),
                Value<String?> ambientSound = const Value.absent(),
                Value<DateTime> startedAt = const Value.absent(),
                Value<DateTime?> completedAt = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalPomodoroSessionsCompanion(
                id: id,
                taskId: taskId,
                durationSeconds: durationSeconds,
                focusRating: focusRating,
                ambientSound: ambientSound,
                startedAt: startedAt,
                completedAt: completedAt,
                needsSync: needsSync,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                Value<String?> taskId = const Value.absent(),
                required int durationSeconds,
                Value<int?> focusRating = const Value.absent(),
                Value<String?> ambientSound = const Value.absent(),
                required DateTime startedAt,
                Value<DateTime?> completedAt = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalPomodoroSessionsCompanion.insert(
                id: id,
                taskId: taskId,
                durationSeconds: durationSeconds,
                focusRating: focusRating,
                ambientSound: ambientSound,
                startedAt: startedAt,
                completedAt: completedAt,
                needsSync: needsSync,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalPomodoroSessionsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalPomodoroSessionsTable,
      LocalPomodoroSession,
      $$LocalPomodoroSessionsTableFilterComposer,
      $$LocalPomodoroSessionsTableOrderingComposer,
      $$LocalPomodoroSessionsTableAnnotationComposer,
      $$LocalPomodoroSessionsTableCreateCompanionBuilder,
      $$LocalPomodoroSessionsTableUpdateCompanionBuilder,
      (
        LocalPomodoroSession,
        BaseReferences<
          _$AppDatabase,
          $LocalPomodoroSessionsTable,
          LocalPomodoroSession
        >,
      ),
      LocalPomodoroSession,
      PrefetchHooks Function()
    >;
typedef $$LocalGhostModeSessionsTableCreateCompanionBuilder =
    LocalGhostModeSessionsCompanion Function({
      required String id,
      required DateTime startedAt,
      Value<DateTime?> endedAt,
      Value<int> tasksCompleted,
      Value<int> focusMinutes,
      Value<int> rowid,
    });
typedef $$LocalGhostModeSessionsTableUpdateCompanionBuilder =
    LocalGhostModeSessionsCompanion Function({
      Value<String> id,
      Value<DateTime> startedAt,
      Value<DateTime?> endedAt,
      Value<int> tasksCompleted,
      Value<int> focusMinutes,
      Value<int> rowid,
    });

class $$LocalGhostModeSessionsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalGhostModeSessionsTable> {
  $$LocalGhostModeSessionsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get startedAt => $composableBuilder(
    column: $table.startedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get endedAt => $composableBuilder(
    column: $table.endedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get tasksCompleted => $composableBuilder(
    column: $table.tasksCompleted,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get focusMinutes => $composableBuilder(
    column: $table.focusMinutes,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalGhostModeSessionsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalGhostModeSessionsTable> {
  $$LocalGhostModeSessionsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get startedAt => $composableBuilder(
    column: $table.startedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get endedAt => $composableBuilder(
    column: $table.endedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get tasksCompleted => $composableBuilder(
    column: $table.tasksCompleted,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get focusMinutes => $composableBuilder(
    column: $table.focusMinutes,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalGhostModeSessionsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalGhostModeSessionsTable> {
  $$LocalGhostModeSessionsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<DateTime> get startedAt =>
      $composableBuilder(column: $table.startedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get endedAt =>
      $composableBuilder(column: $table.endedAt, builder: (column) => column);

  GeneratedColumn<int> get tasksCompleted => $composableBuilder(
    column: $table.tasksCompleted,
    builder: (column) => column,
  );

  GeneratedColumn<int> get focusMinutes => $composableBuilder(
    column: $table.focusMinutes,
    builder: (column) => column,
  );
}

class $$LocalGhostModeSessionsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalGhostModeSessionsTable,
          LocalGhostModeSession,
          $$LocalGhostModeSessionsTableFilterComposer,
          $$LocalGhostModeSessionsTableOrderingComposer,
          $$LocalGhostModeSessionsTableAnnotationComposer,
          $$LocalGhostModeSessionsTableCreateCompanionBuilder,
          $$LocalGhostModeSessionsTableUpdateCompanionBuilder,
          (
            LocalGhostModeSession,
            BaseReferences<
              _$AppDatabase,
              $LocalGhostModeSessionsTable,
              LocalGhostModeSession
            >,
          ),
          LocalGhostModeSession,
          PrefetchHooks Function()
        > {
  $$LocalGhostModeSessionsTableTableManager(
    _$AppDatabase db,
    $LocalGhostModeSessionsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalGhostModeSessionsTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$LocalGhostModeSessionsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalGhostModeSessionsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<DateTime> startedAt = const Value.absent(),
                Value<DateTime?> endedAt = const Value.absent(),
                Value<int> tasksCompleted = const Value.absent(),
                Value<int> focusMinutes = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalGhostModeSessionsCompanion(
                id: id,
                startedAt: startedAt,
                endedAt: endedAt,
                tasksCompleted: tasksCompleted,
                focusMinutes: focusMinutes,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required DateTime startedAt,
                Value<DateTime?> endedAt = const Value.absent(),
                Value<int> tasksCompleted = const Value.absent(),
                Value<int> focusMinutes = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalGhostModeSessionsCompanion.insert(
                id: id,
                startedAt: startedAt,
                endedAt: endedAt,
                tasksCompleted: tasksCompleted,
                focusMinutes: focusMinutes,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalGhostModeSessionsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalGhostModeSessionsTable,
      LocalGhostModeSession,
      $$LocalGhostModeSessionsTableFilterComposer,
      $$LocalGhostModeSessionsTableOrderingComposer,
      $$LocalGhostModeSessionsTableAnnotationComposer,
      $$LocalGhostModeSessionsTableCreateCompanionBuilder,
      $$LocalGhostModeSessionsTableUpdateCompanionBuilder,
      (
        LocalGhostModeSession,
        BaseReferences<
          _$AppDatabase,
          $LocalGhostModeSessionsTable,
          LocalGhostModeSession
        >,
      ),
      LocalGhostModeSession,
      PrefetchHooks Function()
    >;
typedef $$LocalStreaksTableCreateCompanionBuilder =
    LocalStreaksCompanion Function({
      required String id,
      Value<int> current,
      Value<int> longest,
      Value<DateTime?> lastActiveDate,
      Value<int> freezeUsed,
      Value<int> freezeAvailable,
      Value<bool> needsSync,
      Value<int> rowid,
    });
typedef $$LocalStreaksTableUpdateCompanionBuilder =
    LocalStreaksCompanion Function({
      Value<String> id,
      Value<int> current,
      Value<int> longest,
      Value<DateTime?> lastActiveDate,
      Value<int> freezeUsed,
      Value<int> freezeAvailable,
      Value<bool> needsSync,
      Value<int> rowid,
    });

class $$LocalStreaksTableFilterComposer
    extends Composer<_$AppDatabase, $LocalStreaksTable> {
  $$LocalStreaksTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get current => $composableBuilder(
    column: $table.current,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get longest => $composableBuilder(
    column: $table.longest,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastActiveDate => $composableBuilder(
    column: $table.lastActiveDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get freezeUsed => $composableBuilder(
    column: $table.freezeUsed,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get freezeAvailable => $composableBuilder(
    column: $table.freezeAvailable,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalStreaksTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalStreaksTable> {
  $$LocalStreaksTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get current => $composableBuilder(
    column: $table.current,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get longest => $composableBuilder(
    column: $table.longest,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastActiveDate => $composableBuilder(
    column: $table.lastActiveDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get freezeUsed => $composableBuilder(
    column: $table.freezeUsed,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get freezeAvailable => $composableBuilder(
    column: $table.freezeAvailable,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalStreaksTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalStreaksTable> {
  $$LocalStreaksTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get current =>
      $composableBuilder(column: $table.current, builder: (column) => column);

  GeneratedColumn<int> get longest =>
      $composableBuilder(column: $table.longest, builder: (column) => column);

  GeneratedColumn<DateTime> get lastActiveDate => $composableBuilder(
    column: $table.lastActiveDate,
    builder: (column) => column,
  );

  GeneratedColumn<int> get freezeUsed => $composableBuilder(
    column: $table.freezeUsed,
    builder: (column) => column,
  );

  GeneratedColumn<int> get freezeAvailable => $composableBuilder(
    column: $table.freezeAvailable,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get needsSync =>
      $composableBuilder(column: $table.needsSync, builder: (column) => column);
}

class $$LocalStreaksTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalStreaksTable,
          LocalStreak,
          $$LocalStreaksTableFilterComposer,
          $$LocalStreaksTableOrderingComposer,
          $$LocalStreaksTableAnnotationComposer,
          $$LocalStreaksTableCreateCompanionBuilder,
          $$LocalStreaksTableUpdateCompanionBuilder,
          (
            LocalStreak,
            BaseReferences<_$AppDatabase, $LocalStreaksTable, LocalStreak>,
          ),
          LocalStreak,
          PrefetchHooks Function()
        > {
  $$LocalStreaksTableTableManager(_$AppDatabase db, $LocalStreaksTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalStreaksTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalStreaksTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalStreaksTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<int> current = const Value.absent(),
                Value<int> longest = const Value.absent(),
                Value<DateTime?> lastActiveDate = const Value.absent(),
                Value<int> freezeUsed = const Value.absent(),
                Value<int> freezeAvailable = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalStreaksCompanion(
                id: id,
                current: current,
                longest: longest,
                lastActiveDate: lastActiveDate,
                freezeUsed: freezeUsed,
                freezeAvailable: freezeAvailable,
                needsSync: needsSync,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                Value<int> current = const Value.absent(),
                Value<int> longest = const Value.absent(),
                Value<DateTime?> lastActiveDate = const Value.absent(),
                Value<int> freezeUsed = const Value.absent(),
                Value<int> freezeAvailable = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalStreaksCompanion.insert(
                id: id,
                current: current,
                longest: longest,
                lastActiveDate: lastActiveDate,
                freezeUsed: freezeUsed,
                freezeAvailable: freezeAvailable,
                needsSync: needsSync,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalStreaksTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalStreaksTable,
      LocalStreak,
      $$LocalStreaksTableFilterComposer,
      $$LocalStreaksTableOrderingComposer,
      $$LocalStreaksTableAnnotationComposer,
      $$LocalStreaksTableCreateCompanionBuilder,
      $$LocalStreaksTableUpdateCompanionBuilder,
      (
        LocalStreak,
        BaseReferences<_$AppDatabase, $LocalStreaksTable, LocalStreak>,
      ),
      LocalStreak,
      PrefetchHooks Function()
    >;
typedef $$LocalPersonalBestsTableCreateCompanionBuilder =
    LocalPersonalBestsCompanion Function({
      required String id,
      required String metricKey,
      required int value,
      Value<String?> detail,
      Value<DateTime> achievedAt,
      Value<int> rowid,
    });
typedef $$LocalPersonalBestsTableUpdateCompanionBuilder =
    LocalPersonalBestsCompanion Function({
      Value<String> id,
      Value<String> metricKey,
      Value<int> value,
      Value<String?> detail,
      Value<DateTime> achievedAt,
      Value<int> rowid,
    });

class $$LocalPersonalBestsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalPersonalBestsTable> {
  $$LocalPersonalBestsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get metricKey => $composableBuilder(
    column: $table.metricKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get detail => $composableBuilder(
    column: $table.detail,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get achievedAt => $composableBuilder(
    column: $table.achievedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalPersonalBestsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalPersonalBestsTable> {
  $$LocalPersonalBestsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get metricKey => $composableBuilder(
    column: $table.metricKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get detail => $composableBuilder(
    column: $table.detail,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get achievedAt => $composableBuilder(
    column: $table.achievedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalPersonalBestsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalPersonalBestsTable> {
  $$LocalPersonalBestsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get metricKey =>
      $composableBuilder(column: $table.metricKey, builder: (column) => column);

  GeneratedColumn<int> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);

  GeneratedColumn<String> get detail =>
      $composableBuilder(column: $table.detail, builder: (column) => column);

  GeneratedColumn<DateTime> get achievedAt => $composableBuilder(
    column: $table.achievedAt,
    builder: (column) => column,
  );
}

class $$LocalPersonalBestsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalPersonalBestsTable,
          LocalPersonalBest,
          $$LocalPersonalBestsTableFilterComposer,
          $$LocalPersonalBestsTableOrderingComposer,
          $$LocalPersonalBestsTableAnnotationComposer,
          $$LocalPersonalBestsTableCreateCompanionBuilder,
          $$LocalPersonalBestsTableUpdateCompanionBuilder,
          (
            LocalPersonalBest,
            BaseReferences<
              _$AppDatabase,
              $LocalPersonalBestsTable,
              LocalPersonalBest
            >,
          ),
          LocalPersonalBest,
          PrefetchHooks Function()
        > {
  $$LocalPersonalBestsTableTableManager(
    _$AppDatabase db,
    $LocalPersonalBestsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalPersonalBestsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalPersonalBestsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalPersonalBestsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> metricKey = const Value.absent(),
                Value<int> value = const Value.absent(),
                Value<String?> detail = const Value.absent(),
                Value<DateTime> achievedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalPersonalBestsCompanion(
                id: id,
                metricKey: metricKey,
                value: value,
                detail: detail,
                achievedAt: achievedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String metricKey,
                required int value,
                Value<String?> detail = const Value.absent(),
                Value<DateTime> achievedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalPersonalBestsCompanion.insert(
                id: id,
                metricKey: metricKey,
                value: value,
                detail: detail,
                achievedAt: achievedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalPersonalBestsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalPersonalBestsTable,
      LocalPersonalBest,
      $$LocalPersonalBestsTableFilterComposer,
      $$LocalPersonalBestsTableOrderingComposer,
      $$LocalPersonalBestsTableAnnotationComposer,
      $$LocalPersonalBestsTableCreateCompanionBuilder,
      $$LocalPersonalBestsTableUpdateCompanionBuilder,
      (
        LocalPersonalBest,
        BaseReferences<
          _$AppDatabase,
          $LocalPersonalBestsTable,
          LocalPersonalBest
        >,
      ),
      LocalPersonalBest,
      PrefetchHooks Function()
    >;
typedef $$LocalTaskTemplatesTableCreateCompanionBuilder =
    LocalTaskTemplatesCompanion Function({
      required String id,
      required String name,
      Value<String?> description,
      Value<String?> fieldsJson,
      Value<String?> subtasksJson,
      Value<String> category,
      Value<bool> isSystem,
      Value<String?> userId,
      Value<String?> industryMode,
      Value<int> rowid,
    });
typedef $$LocalTaskTemplatesTableUpdateCompanionBuilder =
    LocalTaskTemplatesCompanion Function({
      Value<String> id,
      Value<String> name,
      Value<String?> description,
      Value<String?> fieldsJson,
      Value<String?> subtasksJson,
      Value<String> category,
      Value<bool> isSystem,
      Value<String?> userId,
      Value<String?> industryMode,
      Value<int> rowid,
    });

class $$LocalTaskTemplatesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalTaskTemplatesTable> {
  $$LocalTaskTemplatesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get fieldsJson => $composableBuilder(
    column: $table.fieldsJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get subtasksJson => $composableBuilder(
    column: $table.subtasksJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSystem => $composableBuilder(
    column: $table.isSystem,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get industryMode => $composableBuilder(
    column: $table.industryMode,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalTaskTemplatesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalTaskTemplatesTable> {
  $$LocalTaskTemplatesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get fieldsJson => $composableBuilder(
    column: $table.fieldsJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get subtasksJson => $composableBuilder(
    column: $table.subtasksJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSystem => $composableBuilder(
    column: $table.isSystem,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get industryMode => $composableBuilder(
    column: $table.industryMode,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalTaskTemplatesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalTaskTemplatesTable> {
  $$LocalTaskTemplatesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => column,
  );

  GeneratedColumn<String> get fieldsJson => $composableBuilder(
    column: $table.fieldsJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get subtasksJson => $composableBuilder(
    column: $table.subtasksJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get category =>
      $composableBuilder(column: $table.category, builder: (column) => column);

  GeneratedColumn<bool> get isSystem =>
      $composableBuilder(column: $table.isSystem, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get industryMode => $composableBuilder(
    column: $table.industryMode,
    builder: (column) => column,
  );
}

class $$LocalTaskTemplatesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalTaskTemplatesTable,
          LocalTaskTemplate,
          $$LocalTaskTemplatesTableFilterComposer,
          $$LocalTaskTemplatesTableOrderingComposer,
          $$LocalTaskTemplatesTableAnnotationComposer,
          $$LocalTaskTemplatesTableCreateCompanionBuilder,
          $$LocalTaskTemplatesTableUpdateCompanionBuilder,
          (
            LocalTaskTemplate,
            BaseReferences<
              _$AppDatabase,
              $LocalTaskTemplatesTable,
              LocalTaskTemplate
            >,
          ),
          LocalTaskTemplate,
          PrefetchHooks Function()
        > {
  $$LocalTaskTemplatesTableTableManager(
    _$AppDatabase db,
    $LocalTaskTemplatesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalTaskTemplatesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalTaskTemplatesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalTaskTemplatesTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String?> description = const Value.absent(),
                Value<String?> fieldsJson = const Value.absent(),
                Value<String?> subtasksJson = const Value.absent(),
                Value<String> category = const Value.absent(),
                Value<bool> isSystem = const Value.absent(),
                Value<String?> userId = const Value.absent(),
                Value<String?> industryMode = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalTaskTemplatesCompanion(
                id: id,
                name: name,
                description: description,
                fieldsJson: fieldsJson,
                subtasksJson: subtasksJson,
                category: category,
                isSystem: isSystem,
                userId: userId,
                industryMode: industryMode,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String name,
                Value<String?> description = const Value.absent(),
                Value<String?> fieldsJson = const Value.absent(),
                Value<String?> subtasksJson = const Value.absent(),
                Value<String> category = const Value.absent(),
                Value<bool> isSystem = const Value.absent(),
                Value<String?> userId = const Value.absent(),
                Value<String?> industryMode = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalTaskTemplatesCompanion.insert(
                id: id,
                name: name,
                description: description,
                fieldsJson: fieldsJson,
                subtasksJson: subtasksJson,
                category: category,
                isSystem: isSystem,
                userId: userId,
                industryMode: industryMode,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalTaskTemplatesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalTaskTemplatesTable,
      LocalTaskTemplate,
      $$LocalTaskTemplatesTableFilterComposer,
      $$LocalTaskTemplatesTableOrderingComposer,
      $$LocalTaskTemplatesTableAnnotationComposer,
      $$LocalTaskTemplatesTableCreateCompanionBuilder,
      $$LocalTaskTemplatesTableUpdateCompanionBuilder,
      (
        LocalTaskTemplate,
        BaseReferences<
          _$AppDatabase,
          $LocalTaskTemplatesTable,
          LocalTaskTemplate
        >,
      ),
      LocalTaskTemplate,
      PrefetchHooks Function()
    >;
typedef $$LocalRecurringRulesTableCreateCompanionBuilder =
    LocalRecurringRulesCompanion Function({
      required String id,
      required String taskId,
      required String rruleStr,
      Value<DateTime?> nextAt,
      Value<DateTime?> lastGeneratedAt,
      Value<int> rowid,
    });
typedef $$LocalRecurringRulesTableUpdateCompanionBuilder =
    LocalRecurringRulesCompanion Function({
      Value<String> id,
      Value<String> taskId,
      Value<String> rruleStr,
      Value<DateTime?> nextAt,
      Value<DateTime?> lastGeneratedAt,
      Value<int> rowid,
    });

class $$LocalRecurringRulesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalRecurringRulesTable> {
  $$LocalRecurringRulesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get rruleStr => $composableBuilder(
    column: $table.rruleStr,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get nextAt => $composableBuilder(
    column: $table.nextAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastGeneratedAt => $composableBuilder(
    column: $table.lastGeneratedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalRecurringRulesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalRecurringRulesTable> {
  $$LocalRecurringRulesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get rruleStr => $composableBuilder(
    column: $table.rruleStr,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get nextAt => $composableBuilder(
    column: $table.nextAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastGeneratedAt => $composableBuilder(
    column: $table.lastGeneratedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalRecurringRulesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalRecurringRulesTable> {
  $$LocalRecurringRulesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  GeneratedColumn<String> get rruleStr =>
      $composableBuilder(column: $table.rruleStr, builder: (column) => column);

  GeneratedColumn<DateTime> get nextAt =>
      $composableBuilder(column: $table.nextAt, builder: (column) => column);

  GeneratedColumn<DateTime> get lastGeneratedAt => $composableBuilder(
    column: $table.lastGeneratedAt,
    builder: (column) => column,
  );
}

class $$LocalRecurringRulesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalRecurringRulesTable,
          LocalRecurringRule,
          $$LocalRecurringRulesTableFilterComposer,
          $$LocalRecurringRulesTableOrderingComposer,
          $$LocalRecurringRulesTableAnnotationComposer,
          $$LocalRecurringRulesTableCreateCompanionBuilder,
          $$LocalRecurringRulesTableUpdateCompanionBuilder,
          (
            LocalRecurringRule,
            BaseReferences<
              _$AppDatabase,
              $LocalRecurringRulesTable,
              LocalRecurringRule
            >,
          ),
          LocalRecurringRule,
          PrefetchHooks Function()
        > {
  $$LocalRecurringRulesTableTableManager(
    _$AppDatabase db,
    $LocalRecurringRulesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalRecurringRulesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalRecurringRulesTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalRecurringRulesTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> taskId = const Value.absent(),
                Value<String> rruleStr = const Value.absent(),
                Value<DateTime?> nextAt = const Value.absent(),
                Value<DateTime?> lastGeneratedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalRecurringRulesCompanion(
                id: id,
                taskId: taskId,
                rruleStr: rruleStr,
                nextAt: nextAt,
                lastGeneratedAt: lastGeneratedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String taskId,
                required String rruleStr,
                Value<DateTime?> nextAt = const Value.absent(),
                Value<DateTime?> lastGeneratedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalRecurringRulesCompanion.insert(
                id: id,
                taskId: taskId,
                rruleStr: rruleStr,
                nextAt: nextAt,
                lastGeneratedAt: lastGeneratedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalRecurringRulesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalRecurringRulesTable,
      LocalRecurringRule,
      $$LocalRecurringRulesTableFilterComposer,
      $$LocalRecurringRulesTableOrderingComposer,
      $$LocalRecurringRulesTableAnnotationComposer,
      $$LocalRecurringRulesTableCreateCompanionBuilder,
      $$LocalRecurringRulesTableUpdateCompanionBuilder,
      (
        LocalRecurringRule,
        BaseReferences<
          _$AppDatabase,
          $LocalRecurringRulesTable,
          LocalRecurringRule
        >,
      ),
      LocalRecurringRule,
      PrefetchHooks Function()
    >;
typedef $$LocalRemindersTableCreateCompanionBuilder =
    LocalRemindersCompanion Function({
      required String id,
      required String taskId,
      required String channel,
      required int offsetMinutes,
      required DateTime scheduledAt,
      Value<DateTime?> sentAt,
      Value<String> status,
      Value<bool> needsSync,
      Value<int> rowid,
    });
typedef $$LocalRemindersTableUpdateCompanionBuilder =
    LocalRemindersCompanion Function({
      Value<String> id,
      Value<String> taskId,
      Value<String> channel,
      Value<int> offsetMinutes,
      Value<DateTime> scheduledAt,
      Value<DateTime?> sentAt,
      Value<String> status,
      Value<bool> needsSync,
      Value<int> rowid,
    });

class $$LocalRemindersTableFilterComposer
    extends Composer<_$AppDatabase, $LocalRemindersTable> {
  $$LocalRemindersTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get channel => $composableBuilder(
    column: $table.channel,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get offsetMinutes => $composableBuilder(
    column: $table.offsetMinutes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get scheduledAt => $composableBuilder(
    column: $table.scheduledAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get sentAt => $composableBuilder(
    column: $table.sentAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalRemindersTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalRemindersTable> {
  $$LocalRemindersTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get channel => $composableBuilder(
    column: $table.channel,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get offsetMinutes => $composableBuilder(
    column: $table.offsetMinutes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get scheduledAt => $composableBuilder(
    column: $table.scheduledAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get sentAt => $composableBuilder(
    column: $table.sentAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalRemindersTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalRemindersTable> {
  $$LocalRemindersTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  GeneratedColumn<String> get channel =>
      $composableBuilder(column: $table.channel, builder: (column) => column);

  GeneratedColumn<int> get offsetMinutes => $composableBuilder(
    column: $table.offsetMinutes,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get scheduledAt => $composableBuilder(
    column: $table.scheduledAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get sentAt =>
      $composableBuilder(column: $table.sentAt, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<bool> get needsSync =>
      $composableBuilder(column: $table.needsSync, builder: (column) => column);
}

class $$LocalRemindersTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalRemindersTable,
          LocalReminder,
          $$LocalRemindersTableFilterComposer,
          $$LocalRemindersTableOrderingComposer,
          $$LocalRemindersTableAnnotationComposer,
          $$LocalRemindersTableCreateCompanionBuilder,
          $$LocalRemindersTableUpdateCompanionBuilder,
          (
            LocalReminder,
            BaseReferences<_$AppDatabase, $LocalRemindersTable, LocalReminder>,
          ),
          LocalReminder,
          PrefetchHooks Function()
        > {
  $$LocalRemindersTableTableManager(
    _$AppDatabase db,
    $LocalRemindersTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalRemindersTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalRemindersTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalRemindersTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> taskId = const Value.absent(),
                Value<String> channel = const Value.absent(),
                Value<int> offsetMinutes = const Value.absent(),
                Value<DateTime> scheduledAt = const Value.absent(),
                Value<DateTime?> sentAt = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalRemindersCompanion(
                id: id,
                taskId: taskId,
                channel: channel,
                offsetMinutes: offsetMinutes,
                scheduledAt: scheduledAt,
                sentAt: sentAt,
                status: status,
                needsSync: needsSync,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String taskId,
                required String channel,
                required int offsetMinutes,
                required DateTime scheduledAt,
                Value<DateTime?> sentAt = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalRemindersCompanion.insert(
                id: id,
                taskId: taskId,
                channel: channel,
                offsetMinutes: offsetMinutes,
                scheduledAt: scheduledAt,
                sentAt: sentAt,
                status: status,
                needsSync: needsSync,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalRemindersTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalRemindersTable,
      LocalReminder,
      $$LocalRemindersTableFilterComposer,
      $$LocalRemindersTableOrderingComposer,
      $$LocalRemindersTableAnnotationComposer,
      $$LocalRemindersTableCreateCompanionBuilder,
      $$LocalRemindersTableUpdateCompanionBuilder,
      (
        LocalReminder,
        BaseReferences<_$AppDatabase, $LocalRemindersTable, LocalReminder>,
      ),
      LocalReminder,
      PrefetchHooks Function()
    >;
typedef $$LocalSubtasksTableCreateCompanionBuilder =
    LocalSubtasksCompanion Function({
      required String id,
      required String taskId,
      required String title,
      Value<bool> isCompleted,
      Value<int> sortOrder,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<bool> needsSync,
      Value<int> rowid,
    });
typedef $$LocalSubtasksTableUpdateCompanionBuilder =
    LocalSubtasksCompanion Function({
      Value<String> id,
      Value<String> taskId,
      Value<String> title,
      Value<bool> isCompleted,
      Value<int> sortOrder,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<bool> needsSync,
      Value<int> rowid,
    });

class $$LocalSubtasksTableFilterComposer
    extends Composer<_$AppDatabase, $LocalSubtasksTable> {
  $$LocalSubtasksTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isCompleted => $composableBuilder(
    column: $table.isCompleted,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalSubtasksTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalSubtasksTable> {
  $$LocalSubtasksTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isCompleted => $composableBuilder(
    column: $table.isCompleted,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalSubtasksTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalSubtasksTable> {
  $$LocalSubtasksTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<bool> get isCompleted => $composableBuilder(
    column: $table.isCompleted,
    builder: (column) => column,
  );

  GeneratedColumn<int> get sortOrder =>
      $composableBuilder(column: $table.sortOrder, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  GeneratedColumn<bool> get needsSync =>
      $composableBuilder(column: $table.needsSync, builder: (column) => column);
}

class $$LocalSubtasksTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalSubtasksTable,
          LocalSubtask,
          $$LocalSubtasksTableFilterComposer,
          $$LocalSubtasksTableOrderingComposer,
          $$LocalSubtasksTableAnnotationComposer,
          $$LocalSubtasksTableCreateCompanionBuilder,
          $$LocalSubtasksTableUpdateCompanionBuilder,
          (
            LocalSubtask,
            BaseReferences<_$AppDatabase, $LocalSubtasksTable, LocalSubtask>,
          ),
          LocalSubtask,
          PrefetchHooks Function()
        > {
  $$LocalSubtasksTableTableManager(_$AppDatabase db, $LocalSubtasksTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalSubtasksTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalSubtasksTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalSubtasksTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> taskId = const Value.absent(),
                Value<String> title = const Value.absent(),
                Value<bool> isCompleted = const Value.absent(),
                Value<int> sortOrder = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalSubtasksCompanion(
                id: id,
                taskId: taskId,
                title: title,
                isCompleted: isCompleted,
                sortOrder: sortOrder,
                createdAt: createdAt,
                updatedAt: updatedAt,
                needsSync: needsSync,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String taskId,
                required String title,
                Value<bool> isCompleted = const Value.absent(),
                Value<int> sortOrder = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalSubtasksCompanion.insert(
                id: id,
                taskId: taskId,
                title: title,
                isCompleted: isCompleted,
                sortOrder: sortOrder,
                createdAt: createdAt,
                updatedAt: updatedAt,
                needsSync: needsSync,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalSubtasksTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalSubtasksTable,
      LocalSubtask,
      $$LocalSubtasksTableFilterComposer,
      $$LocalSubtasksTableOrderingComposer,
      $$LocalSubtasksTableAnnotationComposer,
      $$LocalSubtasksTableCreateCompanionBuilder,
      $$LocalSubtasksTableUpdateCompanionBuilder,
      (
        LocalSubtask,
        BaseReferences<_$AppDatabase, $LocalSubtasksTable, LocalSubtask>,
      ),
      LocalSubtask,
      PrefetchHooks Function()
    >;
typedef $$LocalTagsTableCreateCompanionBuilder =
    LocalTagsCompanion Function({
      required String id,
      required String name,
      Value<String> color,
      Value<DateTime> createdAt,
      Value<int> rowid,
    });
typedef $$LocalTagsTableUpdateCompanionBuilder =
    LocalTagsCompanion Function({
      Value<String> id,
      Value<String> name,
      Value<String> color,
      Value<DateTime> createdAt,
      Value<int> rowid,
    });

class $$LocalTagsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalTagsTable> {
  $$LocalTagsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get color => $composableBuilder(
    column: $table.color,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalTagsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalTagsTable> {
  $$LocalTagsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get color => $composableBuilder(
    column: $table.color,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalTagsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalTagsTable> {
  $$LocalTagsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get color =>
      $composableBuilder(column: $table.color, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$LocalTagsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalTagsTable,
          LocalTag,
          $$LocalTagsTableFilterComposer,
          $$LocalTagsTableOrderingComposer,
          $$LocalTagsTableAnnotationComposer,
          $$LocalTagsTableCreateCompanionBuilder,
          $$LocalTagsTableUpdateCompanionBuilder,
          (LocalTag, BaseReferences<_$AppDatabase, $LocalTagsTable, LocalTag>),
          LocalTag,
          PrefetchHooks Function()
        > {
  $$LocalTagsTableTableManager(_$AppDatabase db, $LocalTagsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalTagsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalTagsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalTagsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String> color = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalTagsCompanion(
                id: id,
                name: name,
                color: color,
                createdAt: createdAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String name,
                Value<String> color = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalTagsCompanion.insert(
                id: id,
                name: name,
                color: color,
                createdAt: createdAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalTagsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalTagsTable,
      LocalTag,
      $$LocalTagsTableFilterComposer,
      $$LocalTagsTableOrderingComposer,
      $$LocalTagsTableAnnotationComposer,
      $$LocalTagsTableCreateCompanionBuilder,
      $$LocalTagsTableUpdateCompanionBuilder,
      (LocalTag, BaseReferences<_$AppDatabase, $LocalTagsTable, LocalTag>),
      LocalTag,
      PrefetchHooks Function()
    >;
typedef $$LocalTaskTagsTableCreateCompanionBuilder =
    LocalTaskTagsCompanion Function({
      required String taskId,
      required String tagId,
      Value<int> rowid,
    });
typedef $$LocalTaskTagsTableUpdateCompanionBuilder =
    LocalTaskTagsCompanion Function({
      Value<String> taskId,
      Value<String> tagId,
      Value<int> rowid,
    });

class $$LocalTaskTagsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalTaskTagsTable> {
  $$LocalTaskTagsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get tagId => $composableBuilder(
    column: $table.tagId,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalTaskTagsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalTaskTagsTable> {
  $$LocalTaskTagsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get tagId => $composableBuilder(
    column: $table.tagId,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalTaskTagsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalTaskTagsTable> {
  $$LocalTaskTagsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  GeneratedColumn<String> get tagId =>
      $composableBuilder(column: $table.tagId, builder: (column) => column);
}

class $$LocalTaskTagsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalTaskTagsTable,
          LocalTaskTag,
          $$LocalTaskTagsTableFilterComposer,
          $$LocalTaskTagsTableOrderingComposer,
          $$LocalTaskTagsTableAnnotationComposer,
          $$LocalTaskTagsTableCreateCompanionBuilder,
          $$LocalTaskTagsTableUpdateCompanionBuilder,
          (
            LocalTaskTag,
            BaseReferences<_$AppDatabase, $LocalTaskTagsTable, LocalTaskTag>,
          ),
          LocalTaskTag,
          PrefetchHooks Function()
        > {
  $$LocalTaskTagsTableTableManager(_$AppDatabase db, $LocalTaskTagsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalTaskTagsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalTaskTagsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalTaskTagsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> taskId = const Value.absent(),
                Value<String> tagId = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalTaskTagsCompanion(
                taskId: taskId,
                tagId: tagId,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String taskId,
                required String tagId,
                Value<int> rowid = const Value.absent(),
              }) => LocalTaskTagsCompanion.insert(
                taskId: taskId,
                tagId: tagId,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalTaskTagsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalTaskTagsTable,
      LocalTaskTag,
      $$LocalTaskTagsTableFilterComposer,
      $$LocalTaskTagsTableOrderingComposer,
      $$LocalTaskTagsTableAnnotationComposer,
      $$LocalTaskTagsTableCreateCompanionBuilder,
      $$LocalTaskTagsTableUpdateCompanionBuilder,
      (
        LocalTaskTag,
        BaseReferences<_$AppDatabase, $LocalTaskTagsTable, LocalTaskTag>,
      ),
      LocalTaskTag,
      PrefetchHooks Function()
    >;
typedef $$LocalTimeBlocksTableCreateCompanionBuilder =
    LocalTimeBlocksCompanion Function({
      required String id,
      required String taskId,
      required DateTime blockDate,
      required int startHour,
      required int startMinute,
      required int durationMinutes,
      Value<DateTime> createdAt,
      Value<bool> needsSync,
      Value<int> rowid,
    });
typedef $$LocalTimeBlocksTableUpdateCompanionBuilder =
    LocalTimeBlocksCompanion Function({
      Value<String> id,
      Value<String> taskId,
      Value<DateTime> blockDate,
      Value<int> startHour,
      Value<int> startMinute,
      Value<int> durationMinutes,
      Value<DateTime> createdAt,
      Value<bool> needsSync,
      Value<int> rowid,
    });

class $$LocalTimeBlocksTableFilterComposer
    extends Composer<_$AppDatabase, $LocalTimeBlocksTable> {
  $$LocalTimeBlocksTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get blockDate => $composableBuilder(
    column: $table.blockDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get startHour => $composableBuilder(
    column: $table.startHour,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get startMinute => $composableBuilder(
    column: $table.startMinute,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get durationMinutes => $composableBuilder(
    column: $table.durationMinutes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalTimeBlocksTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalTimeBlocksTable> {
  $$LocalTimeBlocksTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get blockDate => $composableBuilder(
    column: $table.blockDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get startHour => $composableBuilder(
    column: $table.startHour,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get startMinute => $composableBuilder(
    column: $table.startMinute,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get durationMinutes => $composableBuilder(
    column: $table.durationMinutes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get needsSync => $composableBuilder(
    column: $table.needsSync,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalTimeBlocksTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalTimeBlocksTable> {
  $$LocalTimeBlocksTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  GeneratedColumn<DateTime> get blockDate =>
      $composableBuilder(column: $table.blockDate, builder: (column) => column);

  GeneratedColumn<int> get startHour =>
      $composableBuilder(column: $table.startHour, builder: (column) => column);

  GeneratedColumn<int> get startMinute => $composableBuilder(
    column: $table.startMinute,
    builder: (column) => column,
  );

  GeneratedColumn<int> get durationMinutes => $composableBuilder(
    column: $table.durationMinutes,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<bool> get needsSync =>
      $composableBuilder(column: $table.needsSync, builder: (column) => column);
}

class $$LocalTimeBlocksTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalTimeBlocksTable,
          LocalTimeBlock,
          $$LocalTimeBlocksTableFilterComposer,
          $$LocalTimeBlocksTableOrderingComposer,
          $$LocalTimeBlocksTableAnnotationComposer,
          $$LocalTimeBlocksTableCreateCompanionBuilder,
          $$LocalTimeBlocksTableUpdateCompanionBuilder,
          (
            LocalTimeBlock,
            BaseReferences<
              _$AppDatabase,
              $LocalTimeBlocksTable,
              LocalTimeBlock
            >,
          ),
          LocalTimeBlock,
          PrefetchHooks Function()
        > {
  $$LocalTimeBlocksTableTableManager(
    _$AppDatabase db,
    $LocalTimeBlocksTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalTimeBlocksTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalTimeBlocksTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalTimeBlocksTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> taskId = const Value.absent(),
                Value<DateTime> blockDate = const Value.absent(),
                Value<int> startHour = const Value.absent(),
                Value<int> startMinute = const Value.absent(),
                Value<int> durationMinutes = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalTimeBlocksCompanion(
                id: id,
                taskId: taskId,
                blockDate: blockDate,
                startHour: startHour,
                startMinute: startMinute,
                durationMinutes: durationMinutes,
                createdAt: createdAt,
                needsSync: needsSync,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String taskId,
                required DateTime blockDate,
                required int startHour,
                required int startMinute,
                required int durationMinutes,
                Value<DateTime> createdAt = const Value.absent(),
                Value<bool> needsSync = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalTimeBlocksCompanion.insert(
                id: id,
                taskId: taskId,
                blockDate: blockDate,
                startHour: startHour,
                startMinute: startMinute,
                durationMinutes: durationMinutes,
                createdAt: createdAt,
                needsSync: needsSync,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalTimeBlocksTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalTimeBlocksTable,
      LocalTimeBlock,
      $$LocalTimeBlocksTableFilterComposer,
      $$LocalTimeBlocksTableOrderingComposer,
      $$LocalTimeBlocksTableAnnotationComposer,
      $$LocalTimeBlocksTableCreateCompanionBuilder,
      $$LocalTimeBlocksTableUpdateCompanionBuilder,
      (
        LocalTimeBlock,
        BaseReferences<_$AppDatabase, $LocalTimeBlocksTable, LocalTimeBlock>,
      ),
      LocalTimeBlock,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$LocalTasksTableTableManager get localTasks =>
      $$LocalTasksTableTableManager(_db, _db.localTasks);
  $$LocalProjectsTableTableManager get localProjects =>
      $$LocalProjectsTableTableManager(_db, _db.localProjects);
  $$LocalDailyContentTableTableManager get localDailyContent =>
      $$LocalDailyContentTableTableManager(_db, _db.localDailyContent);
  $$LocalContentPreferencesTableTableManager get localContentPreferences =>
      $$LocalContentPreferencesTableTableManager(
        _db,
        _db.localContentPreferences,
      );
  $$LocalRitualLogTableTableManager get localRitualLog =>
      $$LocalRitualLogTableTableManager(_db, _db.localRitualLog);
  $$LocalProgressSnapshotsTableTableManager get localProgressSnapshots =>
      $$LocalProgressSnapshotsTableTableManager(
        _db,
        _db.localProgressSnapshots,
      );
  $$LocalPomodoroSessionsTableTableManager get localPomodoroSessions =>
      $$LocalPomodoroSessionsTableTableManager(_db, _db.localPomodoroSessions);
  $$LocalGhostModeSessionsTableTableManager get localGhostModeSessions =>
      $$LocalGhostModeSessionsTableTableManager(
        _db,
        _db.localGhostModeSessions,
      );
  $$LocalStreaksTableTableManager get localStreaks =>
      $$LocalStreaksTableTableManager(_db, _db.localStreaks);
  $$LocalPersonalBestsTableTableManager get localPersonalBests =>
      $$LocalPersonalBestsTableTableManager(_db, _db.localPersonalBests);
  $$LocalTaskTemplatesTableTableManager get localTaskTemplates =>
      $$LocalTaskTemplatesTableTableManager(_db, _db.localTaskTemplates);
  $$LocalRecurringRulesTableTableManager get localRecurringRules =>
      $$LocalRecurringRulesTableTableManager(_db, _db.localRecurringRules);
  $$LocalRemindersTableTableManager get localReminders =>
      $$LocalRemindersTableTableManager(_db, _db.localReminders);
  $$LocalSubtasksTableTableManager get localSubtasks =>
      $$LocalSubtasksTableTableManager(_db, _db.localSubtasks);
  $$LocalTagsTableTableManager get localTags =>
      $$LocalTagsTableTableManager(_db, _db.localTags);
  $$LocalTaskTagsTableTableManager get localTaskTags =>
      $$LocalTaskTagsTableTableManager(_db, _db.localTaskTags);
  $$LocalTimeBlocksTableTableManager get localTimeBlocks =>
      $$LocalTimeBlocksTableTableManager(_db, _db.localTimeBlocks);
}
