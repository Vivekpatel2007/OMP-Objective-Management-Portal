import { createClient } from "@/lib/supabase/client";

export async function getCurrentGoalSheet() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: "User not authenticated",
      };
    }

    const { data, error } =
      await supabase
        .from("goal_sheets")
        .select("*")
        .eq(
          "employee_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .single();

    return {
      data,
      error,
    };
  } catch (err) {
    console.log(err);

    return {
      error:
        "Something went wrong",
    };
  }
}

export async function submitSelfReview(
  selfReview: string,
  employeeRating: number
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: "User not authenticated",
      };
    }

    const {
      data: goalSheet,
    } = await supabase
      .from("goal_sheets")
      .select("id")
      .eq(
        "employee_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .single();

    const {
      data,
      error,
    } = await supabase
      .from("goal_sheets")
      .update({
        self_review:
          selfReview,

        employee_rating:
          employeeRating,
      })
      .eq(
        "id",
        goalSheet?.id
      )
      .select();

    return {
      data,
      error,
    };
  } catch (err) {
    console.log(err);

    return {
      error:
        "Something went wrong",
    };
  }
}

export async function submitManagerReview(
  sheetId: string,
  managerReview: string,
  managerRating: number
) {
  try {
    const supabase = createClient();

    const {
      data,
      error,
    } = await supabase
      .from("goal_sheets")
      .update({
        manager_review:
          managerReview,

        manager_rating:
          managerRating,
      })
      .eq("id", sheetId)
      .select();

    return {
      data,
      error,
    };
  } catch (err) {
    console.log(err);

    return {
      error:
        "Something went wrong",
    };
  }
}