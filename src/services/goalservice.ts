// src/services/goal.service.ts

"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function createGoal(goalData: any) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: "User not authenticated",
      };
    }

    // Fetch goal sheet
    const { data: goalSheet, error: goalSheetError } =
      await supabase
        .from("goal_sheets")
        .select("*")
        .eq("employee_id", user.id)
        .single();

    if (goalSheetError || !goalSheet) {
      return {
        error: "Goal sheet not found",
      };
    }

    // Check lock
    if (goalSheet.locked) {
      return {
        error: "Goal sheet is locked",
      };
    }

    // Fetch existing goals
    const { data: existingGoals } = await supabase
      .from("goals")
      .select("*")
      .eq("goal_sheet_id", goalSheet.id);

    const goals = existingGoals || [];

    // Max 8 goals validation
    if (goals.length >= 8) {
      return {
        error: "Maximum 8 goals allowed",
      };
    }

    // Weightage validation
    const weightage = Number(goalData.weightage);

    if (weightage < 10) {
      return {
        error: "Minimum weightage must be 10",
      };
    }

    // Total weightage validation
    const totalWeightage = goals.reduce(
      (sum: number, goal: any) =>
        sum + Number(goal.weightage),
      0
    );

    if (totalWeightage + weightage > 100) {
      return {
        error: `Total weightage exceeds 100. Current total is ${totalWeightage}`,
      };
    }

    // Insert goal
    const { data, error } = await supabase
      .from("goals")
      .insert([
        {
          goal_sheet_id: goalSheet.id,
          title: goalData.title,
          description: goalData.description,
          thrust_area: goalData.thrustArea,
          uom_type: goalData.uomType,
          target_value: Number(goalData.targetValue),
          weightage,
        },
      ])
      .select();

    if (error) {
      return {
        error: error.message,
      };
    }

    return {
      data,
      error: null,
    };
  } catch (err) {
    console.log(err);

    return {
      error: "Something went wrong",
    };
  }
}

export async function getGoals() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        data: [],
        error: "User not authenticated",
        locked: false,
        submissionStatus: "draft",
      };
    }

    // Fetch goal sheet
    const { data: goalSheet, error: goalSheetError } =
      await supabase
        .from("goal_sheets")
        .select("*")
        .eq("employee_id", user.id)
        .single();

    if (goalSheetError || !goalSheet) {
      return {
        data: [],
        error: "Goal sheet not found",
        locked: false,
        submissionStatus: "draft",
      };
    }

    // Fetch goals
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("goal_sheet_id", goalSheet.id);

    return {
      data: data || [],
      error,
      locked: goalSheet.locked || false,
      submissionStatus:
        goalSheet.submission_status || "draft",
    };
  } catch (err) {
    console.log(err);

    return {
      data: [],
      error: "Something went wrong",
      locked: false,
      submissionStatus: "draft",
    };
  }
}