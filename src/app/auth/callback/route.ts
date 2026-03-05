import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/feed";

  const redirectTo = request.nextUrl.clone();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, onboarding_completed")
          .eq("id", user.id)
          .single();

        // New user without username → onboarding
        if (!profile?.username) {
          redirectTo.pathname = "/onboarding";
          redirectTo.searchParams.delete("code");
          redirectTo.searchParams.delete("next");
          return NextResponse.redirect(redirectTo);
        }

        // User hasn't completed onboarding → onboarding
        if (!profile?.onboarding_completed) {
          redirectTo.pathname = "/onboarding";
          redirectTo.searchParams.delete("code");
          redirectTo.searchParams.delete("next");
          return NextResponse.redirect(redirectTo);
        }
      }

      redirectTo.pathname = next;
      redirectTo.searchParams.delete("code");
      redirectTo.searchParams.delete("next");
      return NextResponse.redirect(redirectTo);
    }
  }

  // If no code or error, redirect to login with error
  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "Could not authenticate with Google");
  return NextResponse.redirect(redirectTo);
}
