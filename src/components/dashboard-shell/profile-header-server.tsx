import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { ProfileHeader } from "./profile-header";

export async function ProfileHeaderServer({ userId, role }: { userId: string; role: string }) {
  const profile = await getCurrentUserProfile(userId, role);

  return <ProfileHeader name={profile.name} role={profile.role} />;
}
