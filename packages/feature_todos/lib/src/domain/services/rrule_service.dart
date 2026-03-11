/// RRULE (RFC 5545) service for recurring task management.
///
/// Supports building, parsing, and previewing recurrence rules.
/// v1: Pure Dart implementation covering common patterns.

/// Frequency unit for recurrence.
enum RRuleFrequency {
  daily,
  weekly,
  monthly,
  yearly,
}

/// End condition for recurrence.
sealed class RRuleEnd {
  const RRuleEnd();
}

class RRuleNever extends RRuleEnd {
  const RRuleNever();
}

class RRuleAfterCount extends RRuleEnd {
  final int count;
  const RRuleAfterCount(this.count);
}

class RRuleUntilDate extends RRuleEnd {
  final DateTime until;
  const RRuleUntilDate(this.until);
}

/// Immutable recurrence rule definition.
class RecurrenceRule {
  final RRuleFrequency frequency;
  final int interval;
  final Set<int> byWeekDay; // 1=Mon ... 7=Sun (ISO 8601)
  final int? byMonthDay; // 1-31
  final int? byMonth; // 1-12
  final RRuleEnd end;

  const RecurrenceRule({
    required this.frequency,
    this.interval = 1,
    this.byWeekDay = const {},
    this.byMonthDay,
    this.byMonth,
    this.end = const RRuleNever(),
  });

  /// Create a copy with updated fields.
  RecurrenceRule copyWith({
    RRuleFrequency? frequency,
    int? interval,
    Set<int>? byWeekDay,
    int? byMonthDay,
    int? byMonth,
    RRuleEnd? end,
  }) {
    return RecurrenceRule(
      frequency: frequency ?? this.frequency,
      interval: interval ?? this.interval,
      byWeekDay: byWeekDay ?? this.byWeekDay,
      byMonthDay: byMonthDay ?? this.byMonthDay,
      byMonth: byMonth ?? this.byMonth,
      end: end ?? this.end,
    );
  }

  /// Whether this rule has any content.
  bool get isEmpty =>
      frequency == RRuleFrequency.daily &&
      interval == 1 &&
      byWeekDay.isEmpty &&
      byMonthDay == null;
}

/// Common presets for quick selection.
class RRulePresets {
  const RRulePresets._();

  static const daily = RecurrenceRule(
    frequency: RRuleFrequency.daily,
  );

  static const weekdays = RecurrenceRule(
    frequency: RRuleFrequency.weekly,
    byWeekDay: {1, 2, 3, 4, 5},
  );

  static const weekly = RecurrenceRule(
    frequency: RRuleFrequency.weekly,
  );

  static const biweekly = RecurrenceRule(
    frequency: RRuleFrequency.weekly,
    interval: 2,
  );

  static const monthly = RecurrenceRule(
    frequency: RRuleFrequency.monthly,
  );

  static const yearly = RecurrenceRule(
    frequency: RRuleFrequency.yearly,
  );
}

/// Service for RRULE string generation, parsing, and occurrence preview.
class RRuleService {
  const RRuleService();

  /// Convert a [RecurrenceRule] to an RFC 5545 RRULE string.
  String toRRuleString(RecurrenceRule rule) {
    final parts = <String>[];

    parts.add('FREQ=${_frequencyToString(rule.frequency)}');

    if (rule.interval > 1) {
      parts.add('INTERVAL=${rule.interval}');
    }

    if (rule.byWeekDay.isNotEmpty) {
      final days = rule.byWeekDay.toList()..sort();
      final dayStrs = days.map(_weekdayToString).join(',');
      parts.add('BYDAY=$dayStrs');
    }

    if (rule.byMonthDay != null) {
      parts.add('BYMONTHDAY=${rule.byMonthDay}');
    }

    if (rule.byMonth != null) {
      parts.add('BYMONTH=${rule.byMonth}');
    }

    switch (rule.end) {
      case RRuleNever():
        break;
      case RRuleAfterCount(:final count):
        parts.add('COUNT=$count');
      case RRuleUntilDate(:final until):
        parts.add('UNTIL=${_formatDate(until)}');
    }

    return parts.join(';');
  }

  /// Parse an RFC 5545 RRULE string into a [RecurrenceRule].
  RecurrenceRule parseRRuleString(String rrule) {
    final cleaned = rrule.replaceFirst('RRULE:', '');
    final parts = cleaned.split(';');
    final map = <String, String>{};
    for (final part in parts) {
      final kv = part.split('=');
      if (kv.length == 2) {
        map[kv[0].toUpperCase()] = kv[1];
      }
    }

    final frequency = _parseFrequency(map['FREQ'] ?? 'DAILY');
    final interval = int.tryParse(map['INTERVAL'] ?? '1') ?? 1;

    final byWeekDay = <int>{};
    if (map.containsKey('BYDAY')) {
      for (final day in map['BYDAY']!.split(',')) {
        final d = _parseWeekday(day.trim());
        if (d != null) byWeekDay.add(d);
      }
    }

    final byMonthDay = int.tryParse(map['BYMONTHDAY'] ?? '');
    final byMonth = int.tryParse(map['BYMONTH'] ?? '');

    RRuleEnd end = const RRuleNever();
    if (map.containsKey('COUNT')) {
      final count = int.tryParse(map['COUNT']!);
      if (count != null) end = RRuleAfterCount(count);
    } else if (map.containsKey('UNTIL')) {
      final until = _parseDate(map['UNTIL']!);
      if (until != null) end = RRuleUntilDate(until);
    }

    return RecurrenceRule(
      frequency: frequency,
      interval: interval,
      byWeekDay: byWeekDay,
      byMonthDay: byMonthDay,
      byMonth: byMonth,
      end: end,
    );
  }

  /// Generate the next [count] occurrences starting from [startDate].
  List<DateTime> getNextOccurrences(
    RecurrenceRule rule,
    DateTime startDate, {
    int count = 5,
  }) {
    final results = <DateTime>[];
    var current = startDate;
    var generated = 0;
    final maxIterations = count * 100; // safety limit
    var iterations = 0;

    while (results.length < count && iterations < maxIterations) {
      iterations++;

      // For the first iteration, check if startDate itself matches
      if (iterations == 1) {
        if (_matchesRule(rule, current)) {
          results.add(current);
          generated++;
          if (_shouldStop(rule, generated, current)) break;
        }
        current = _advance(rule, current);
        continue;
      }

      if (_matchesRule(rule, current)) {
        results.add(current);
        generated++;
        if (_shouldStop(rule, generated, current)) break;
      }

      current = _advance(rule, current);
    }

    return results;
  }

  /// Human-readable description of the rule.
  String describe(RecurrenceRule rule) {
    final buffer = StringBuffer('Every ');

    if (rule.interval > 1) {
      buffer.write('${rule.interval} ');
    }

    switch (rule.frequency) {
      case RRuleFrequency.daily:
        buffer.write(rule.interval > 1 ? 'days' : 'day');
      case RRuleFrequency.weekly:
        buffer.write(rule.interval > 1 ? 'weeks' : 'week');
        if (rule.byWeekDay.isNotEmpty) {
          final days = rule.byWeekDay.toList()..sort();
          final names = days.map(_weekdayName).join(', ');
          buffer.write(' on $names');
        }
      case RRuleFrequency.monthly:
        buffer.write(rule.interval > 1 ? 'months' : 'month');
        if (rule.byMonthDay != null) {
          buffer.write(' on the ${_ordinal(rule.byMonthDay!)}');
        }
      case RRuleFrequency.yearly:
        buffer.write(rule.interval > 1 ? 'years' : 'year');
    }

    switch (rule.end) {
      case RRuleNever():
        break;
      case RRuleAfterCount(:final count):
        buffer.write(', $count times');
      case RRuleUntilDate(:final until):
        buffer.write(', until ${_formatReadableDate(until)}');
    }

    return buffer.toString();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  bool _matchesRule(RecurrenceRule rule, DateTime date) {
    if (rule.byWeekDay.isNotEmpty) {
      if (!rule.byWeekDay.contains(date.weekday)) return false;
    }
    if (rule.byMonthDay != null && date.day != rule.byMonthDay) {
      return false;
    }
    if (rule.byMonth != null && date.month != rule.byMonth) {
      return false;
    }
    return true;
  }

  bool _shouldStop(RecurrenceRule rule, int generated, DateTime current) {
    return switch (rule.end) {
      RRuleNever() => false,
      RRuleAfterCount(:final count) => generated >= count,
      RRuleUntilDate(:final until) => !current.isBefore(until),
    };
  }

  DateTime _advance(RecurrenceRule rule, DateTime current) {
    // For weekly with specific days, advance by 1 day to check each day
    if (rule.frequency == RRuleFrequency.weekly &&
        rule.byWeekDay.isNotEmpty) {
      return current.add(const Duration(days: 1));
    }

    return switch (rule.frequency) {
      RRuleFrequency.daily =>
        current.add(Duration(days: rule.interval)),
      RRuleFrequency.weekly =>
        current.add(Duration(days: 7 * rule.interval)),
      RRuleFrequency.monthly => DateTime(
          current.year,
          current.month + rule.interval,
          current.day,
          current.hour,
          current.minute,
        ),
      RRuleFrequency.yearly => DateTime(
          current.year + rule.interval,
          current.month,
          current.day,
          current.hour,
          current.minute,
        ),
    };
  }

  String _frequencyToString(RRuleFrequency freq) {
    return switch (freq) {
      RRuleFrequency.daily => 'DAILY',
      RRuleFrequency.weekly => 'WEEKLY',
      RRuleFrequency.monthly => 'MONTHLY',
      RRuleFrequency.yearly => 'YEARLY',
    };
  }

  RRuleFrequency _parseFrequency(String value) {
    return switch (value.toUpperCase()) {
      'DAILY' => RRuleFrequency.daily,
      'WEEKLY' => RRuleFrequency.weekly,
      'MONTHLY' => RRuleFrequency.monthly,
      'YEARLY' => RRuleFrequency.yearly,
      _ => RRuleFrequency.daily,
    };
  }

  String _weekdayToString(int day) {
    return switch (day) {
      1 => 'MO',
      2 => 'TU',
      3 => 'WE',
      4 => 'TH',
      5 => 'FR',
      6 => 'SA',
      7 => 'SU',
      _ => 'MO',
    };
  }

  int? _parseWeekday(String value) {
    return switch (value.toUpperCase()) {
      'MO' => 1,
      'TU' => 2,
      'WE' => 3,
      'TH' => 4,
      'FR' => 5,
      'SA' => 6,
      'SU' => 7,
      _ => null,
    };
  }

  String _weekdayName(int day) {
    return switch (day) {
      1 => 'Mon',
      2 => 'Tue',
      3 => 'Wed',
      4 => 'Thu',
      5 => 'Fri',
      6 => 'Sat',
      7 => 'Sun',
      _ => '?',
    };
  }

  String _formatDate(DateTime date) {
    final y = date.year.toString().padLeft(4, '0');
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '${y}${m}${d}T000000Z';
  }

  DateTime? _parseDate(String value) {
    // Format: YYYYMMDDTHHMMSSZ or YYYYMMDD
    final cleaned = value.replaceAll('T', '').replaceAll('Z', '');
    if (cleaned.length < 8) return null;

    final year = int.tryParse(cleaned.substring(0, 4));
    final month = int.tryParse(cleaned.substring(4, 6));
    final day = int.tryParse(cleaned.substring(6, 8));

    if (year == null || month == null || day == null) return null;
    return DateTime(year, month, day);
  }

  String _formatReadableDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  String _ordinal(int n) {
    if (n >= 11 && n <= 13) return '${n}th';
    return switch (n % 10) {
      1 => '${n}st',
      2 => '${n}nd',
      3 => '${n}rd',
      _ => '${n}th',
    };
  }
}
