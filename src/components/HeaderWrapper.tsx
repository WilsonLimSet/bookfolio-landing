import { createClient } from "@/lib/supabase/server";
import Header from "./Header";
import type { User } from "@supabase/supabase-js";

interface HeaderWrapperProps {
  user?: User | null;
  username?: string | null;
}

export default async function HeaderWrapper(props: HeaderWrapperProps = {}) {
  // If user was passed from the page, skip the redundant auth call
  if ("user" in props) {
    let username = props.username ?? null;
    // If user passed but username wasn't, fetch just the username (avoids auth round-trip)
    if (props.user && username === null && !("username" in props)) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", props.user.id)
        .maybeSingle();
      username = profile?.username || null;
    }
    return <Header user={props.user ?? null} username={username} />;
  }

  // Fallback: fetch user (for pages that don't pass user)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let username = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    username = profile?.username || null;
  }

  return <Header user={user} username={username} />;
}
