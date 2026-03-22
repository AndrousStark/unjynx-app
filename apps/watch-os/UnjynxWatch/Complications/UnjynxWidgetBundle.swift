import WidgetKit
import SwiftUI

/// Bundle that registers all UNJYNX watch face complications.
@main
struct UnjynxWidgetBundle: WidgetBundle {
    var body: some Widget {
        TasksLeftComplication()
        StreakComplication()
        NextTaskComplication()
        ProgressRingsComplication()
    }
}
