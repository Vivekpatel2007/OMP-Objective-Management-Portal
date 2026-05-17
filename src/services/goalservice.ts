"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function createGoal(goalData: any) {
  try {
    // Get logged-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("AUTH USER:", user);
    console.log("AUTH ERROR:", authError);

    if (authError || !user) {
      alert("User not authenticated");

      return {
        error: "User not authenticated",
      };
    }

    // Fetch goal sheet for current user
    const {
      data: goalSheet,
      error: goalSheetError,
    } = await supabase
      .from("goal_sheets")
      .select("*")
      .eq("employee_id", user.id)
      .single();

    console.log("GOAL SHEET:", goalSheet);
    console.log("GOAL SHEET ERROR:", goalSheetError);

    if (goalSheetError || !goalSheet) {
      alert("Goal sheet not found");

      return {
        error: "Goal sheet not found",
      };
    }

    // Insert goal into goals table
    const {
      data,
      error,
    } = await supabase
      .from("goals")
      .insert([
        {
          goal_sheet_id: goalSheet.id,

          title: goalData.title,

          description: goalData.description,

          thrust_area: goalData.thrustArea,

          uom_type: goalData.uomType,

          target_value: Number(goalData.targetValue),

          weightage: Number(goalData.weightage),
        },
      ])
      .select();

    console.log("INSERT DATA:", data);
    console.log("INSERT ERROR:", error);

    if (error) {
      alert(error.message);

      return {
        error: error.message,
      };
    }

    alert("Goal created successfully");

    return {
      data,
      error: null,
    };
  } catch (err) {
    console.log("CATCH ERROR:", err);

    alert("Something went wrong");

    return {
      error: "Something went wrong",
    };
  }
}

export async function getGoals() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "User not authenticated",
    };
  }

  const { data: goalSheet } = await supabase
    .from("goal_sheets")
    .select("*")
    .eq("employee_id", user.id)
    .single();

  if (!goalSheet) {
    return {
      error: "Goal sheet not found",
    };
  }

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("goal_sheet_id", goalSheet.id);

  return { data, error };
}