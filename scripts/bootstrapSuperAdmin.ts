import { config } from "dotenv";
config({ path: ".env.local" });

import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { hashPassword } from "@/lib/auth/password";

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in your env file first.");
  }

  await connectToDatabase();

  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`Super-admin already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);

  await UserModel.create({
    name: "Super Admin",
    email: email.toLowerCase(),
    passwordHash,
    role: "super-admin",
    instituteId: null,
    status: "active",
    mustChangePassword: false,
  });

  console.log(`Created super-admin: ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
