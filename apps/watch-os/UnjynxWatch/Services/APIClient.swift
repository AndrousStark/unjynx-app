import Foundation

// MARK: - API Errors

enum APIError: LocalizedError {
    case invalidURL
    case unauthorized
    case serverError(statusCode: Int)
    case decodingFailed(Error)
    case networkUnavailable
    case timeout
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid request URL."
        case .unauthorized:
            return "Session expired. Please re-authenticate on your iPhone."
        case .serverError(let code):
            return "Server error (\(code)). Try again later."
        case .decodingFailed:
            return "Failed to process server response."
        case .networkUnavailable:
            return "No network connection."
        case .timeout:
            return "Request timed out."
        case .unknown:
            return "An unexpected error occurred."
        }
    }
}

// MARK: - API Client

actor APIClient {
    static let shared = APIClient()

    private let baseURL = "https://api.unjynx.me/api/v1"
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 10
        config.timeoutIntervalForResource = 15
        config.waitsForConnectivity = false
        self.session = URLSession(configuration: config)

        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase

        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
    }

    // MARK: - Auth Token

    /// Retrieves the bearer token from Keychain.
    private func getAuthToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.metaminds.unjynx.watch",
            kSecAttrAccount as String: "auth_token",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }

        return token
    }

    /// Stores the bearer token in Keychain.
    func storeAuthToken(_ token: String) {
        let data = Data(token.utf8)

        // Delete existing
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.metaminds.unjynx.watch",
            kSecAttrAccount as String: "auth_token"
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        // Add new
        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.metaminds.unjynx.watch",
            kSecAttrAccount as String: "auth_token",
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlocked
        ]
        SecItemAdd(addQuery as CFDictionary, nil)
    }

    // MARK: - HTTP Helpers

    private func buildRequest(
        path: String,
        method: String = "GET",
        body: Data? = nil
    ) throws -> URLRequest {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("UnjynxWatch/1.0", forHTTPHeaderField: "User-Agent")

        if let token = getAuthToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = body
        return request
    }

    private func perform<T: Decodable>(
        _ request: URLRequest,
        maxRetries: Int = 1
    ) async throws -> T {
        var lastError: Error?

        for attempt in 0...maxRetries {
            do {
                let (data, response) = try await session.data(for: request)

                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.unknown(
                        NSError(domain: "APIClient", code: -1)
                    )
                }

                switch httpResponse.statusCode {
                case 200...299:
                    do {
                        return try decoder.decode(T.self, from: data)
                    } catch {
                        throw APIError.decodingFailed(error)
                    }
                case 401:
                    throw APIError.unauthorized
                default:
                    throw APIError.serverError(statusCode: httpResponse.statusCode)
                }
            } catch let error as APIError {
                // Don't retry auth errors
                if case .unauthorized = error { throw error }
                lastError = error
            } catch let error as URLError {
                if error.code == .timedOut {
                    lastError = APIError.timeout
                } else if error.code == .notConnectedToInternet {
                    throw APIError.networkUnavailable
                } else {
                    lastError = APIError.unknown(error)
                }
            } catch {
                lastError = APIError.unknown(error)
            }

            // Only retry if not the last attempt
            if attempt < maxRetries {
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5s backoff
            }
        }

        throw lastError ?? APIError.unknown(
            NSError(domain: "APIClient", code: -1)
        )
    }

    private func performVoid(
        _ request: URLRequest,
        maxRetries: Int = 1
    ) async throws {
        var lastError: Error?

        for attempt in 0...maxRetries {
            do {
                let (_, response) = try await session.data(for: request)

                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.unknown(
                        NSError(domain: "APIClient", code: -1)
                    )
                }

                switch httpResponse.statusCode {
                case 200...299, 204:
                    return
                case 401:
                    throw APIError.unauthorized
                default:
                    throw APIError.serverError(statusCode: httpResponse.statusCode)
                }
            } catch let error as APIError {
                if case .unauthorized = error { throw error }
                lastError = error
            } catch let error as URLError {
                if error.code == .notConnectedToInternet {
                    throw APIError.networkUnavailable
                }
                lastError = APIError.unknown(error)
            } catch {
                lastError = APIError.unknown(error)
            }

            if attempt < maxRetries {
                try await Task.sleep(nanoseconds: 500_000_000)
            }
        }

        throw lastError ?? APIError.unknown(
            NSError(domain: "APIClient", code: -1)
        )
    }

    // MARK: - API Envelope

    private struct APIResponse<T: Decodable>: Decodable {
        let success: Bool
        let data: T?
        let error: String?
    }

    // MARK: - Public API

    /// Fetches today's tasks, limited to 10 most relevant.
    func getTasks() async throws -> [WatchTask] {
        let request = try buildRequest(path: "/tasks?limit=10&filter=today&sort=due_date")
        let response: APIResponse<[WatchTask]> = try await perform(request)
        return response.data ?? []
    }

    /// Fetches the daily productivity summary.
    func getSummary() async throws -> WatchSummary {
        let request = try buildRequest(path: "/progress/daily-summary")
        let response: APIResponse<WatchSummary> = try await perform(request)
        return response.data ?? .empty
    }

    /// Marks a task as completed.
    func completeTask(_ id: String) async throws {
        let body = try encoder.encode(["is_completed": true])
        let request = try buildRequest(
            path: "/tasks/\(id)",
            method: "PATCH",
            body: body
        )
        try await performVoid(request)
    }

    /// Snoozes a task by the specified number of minutes.
    func snoozeTask(_ id: String, minutes: Int) async throws {
        let body = try encoder.encode(["snooze_minutes": minutes])
        let request = try buildRequest(
            path: "/tasks/\(id)/snooze",
            method: "POST",
            body: body
        )
        try await performVoid(request)
    }
}
