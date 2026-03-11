import 'package:feature_todos/src/domain/services/rrule_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = RRuleService();

  group('toRRuleString', () {
    test('daily rule', () {
      expect(
        service.toRRuleString(RRulePresets.daily),
        'FREQ=DAILY',
      );
    });

    test('weekdays rule', () {
      final str = service.toRRuleString(RRulePresets.weekdays);
      expect(str, contains('FREQ=WEEKLY'));
      expect(str, contains('BYDAY=MO,TU,WE,TH,FR'));
    });

    test('biweekly rule', () {
      expect(
        service.toRRuleString(RRulePresets.biweekly),
        'FREQ=WEEKLY;INTERVAL=2',
      );
    });

    test('monthly rule', () {
      expect(
        service.toRRuleString(RRulePresets.monthly),
        'FREQ=MONTHLY',
      );
    });

    test('yearly rule', () {
      expect(
        service.toRRuleString(RRulePresets.yearly),
        'FREQ=YEARLY',
      );
    });

    test('with COUNT end', () {
      final rule = RRulePresets.daily.copyWith(
        end: const RRuleAfterCount(10),
      );
      expect(
        service.toRRuleString(rule),
        'FREQ=DAILY;COUNT=10',
      );
    });

    test('with UNTIL end', () {
      final rule = RRulePresets.weekly.copyWith(
        end: RRuleUntilDate(DateTime(2026, 12, 31)),
      );
      final str = service.toRRuleString(rule);
      expect(str, contains('FREQ=WEEKLY'));
      expect(str, contains('UNTIL=20261231T000000Z'));
    });

    test('custom interval', () {
      final rule = RecurrenceRule(
        frequency: RRuleFrequency.daily,
        interval: 3,
      );
      expect(
        service.toRRuleString(rule),
        'FREQ=DAILY;INTERVAL=3',
      );
    });

    test('monthly with byMonthDay', () {
      final rule = RecurrenceRule(
        frequency: RRuleFrequency.monthly,
        byMonthDay: 15,
      );
      expect(
        service.toRRuleString(rule),
        'FREQ=MONTHLY;BYMONTHDAY=15',
      );
    });
  });

  group('parseRRuleString', () {
    test('parses daily', () {
      final rule = service.parseRRuleString('FREQ=DAILY');
      expect(rule.frequency, RRuleFrequency.daily);
      expect(rule.interval, 1);
    });

    test('parses weekly with days', () {
      final rule = service.parseRRuleString(
        'FREQ=WEEKLY;BYDAY=MO,WE,FR',
      );
      expect(rule.frequency, RRuleFrequency.weekly);
      expect(rule.byWeekDay, {1, 3, 5});
    });

    test('parses with interval', () {
      final rule = service.parseRRuleString('FREQ=WEEKLY;INTERVAL=2');
      expect(rule.interval, 2);
    });

    test('parses COUNT', () {
      final rule = service.parseRRuleString('FREQ=DAILY;COUNT=5');
      expect(rule.end, isA<RRuleAfterCount>());
      expect((rule.end as RRuleAfterCount).count, 5);
    });

    test('parses UNTIL', () {
      final rule = service.parseRRuleString(
        'FREQ=MONTHLY;UNTIL=20261231T000000Z',
      );
      expect(rule.end, isA<RRuleUntilDate>());
      final until = (rule.end as RRuleUntilDate).until;
      expect(until.year, 2026);
      expect(until.month, 12);
      expect(until.day, 31);
    });

    test('parses BYMONTHDAY', () {
      final rule = service.parseRRuleString('FREQ=MONTHLY;BYMONTHDAY=15');
      expect(rule.byMonthDay, 15);
    });

    test('strips RRULE: prefix', () {
      final rule = service.parseRRuleString('RRULE:FREQ=DAILY;INTERVAL=2');
      expect(rule.frequency, RRuleFrequency.daily);
      expect(rule.interval, 2);
    });

    test('roundtrip: parse(toRRuleString(x)) == x', () {
      for (final preset in [
        RRulePresets.daily,
        RRulePresets.weekdays,
        RRulePresets.biweekly,
        RRulePresets.monthly,
        RRulePresets.yearly,
      ]) {
        final str = service.toRRuleString(preset);
        final parsed = service.parseRRuleString(str);
        expect(parsed.frequency, preset.frequency);
        expect(parsed.interval, preset.interval);
        expect(parsed.byWeekDay, preset.byWeekDay);
      }
    });
  });

  group('getNextOccurrences', () {
    test('daily generates consecutive days', () {
      final start = DateTime(2026, 3, 10);
      final dates = service.getNextOccurrences(
        RRulePresets.daily,
        start,
        count: 3,
      );
      expect(dates.length, 3);
      expect(dates[0], DateTime(2026, 3, 10));
      expect(dates[1], DateTime(2026, 3, 11));
      expect(dates[2], DateTime(2026, 3, 12));
    });

    test('weekly generates 7-day intervals', () {
      final start = DateTime(2026, 3, 10); // Tuesday
      final dates = service.getNextOccurrences(
        RRulePresets.weekly,
        start,
        count: 3,
      );
      expect(dates.length, 3);
      expect(dates[0], DateTime(2026, 3, 10));
      expect(dates[1], DateTime(2026, 3, 17));
      expect(dates[2], DateTime(2026, 3, 24));
    });

    test('weekdays skips weekends', () {
      final start = DateTime(2026, 3, 9); // Monday
      final dates = service.getNextOccurrences(
        RRulePresets.weekdays,
        start,
        count: 5,
      );
      expect(dates.length, 5);
      // Should be Mon-Fri of the same week
      for (final d in dates) {
        expect(d.weekday, lessThanOrEqualTo(5));
      }
    });

    test('respects COUNT limit', () {
      final rule = RRulePresets.daily.copyWith(
        end: const RRuleAfterCount(3),
      );
      final dates = service.getNextOccurrences(
        rule,
        DateTime(2026, 3, 10),
        count: 10,
      );
      expect(dates.length, 3);
    });

    test('respects UNTIL limit', () {
      final rule = RRulePresets.daily.copyWith(
        end: RRuleUntilDate(DateTime(2026, 3, 12)),
      );
      final dates = service.getNextOccurrences(
        rule,
        DateTime(2026, 3, 10),
        count: 10,
      );
      expect(dates.length, 3); // 10, 11, 12
    });

    test('biweekly generates 14-day intervals', () {
      final start = DateTime(2026, 3, 10);
      final dates = service.getNextOccurrences(
        RRulePresets.biweekly,
        start,
        count: 3,
      );
      expect(dates[1].difference(dates[0]).inDays, 14);
    });
  });

  group('describe', () {
    test('daily', () {
      expect(service.describe(RRulePresets.daily), 'Every day');
    });

    test('weekdays', () {
      final desc = service.describe(RRulePresets.weekdays);
      expect(desc, contains('Every week'));
      expect(desc, contains('Mon'));
      expect(desc, contains('Fri'));
    });

    test('biweekly', () {
      expect(
        service.describe(RRulePresets.biweekly),
        'Every 2 weeks',
      );
    });

    test('monthly', () {
      expect(service.describe(RRulePresets.monthly), 'Every month');
    });

    test('yearly', () {
      expect(service.describe(RRulePresets.yearly), 'Every year');
    });

    test('with count', () {
      final rule = RRulePresets.daily.copyWith(
        end: const RRuleAfterCount(10),
      );
      expect(service.describe(rule), 'Every day, 10 times');
    });

    test('every 3 days', () {
      final rule = RecurrenceRule(
        frequency: RRuleFrequency.daily,
        interval: 3,
      );
      expect(service.describe(rule), 'Every 3 days');
    });

    test('monthly on 15th', () {
      final rule = RecurrenceRule(
        frequency: RRuleFrequency.monthly,
        byMonthDay: 15,
      );
      expect(service.describe(rule), 'Every month on the 15th');
    });
  });

  group('RecurrenceRule', () {
    test('copyWith preserves unchanged fields', () {
      const rule = RecurrenceRule(
        frequency: RRuleFrequency.weekly,
        interval: 2,
        byWeekDay: {1, 3},
      );
      final updated = rule.copyWith(interval: 3);
      expect(updated.frequency, RRuleFrequency.weekly);
      expect(updated.interval, 3);
      expect(updated.byWeekDay, {1, 3});
    });

    test('isEmpty detects default daily rule', () {
      expect(RRulePresets.daily.isEmpty, isTrue);
      expect(RRulePresets.weekdays.isEmpty, isFalse);
    });
  });
}
