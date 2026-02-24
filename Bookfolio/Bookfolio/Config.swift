import Foundation

enum Config {
    static let supabaseURL = "https://mmcdmqezvklhsngplywf.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tY2RtcWV6dmtsaHNuZ3BseXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDM2MzEsImV4cCI6MjA4NTQxOTYzMX0.SZHdGKHW_4gKdfcGxRp6nXwMasA7Ta_jnAII0MIl6ys"
    static let appScheme = "bookfolio"
    static let redirectURL = URL(string: "bookfolio://auth-callback")!
}
