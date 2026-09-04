"use server";

import { cookies } from "next/headers";
import { AppMode } from "./ModeProvider";

export async function setModeCookie(mode: AppMode) {
  const cookieStore = await cookies();
  cookieStore.set("jobnest-app-mode", mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getModeCookie(): Promise<AppMode> {
  const cookieStore = await cookies();
  const savedMode = cookieStore.get("jobnest-app-mode")?.value;
  return savedMode === "PRO" ? "PRO" : "LOCAL";
}
