import SwiftUI

/// Daily wisdom/content quote view for Apple Watch.
///
/// Shows the daily curated content (quote, tip, wisdom) fetched from
/// the content API. Glanceable format optimized for the watch screen.
struct DailyContentView: View {
    @StateObject private var viewModel = DailyContentViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Category badge
                if let category = viewModel.category {
                    Text(category.uppercased())
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.unjynxGold)
                        .tracking(1.2)
                }

                // Quote
                if let content = viewModel.content {
                    Text("\u{201C}\(content)\u{201D}")
                        .font(.system(size: 14, weight: .medium, design: .serif))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                } else if viewModel.isLoading {
                    ProgressView()
                        .tint(.unjynxGold)
                } else {
                    Text("No content today")
                        .font(.system(size: 13))
                        .foregroundColor(.unjynxMutedText)
                }

                // Author
                if let author = viewModel.author {
                    Text("— \(author)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.unjynxLavender)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 12)
        }
        .background(Color.unjynxMidnight)
        .onAppear {
            viewModel.fetch()
        }
    }
}

// MARK: - ViewModel

class DailyContentViewModel: ObservableObject {
    @Published var content: String?
    @Published var author: String?
    @Published var category: String?
    @Published var isLoading = false

    func fetch() {
        guard !isLoading else { return }
        isLoading = true

        // Use the shared APIClient to fetch daily content
        Task { @MainActor in
            do {
                let data = try await APIClient.shared.get("/api/v1/content/today")
                if let payload = data["data"] as? [String: Any] {
                    self.content = payload["content"] as? String
                    self.author = payload["author"] as? String
                    self.category = payload["category"] as? String
                }
            } catch {
                // Graceful fallback — show nothing
            }
            self.isLoading = false
        }
    }
}
