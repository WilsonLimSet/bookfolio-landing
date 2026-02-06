"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SetupResult = { error: string } | never;

export async function setupUsername(
  formData: FormData
): Promise<SetupResult | never> {
  const supabase = await createClient();
  const username = formData.get("username") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if username is already taken
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .single();

  if (existingUser) {
    return { error: "Username is already taken" };
  }

  // Update the user's profile with the chosen username
  const { error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to set username. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/feed");
}
