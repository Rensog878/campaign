"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

export async function login(_: { error?: string; email?: string } | undefined, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const user = await db.user.findUnique({ where: { email } });
  // Compare against a dummy hash when the user is missing so timing doesn't reveal accounts.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? "$2a$12$C6UzMDM.H6dfI/f/IKcEeO5V1Y6c0O7aZzv6Yg6nH2c0y5vVQ0g4S");
  if (!user || !ok) return { error: "Email or password is incorrect.", email };

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
