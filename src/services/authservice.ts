"use client";

import { createClient } from "@/lib/supabase/client";

export async function login(
  email: string,
  password: string
) {
  try {
    const supabase = createClient();

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    console.log(data);
    console.log(error);

    return { data, error };
  } catch (err) {
    console.log(err);

    return {
      data: null,
      error: {
        message: "Failed to connect to Supabase",
      },
    };
  }
}