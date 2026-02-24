import UserNotifications
import UIKit
import Supabase

class PushNotificationService: NSObject, UNUserNotificationCenterDelegate, @unchecked Sendable {
    static let shared = PushNotificationService()

    func requestPermission() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            if granted {
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
            return granted
        } catch {
            print("Notification permission error: \(error)")
            return false
        }
    }

    func registerDeviceToken(_ tokenData: Data, userId: UUID) async {
        let token = tokenData.map { String(format: "%02x", $0) }.joined()

        let row = DeviceTokenInsert(userId: userId, token: token, platform: "ios")
        do {
            try await supabase.from("device_tokens")
                .upsert(row, onConflict: "user_id,token")
                .execute()
        } catch {
            print("Failed to register device token: \(error)")
        }
    }

    func removeDeviceToken(userId: UUID) async {
        try? await supabase.from("device_tokens")
            .delete()
            .eq("user_id", value: userId)
            .execute()
    }

    // MARK: - UNUserNotificationCenterDelegate

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        return [.banner, .badge, .sound]
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo
        print("Notification tapped: \(userInfo)")
    }
}

private struct DeviceTokenInsert: Encodable {
    let userId: UUID
    let token: String
    let platform: String

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case token
        case platform
    }
}
