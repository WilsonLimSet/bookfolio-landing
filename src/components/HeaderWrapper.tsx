import { createClient } from "@/lib/supabase/server";
import Header from "./Header";

export default async function HeaderWrapper() {
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
