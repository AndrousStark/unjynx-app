import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Bottom sheet for setting a location-based reminder on a task.
///
/// Phase 10 feature: "Remind me when I arrive at / leave from [place]".
/// Uses the platform's geocoding to search places. Stores the geofence
/// trigger (arrive/leave + lat/lng/radius) in the task metadata.
///
/// Requires: geolocator + geocoding packages (add when integrating).
/// For now, this is a UI-ready sheet with place search + trigger selection.
class LocationReminderSheet extends StatefulWidget {
  const LocationReminderSheet({
    required this.taskId,
    required this.taskTitle,
    required this.onSave,
    super.key,
  });

  final String taskId;
  final String taskTitle;
  final void Function({
    required String placeName,
    required double latitude,
    required double longitude,
    required double radiusMeters,
    required String trigger, // 'arrive' or 'leave'
  })
  onSave;

  @override
  State<LocationReminderSheet> createState() => _LocationReminderSheetState();
}

class _LocationReminderSheetState extends State<LocationReminderSheet> {
  final _searchController = TextEditingController();
  String _trigger = 'arrive';
  double _radius = 200;
  String? _selectedPlace;
  double? _lat;
  double? _lng;

  // Placeholder places (would be replaced with geocoding API)
  static const _recentPlaces = [
    {'name': 'Home', 'lat': 28.6139, 'lng': 77.2090},
    {'name': 'Office', 'lat': 28.6280, 'lng': 77.2190},
    {'name': 'Gym', 'lat': 28.6200, 'lng': 77.2100},
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _selectPlace(String name, double lat, double lng) {
    HapticFeedback.selectionClick();
    setState(() {
      _selectedPlace = name;
      _lat = lat;
      _lng = lng;
    });
  }

  void _save() {
    if (_selectedPlace == null || _lat == null || _lng == null) return;
    HapticFeedback.mediumImpact();
    widget.onSave(
      placeName: _selectedPlace!,
      latitude: _lat!,
      longitude: _lng!,
      radiusMeters: _radius,
      trigger: _trigger,
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            children: [
              Icon(
                Icons.location_on_rounded,
                color: colorScheme.primary,
                size: 24,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Location Reminder',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'for "${widget.taskTitle}"',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Trigger toggle
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(
                value: 'arrive',
                label: Text('When I arrive'),
                icon: Icon(Icons.login_rounded),
              ),
              ButtonSegment(
                value: 'leave',
                label: Text('When I leave'),
                icon: Icon(Icons.logout_rounded),
              ),
            ],
            selected: {_trigger},
            onSelectionChanged: (s) {
              HapticFeedback.selectionClick();
              setState(() => _trigger = s.first);
            },
          ),
          const SizedBox(height: 16),

          // Place search
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search for a place...',
              prefixIcon: const Icon(Icons.search_rounded),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              isDense: true,
            ),
          ),
          const SizedBox(height: 12),

          // Recent places
          Text(
            'Recent Places',
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          ...(_recentPlaces.map((place) {
            final name = place['name'] as String;
            final isSelected = _selectedPlace == name;
            return Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: ListTile(
                onTap: () => _selectPlace(
                  name,
                  place['lat']! as double,
                  place['lng']! as double,
                ),
                leading: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? colorScheme.primary.withValues(alpha: 0.15)
                        : colorScheme.surfaceContainerHighest.withValues(
                            alpha: 0.3,
                          ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.place_rounded,
                    size: 18,
                    color: isSelected
                        ? colorScheme.primary
                        : colorScheme.onSurfaceVariant,
                  ),
                ),
                title: Text(
                  name,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
                trailing: isSelected
                    ? Icon(
                        Icons.check_circle_rounded,
                        color: colorScheme.primary,
                        size: 20,
                      )
                    : null,
                dense: true,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color: isSelected
                        ? colorScheme.primary.withValues(alpha: 0.3)
                        : colorScheme.outlineVariant.withValues(alpha: 0.3),
                  ),
                ),
              ),
            );
          })),
          const SizedBox(height: 12),

          // Radius slider
          Row(
            children: [
              Text(
                'Radius: ${_radius.toInt()}m',
                style: theme.textTheme.labelMedium,
              ),
              Expanded(
                child: Slider(
                  value: _radius,
                  min: 50,
                  max: 1000,
                  divisions: 19,
                  onChanged: (v) => setState(() => _radius = v),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Save button
          FilledButton.icon(
            onPressed: _selectedPlace != null ? _save : null,
            icon: const Icon(Icons.notifications_active_rounded),
            label: Text(
              _selectedPlace != null
                  ? 'Remind me when I $_trigger $_selectedPlace'
                  : 'Select a place first',
            ),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
