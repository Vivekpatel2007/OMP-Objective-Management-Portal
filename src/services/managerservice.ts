"use client";

import { createClient } from "@/lib/supabase/client";

// Fetch submitted goal sheets
export async function getSubmittedGoalSheets() {
  try {
    const supabase = createClient();

    // Current manager
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: [],
        error: "User not authenticated",
      };
    }

    // Employee mappings
    const { data: mappings } = await supabase
      .from("employee_managers")
      .select("*")
      .eq("manager_id", user.id);

    const employeeIds =
      mappings?.map(
        (mapping: any) => mapping.employee_id
      ) || [];

    // Fetch submitted goal sheets
    const {
      data: goalSheets,
      error,
    } = await supabase
      .from("goal_sheets")
      .select("*")
      .in("employee_id", employeeIds)
      .in("submission_status", [
  "submitted",
  "approved",
  "rejected",
]);

    if (!goalSheets) {
      return {
        data: [],
        error,
      };
    }

    // Fetch employee profiles manually
    const enrichedGoalSheets =
      await Promise.all(
        goalSheets.map(async (sheet: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", sheet.employee_id)
            .single();

          return {
            ...sheet,
            profile,
          };
        })
      );

    return {
      data: enrichedGoalSheets,
      error: null,
    };
  } catch (err) {
    console.log(err);

    return {
      data: [],
      error: "Something went wrong",
    };
  }
}

// Approve goal sheet
export async function approveGoalSheet(
  goalSheetId: string
) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("goal_sheets")
      .update({
        submission_status: "approved",
      })
      .eq("id", goalSheetId)
      .select();

    return { data, error };
  } catch (err) {
    console.log(err);

    return {
      error: "Something went wrong",
    };
  }
}

// Reject goal sheet
// Update the function signature to accept the comment
export async function rejectGoalSheet(sheetId: string, comment: string) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("goal_sheets")
      .update({
        submission_status: "rejected",
        locked: false,
        rejection_reason: comment, // Make sure this column exists in your table
      })
      .eq("id", sheetId)
      .select();

    return { data, error };
  } catch (err) {
    console.log(err);
    return { error: "Something went wrong" };
  }
}
export async function getGoalSheetDetails(
  goalSheetId: string
) {
  try {
    const supabase = createClient();

    // Fetch goal sheet
    const { data: goalSheet } = await supabase
      .from("goal_sheets")
      .select("*")
      .eq("id", goalSheetId)
      .single();

    if (!goalSheet) {
      return {
        error: "Goal sheet not found",
      };
    }

    // Fetch employee profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", goalSheet.employee_id)
      .single();

    // Fetch goals
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("goal_sheet_id", goalSheetId);

    return {
      goalSheet,
      profile,
      goals: goals || [],
      error: null,
    };
  } catch (err) {
    console.log(err);

    return {
      error: "Something went wrong",
    };
  }
}
// Add these to the end of src/services/managerservice.ts

export async function getSubmittedSharedGoals() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "Not authenticated" };

    // 1. Get shared goals assigned by this manager
    const { data: sharedGoals } = await supabase
      .from("shared_goals")
      .select("id")
      .eq("primary_owner", user.id);

    if (!sharedGoals || sharedGoals.length === 0) return { data: [] };
    const sgIds = sharedGoals.map(sg => sg.id);

    // 2. Get submitted assignments for these goals
    const { data: assignments, error } = await supabase
      .from("shared_goal_assignments")
      .select(`
        *,
        employee:profiles(*),
        shared_goals(*)
      `)
      .in("shared_goal_id", sgIds)
      .in("status", ["submitted", "approved", "rejected"]);

    return { data: assignments, error };
  } catch (err) {
    return { error: "Something went wrong" };
  }
}

export async function approveSharedGoal(assignmentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_goal_assignments")
    .update({ status: "approved" })
    .eq("id", assignmentId);
  return { data, error };
}

export async function rejectSharedGoal(assignmentId: string, comment: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_goal_assignments")
    .update({ 
      status: "rejected", 
      rejection_reason: comment // Make sure you have a rejection_reason text column in shared_goal_assignments
    }) 
    .eq("id", assignmentId);
  return { data, error };
}