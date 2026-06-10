import { createClient } from "@/lib/supabase/client";

export async function getAdminDashboard() {
  try {
    const supabase = createClient();

    const { data: employees } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("role", "employee");

    const { data: managers } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("role", "manager");

    const { data: sheets } =
      await supabase
        .from("goal_sheets")
        .select("*");

    const {
      data: activeCycle,
    } = await supabase
      .from("goal_cycles")
      .select("*")
      .eq("status", "active")
      .single();

    return {
      employees:
        employees?.length || 0,

      managers:
        managers?.length || 0,

      goalSheets:
        sheets?.length || 0,

      activeCycle,
    };
  } catch {
    return null;
  }
}

export async function getEmployees() {
  const supabase =
    createClient();

  return supabase
    .from("profiles")
    .select("*")
    .eq(
      "role",
      "employee"
    );
}

export async function getCycles() {
  const supabase =
    createClient();

  return supabase
    .from(
      "goal_cycles"
    )
    .select("*");
}

export async function activateCycle(
  id: string
) {
  const supabase =
    createClient();

  await supabase
    .from(
      "goal_cycles"
    )
    .update({
      status:
        "inactive",
    })
    .neq(
      "id",
      id
    );

  return supabase
    .from(
      "goal_cycles"
    )
    .update({
      status:
        "active",
    })
    .eq(
      "id",
      id
    );
}