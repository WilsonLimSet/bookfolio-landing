import UIKit

/// In-memory + disk image cache for book covers and avatars.
/// AsyncImage has no persistent cache — this ensures images load instantly after first download.
actor ImageCacheService {
    static let shared = ImageCacheService()

    private let memoryCache = NSCache<NSString, UIImage>()
    private let cacheDirectory: URL
    /// Tracks in-flight downloads to avoid duplicate requests for the same URL.
    private var inFlight: [URL: Task<UIImage?, Never>] = [:]

    private init() {
        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        cacheDirectory = caches.appendingPathComponent("ImageCache", isDirectory: true)
        try? FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)

        memoryCache.totalCostLimit = 100 * 1024 * 1024
        memoryCache.countLimit = 200
    }

    /// Returns cached image or downloads, caches, and returns it.
    func image(for url: URL) async -> UIImage? {
        let key = cacheKey(for: url)

        // 1. Memory cache (instant)
        if let cached = memoryCache.object(forKey: key as NSString) {
            return cached
        }

        // 2. Disk cache (fast)
        let filePath = cacheDirectory.appendingPathComponent(key)
        if let data = try? Data(contentsOf: filePath),
           let image = UIImage(data: data) {
            memoryCache.setObject(image, forKey: key as NSString, cost: data.count)
            return image
        }

        // 3. Coalesce concurrent requests for the same URL
        if let existing = inFlight[url] {
            return await existing.value
        }

        let task = Task<UIImage?, Never> { [weak self] in
            guard let self else { return nil }
            return await self.download(url: url, key: key, filePath: filePath)
        }
        inFlight[url] = task
        let result = await task.value
        inFlight[url] = nil
        return result
    }

    private func download(url: URL, key: String, filePath: URL) async -> UIImage? {
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode),
                  let image = UIImage(data: data) else {
                return nil
            }
            memoryCache.setObject(image, forKey: key as NSString, cost: data.count)
            try? data.write(to: filePath, options: .atomic)
            return image
        } catch {
            return nil
        }
    }

    private nonisolated func cacheKey(for url: URL) -> String {
        let str = url.absoluteString
        var hash: UInt64 = 5381
        for byte in str.utf8 {
            hash = 127 &* (hash & 0x00ffffffffffffff) &+ UInt64(byte)
        }
        return String(hash, radix: 36)
    }
}
