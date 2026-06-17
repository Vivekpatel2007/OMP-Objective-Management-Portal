import { createClient } from "@/lib/supabase/client";

/*
CURRENT USER
*/

export async function getCurrentUserProfile() {
  const supabase =
    createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user)
    return null;

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select("*")
      .eq(
        "id",
        user.id
      )
      .single();

  if (error) {
    console.log(
      error
    );

    return null;
  }

  return data;
}

/*
GET EMPLOYEES
ADMIN:
all employees

MANAGER:
employees from own department
*/

export async function getEmployees() {
  const supabase =
    createClient();

  const profile =
    await getCurrentUserProfile();

  if (
    !profile
  ) {
    return {
      data: [],
    };
  }

  // ADMIN

  if (
    profile.role ===
    "admin"
  ) {
    return supabase
      .from(
        "profiles"
      )
      .select("*")
      .eq(
        "role",
        "employee"
      );
  }

  // MANAGER

  return supabase
    .from(
      "profiles"
    )
    .select("*")
    .eq(
      "role",
      "employee"
    )
    .eq(
      "department",
      profile.department
    );
}

/*
CREATE SHARED GOAL
*/

export async function createSharedGoal(goal: any) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  // Insert shared goal
  const { data: sharedGoal, error } = await supabase
    .from("shared_goals")
    .insert({
      title: goal.title,
      description: goal.description,
      target_value: goal.target,
      uom_type: goal.uom,
      assignment_type: goal.type,
      department: goal.department,
      primary_owner: user.id,
      quarter: goal.quarter || "Q1", // <--- ADD THIS LINE HERE
    })
    .select()
    .single();

  if (error || !sharedGoal) {
    console.log(error);
    return { error: error?.message || "Failed to create shared goal" };
  }

  // --- Assign to Employees ---
  let employeesToAssign: any[] = [];

  if (goal.type === "all") {
    const { data: allEmp } = await supabase.from("profiles").select("id").eq("role", "employee");
    employeesToAssign = allEmp || [];
  } else if (goal.type === "department") {
    const { data: deptEmp } = await supabase.from("profiles").select("id").eq("role", "employee").eq("department", goal.department);
    employeesToAssign = deptEmp || [];
  } else if (goal.type === "employee") {
    employeesToAssign = goal.employees || [];
  }

  if (employeesToAssign.length === 0) {
    return { data: sharedGoal };
  }

  const assignments = employeesToAssign.map((emp: any) => ({
    shared_goal_id: sharedGoal.id,
    employee_id: emp.id,
    weightage: goal.weightage || 10,
    status: "draft"
  }));

  const { error: assignError } = await supabase.from("shared_goal_assignments").insert(assignments);

  if (assignError) {
    console.log(assignError);
    return { error: assignError.message };
  }

  return { data: sharedGoal };
}

/*
SHOW SHARED GOALS
*/

/*
SHOW SHARED GOALS
*/
export async function getSharedGoals() {
  const supabase = createClient();
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return { data: [] };
  }

  // Fetch shared goals AND their associated assignments' statuses
  let query = supabase
    .from("shared_goals")
    .select("*, shared_goal_assignments(status)")
    .order("created_at", { ascending: false });

  if (profile.role === "manager") {
    query = query.eq("department", profile.department);
  }

  return query;
}
export async function getEmployeeSharedGoals() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [] };
  }

  // Fetch assignments and ALL shared_goal fields
  const { data: assignments, error } = await supabase
    .from("shared_goal_assignments")
    .select(`
      *,
      shared_goals ( * )
    `)
    .eq("employee_id", user.id);

  if (error || !assignments) {
    return { data: [] };
  }

  // Fetch the names of the managers/admins who assigned these goals
  const ownerIds = [...new Set(assignments.map(a => a.shared_goals?.primary_owner).filter(Boolean))];
  
  let profiles: any[] = [];
  if (ownerIds.length > 0) {
    const { data: pData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ownerIds);
    profiles = pData || [];
  }

  // Enrich the data with the owner's name
  const enrichedAssignments = assignments.map(a => ({
    ...a,
    shared_goals: {
      ...a.shared_goals,
      owner_name: profiles.find(p => p.id === a.shared_goals?.primary_owner)?.full_name || "Admin / Manager"
    }
  }));

  return { data: enrichedAssignments };
}

export async function updateSharedWeightage(
id:string,
weight:number
){

const supabase=
createClient();

return supabase

.from(
"shared_goal_assignments"
)

.update({

weightage:
weight,

})

.eq(
"id",
id);

}