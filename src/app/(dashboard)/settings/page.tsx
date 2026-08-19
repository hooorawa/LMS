import { notFound } from "next/navigation";
import { getMyProfile } from "@/lib/data/profile.data";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
  const profile = await getMyProfile();
  if (!profile) {
    notFound();
  }

  return <SettingsContent profile={profile} />;
}
