"use server";

import { revalidateTag } from "next/cache";

export async function revalidateProfile(profileId: string) {
  revalidateTag(`profile-${profileId}`, "max");
}
