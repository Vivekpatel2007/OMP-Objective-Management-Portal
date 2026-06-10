import { createClient } from "@/lib/supabase/client";

export async function getEmployeeReportData() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const {
      data: profile,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const {
      data: goalSheet,
    } = await supabase
      .from("goal_sheets")
      .select("*")
      .eq("employee_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .single();

    const {
      data: goals,
    } = await supabase
      .from("goals")
      .select("*")
      .eq(
        "goal_sheet_id",
        goalSheet?.id
      );

    return {
      profile,
      goalSheet,
      goals,
    };
  } catch (err) {
    console.log(err);

    return null;
  }
} 

export async function getManagerReportData() {
  const supabase =
    createClient();

  const {
    data: sheets,
  } =
    await supabase
      .from(
        "goal_sheets"
      )
      .select("*");

  const {
    data: profiles,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select("*");

  return {
    sheets,
    profiles,
  };
}

export async function getAdminReportData() {
  const supabase =
    createClient();

  const {
    data: employees,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select("*");

  const {
    data: sheets,
  } =
    await supabase
      .from(
        "goal_sheets"
      )
      .select("*");

  const {
    data: goals,
  } =
    await supabase
      .from(
        "goals"
      )
      .select("*");

  return {
    employees,
    sheets,
    goals,
  };
}