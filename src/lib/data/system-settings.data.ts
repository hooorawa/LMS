import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import SystemSettingsModel from "@/models/SystemSettings";

export type SystemSettingsData = {
  systemName: string;
  tagline: string;
  logoUrl: string;
  supportEmail: string;
  defaultTrialDays: number;
  primaryColor: string;
  privacyPolicy: string;
  termsOfUse: string;
  helpCenterContent: string;
};

export async function getSystemSettings(): Promise<SystemSettingsData> {
  await connectToDatabase();

  const settings = await SystemSettingsModel.findOne().lean();

  return {
    systemName: settings?.systemName ?? "LearningMS",
    tagline: settings?.tagline ?? "",
    logoUrl: settings?.logoUrl ?? "",
    supportEmail: settings?.supportEmail ?? "",
    defaultTrialDays: settings?.defaultTrialDays ?? 14,
    primaryColor: settings?.primaryColor ?? "",
    privacyPolicy: settings?.privacyPolicy ?? "",
    termsOfUse: settings?.termsOfUse ?? "",
    helpCenterContent: settings?.helpCenterContent ?? "",
  };
}
