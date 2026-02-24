import Foundation
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: Config.supabaseURL)!,
    supabaseKey: Config.supabaseAnonKey,
    options: SupabaseClientOptions(
        auth: .init(
            redirectToURL: Config.redirectURL,
            flowType: .pkce
        )
    )
)
