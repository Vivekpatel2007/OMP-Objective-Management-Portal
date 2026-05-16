"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}