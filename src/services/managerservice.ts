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
export async function rejectGoalSheet(
  goalSheetId: string
) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("goal_sheets")
      .update({
        submission_status: "rejected",
        locked: false,
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