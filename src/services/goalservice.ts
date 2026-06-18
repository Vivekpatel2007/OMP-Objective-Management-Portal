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
    const { data: goalSheet, error: goalSheetError } = await supabase
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
      (sum: number, goal: any) => sum + Number(goal.weightage),
      0
    );

    if (totalWeightage + weightage > 100) {
      return {
        error: `Total weightage exceeds 100. Current total is ${totalWeightage}`,
      };
    }

    // --- NEW LOGIC: Determine Active Quarter dynamically ---
    const { data: activeCycle } = await supabase
      .from("goal_cycles")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    let assignedQuarter = "Q1"; // Default for Goal Setting phase

    if (activeCycle) {
      const now = new Date();
      const isWithin = (start?: string, end?: string) => {
        if (!start || !end) return false;
        return now >= new Date(start) && now <= new Date(end);
      };

      if (isWithin(activeCycle.q1_start, activeCycle.q1_end)) assignedQuarter = "Q1";
      else if (isWithin(activeCycle.q2_start, activeCycle.q2_end)) assignedQuarter = "Q2";
      else if (isWithin(activeCycle.q3_start, activeCycle.q3_end)) assignedQuarter = "Q3";
      else if (isWithin(activeCycle.q4_start, activeCycle.q4_end)) assignedQuarter = "Q4";
    }

    // Insert goal with the dynamically assigned quarter
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
          quarter: assignedQuarter, // Auto-assigned quarter
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



export async function updateGoal(goalId: string, goalData: any) {
  try {
    const { data, error } = await supabase
      .from("goals")
      .update({
        title: goalData.title,
        description: goalData.description,
        thrust_area: goalData.thrustArea,
        uom_type: goalData.uomType,
        target_value: Number(goalData.targetValue),
        weightage: Number(goalData.weightage),
      })
      .eq("id", goalId)
      .select();

    return { data, error };
  } catch (err) {
    console.log(err);
    return { error: "Something went wrong" };
  }
}

export async function deleteGoal(goalId: string) {
  try {
    const { error } = await supabase.from("goals").delete().eq("id", goalId);
    return { error };
  } catch (err) {
    console.log(err);
    return { error: "Something went wrong" };
  }
}

export async function updateGoalProgress(
  goalId: string,
  progress: number,
  achievement: string,
  employeeComment: string
) {
  try {
    const { data, error } = await supabase
      .from("goals")
      .update({
        progress,
        achievement,
        employee_comment: employeeComment,
      })
      .eq("id", goalId)
      .select();

    return { data, error };
  } catch (err) {
    console.log(err);
    return { error: "Something went wrong" };
  }
}

// src/services/goalservice.ts

export async function getGoals() {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: [], error: "User not authenticated", locked: false, submissionStatus: "draft" };
    }

    // 1. Figure out the Active Quarter dynamically
    const { data: activeCycle } = await supabase
      .from("goal_cycles")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    let activeQuarter = "Q1";
    if (activeCycle) {
      const now = new Date();
      const isWithin = (start?: string, end?: string) => {
        if (!start || !end) return false;
        return now >= new Date(start) && now <= new Date(end);
      };

      if (isWithin(activeCycle.q2_start, activeCycle.q2_end)) activeQuarter = "Q2";
      else if (isWithin(activeCycle.q3_start, activeCycle.q3_end)) activeQuarter = "Q3";
      else if (isWithin(activeCycle.q4_start, activeCycle.q4_end)) activeQuarter = "Q4";
    }

    // 2. Fetch the goal sheet strictly for THIS quarter
    const { data: goalSheet, error: goalSheetError } = await supabase
      .from("goal_sheets")
      .select("*")
      .eq("employee_id", user.id)
      .eq("quarter", activeQuarter) // <-- Fetch only the active quarter's sheet
      .single();

    if (goalSheetError || !goalSheet) {
      return { data: [], error: "Goal sheet not found", locked: false, submissionStatus: "draft" };
    }

    // 3. Fetch goals for this specific sheet
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("goal_sheet_id", goalSheet.id)
      .order("created_at", { ascending: true });

    return {
      data: data || [],
      error,
      locked: goalSheet.locked || false,
      submissionStatus: goalSheet.submission_status || "draft",
    };
  } catch (err) {
    console.log(err);
    return { data: [], error: "Something went wrong", locked: false, submissionStatus: "draft" };
  }
}

export async function submitGoalSheet() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Login required" };

    // 1. Figure out the Active Quarter
    const { data: activeCycle } = await supabase.from("goal_cycles").select("*").eq("is_active", true).maybeSingle();
    let activeQuarter = "Q1";
    if (activeCycle) {
      const now = new Date();
      const isWithin = (start?: string, end?: string) => start && end && now >= new Date(start) && now <= new Date(end);
      if (isWithin(activeCycle.q2_start, activeCycle.q2_end)) activeQuarter = "Q2";
      else if (isWithin(activeCycle.q3_start, activeCycle.q3_end)) activeQuarter = "Q3";
      else if (isWithin(activeCycle.q4_start, activeCycle.q4_end)) activeQuarter = "Q4";
    }

    // 2. Fetch the sheet for THIS quarter
    const { data: sheet } = await supabase
      .from("goal_sheets")
      .select("*")
      .eq("employee_id", user.id)
      .eq("quarter", activeQuarter)
      .single();

    if (!sheet) return { error: "Goal sheet not found" };
    if (sheet.locked) return { error: "Goal sheet locked" };

    const validation = await validateGoalSheet(sheet.id);
    if (!validation.valid) return { error: validation.error };

    return supabase
      .from("goal_sheets")
      .update({ submission_status: "submitted", locked: true })
      .eq("id", sheet.id);
  } catch {
    return { error: "Submit failed" };
  }
}

export async function validateGoalSheet(goalSheetId: string) {
  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("goal_sheet_id", goalSheetId);

  if (error) return { valid: false, error: "Unable to validate" };
  if (goals.length > 8) return { valid: false, error: "Maximum 8 goals allowed" };

  let total = 0;
  for (const goal of goals) {
    if (goal.weightage < 10) return { valid: false, error: `Goal "${goal.title}" weightage must be at least 10` };
    total += goal.weightage;
  }

  if (total !== 100) return { valid: false, error: `Total weightage must equal 100. Current: ${total}` };

  return { valid: true };
}