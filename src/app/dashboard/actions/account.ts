"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "./templates";

export async function changePassword(current: string, next: string): Promise<ActionResult> {
  const me = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await bcrypt.compare(current, user.passwordHash))) return { ok: false, message: "Current password is wrong." };
  if (next.length < 8) return { ok: false, message: "New password must be at least 8 characters." };
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: true, message: "Password changed." };
}
