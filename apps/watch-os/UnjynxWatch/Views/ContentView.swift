import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var viewModel: WatchViewModel
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            TaskListView()
                .tag(0)

            ProgressRingsView()
                .tag(1)

            StreakView()
                .tag(2)
        }
        .tabViewStyle(.verticalPage)
        .background(Color.unjynxMidnight)
        .task {
            await viewModel.onAppear()
        }
        .onDisappear {
            viewModel.onDisappear()
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(WatchViewModel())
}
