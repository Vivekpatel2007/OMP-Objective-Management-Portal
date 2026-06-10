import { createClient } from "@/lib/supabase/client";

export async function createNotification(
  userId: string,
  title: string,
  message: string
) {
  try {
    const supabase =
      createClient();

    const {
      data,
      error,
    } = await supabase
      .from(
        "notifications"
      )
      .insert({
        user_id:
          userId,

        title,

        message,
      });

    return {
      data,
      error,
    };
  } catch {
    return {
      error:
        "Unable to create notification",
    };
  }
}

export async function getNotifications() {
  try {
    const supabase =
      createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return {
        data: [],
      };
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "notifications"
      )
      .select("*")
      .eq(
        "user_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      );

    return {
      data,
      error,
    };
  } catch {
    return {
      data: [],
    };
  }
}

export async function markRead(
  id: string
) {
  const supabase =
    createClient();

  return supabase
    .from(
      "notifications"
    )
    .update({
      is_read:
        true,
    })
    .eq(
      "id",
      id
    );
}