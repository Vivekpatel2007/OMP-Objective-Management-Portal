// src/services/goal-sheet.service.ts

"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function submitGoalSheet() {
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

    // Fetch goals
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("goal_sheet_id", goalSheet.id);

    const allGoals = goals || [];

    if (allGoals.length === 0) {
      return {
        error: "Create at least one goal",
      };
    }

    // Total weightage validation
    const totalWeightage = allGoals.reduce(
      (sum: number, goal: any) =>
        sum + Number(goal.weightage),
      0
    );

    if (totalWeightage !== 100) {
      return {
        error: `Total weightage must be exactly 100. Current total is ${totalWeightage}`,
      };
    }

    // Submit and lock
    const { data, error } = await supabase
      .from("goal_sheets")
      .update({
        submission_status: "submitted",
        locked: true,
      })
      .eq("id", goalSheet.id)
      .select();

    return { data, error };
  } catch (err) {
    console.log(err);

    return {
      error: "Something went wrong",
    };
  }
}