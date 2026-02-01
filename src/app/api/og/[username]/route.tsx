import { ImageResponse } from "@vercel/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("username", username)
    .single();

  if (!profile) {
    return new Response("User not found", { status: 404 });
  }

  // Get favorite books
  const { data: favorites } = await supabase
    .from("favorite_books")
    .select("title, author, cover_url")
    .eq("user_id", profile.id)
    .order("position")
    .limit(4);

  // Get book count
  const { count: bookCount } = await supabase
    .from("user_books")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id);

  const books = favorites || [];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafafa",
          padding: "40px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              width={64}
              height={64}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: "bold",
                color: "#737373",
              }}
            >
              {username[0].toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "28px", fontWeight: "bold", color: "#171717" }}>
              @{username}
            </span>
            <span style={{ fontSize: "16px", color: "#737373" }}>
              {bookCount || 0} books ranked on Bookfolio
            </span>
          </div>
        </div>

        {/* Favorite Books */}
        {books.length > 0 ? (
          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "flex-start",
            }}
          >
            {books.map((book, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "140px",
                }}
              >
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    width={120}
                    height={180}
                    style={{
                      borderRadius: "8px",
                      objectFit: "cover",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "120px",
                      height: "180px",
                      borderRadius: "8px",
                      backgroundColor: "#e5e5e5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#737373",
                    }}
                  >
                    {book.title}
                  </div>
                )}
                <span
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#525252",
                    textAlign: "center",
                    maxWidth: "140px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {book.title}
                </span>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: 4 - books.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  width: "120px",
                  height: "180px",
                  borderRadius: "8px",
                  border: "2px dashed #d4d4d4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              fontSize: "18px",
              color: "#737373",
            }}
          >
            No favorite books selected yet
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "32px",
            fontSize: "14px",
            color: "#a3a3a3",
          }}
        >
          <span>bookfolio.app</span>
        </div>
      </div>
    ),
    {
      width: 800,
      height: 420,
    }
  );
}
