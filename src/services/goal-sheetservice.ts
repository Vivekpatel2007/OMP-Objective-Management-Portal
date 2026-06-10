// src/services/goal-sheet.service.ts

"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
export async function getOrCreateGoalSheet() {
  try {
    const supabase = createClient();

    // Current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: "User not authenticated",
      };
    }

    // Active cycle
    const { data: activeCycle } =
      await supabase
        .from("goal_cycles")
        .select("*")
        .eq("status", "active")
        .single();

    if (!activeCycle) {
      return {
        error: "No active cycle found",
      };
    }

    // Existing sheet for current cycle
    const { data: existingGoalSheet } =
      await supabase
        .from("goal_sheets")
        .select("*")
        .eq("employee_id", user.id)
        .eq("cycle_id", activeCycle.id)
        .single();

    // Return existing
    if (existingGoalSheet) {
      return {
        data: existingGoalSheet,
      };
    }

    // Create new
    const { data, error } = await supabase
      .from("goal_sheets")
      .insert({
        employee_id: user.id,
        cycle_id: activeCycle.id,
        submission_status: "draft",
        locked: false,
      })
      .select()
      .single();

    return { data, error };
  } catch (err) {
    console.log(err);

    return {
      error: "Something went wrong",
    };
  }
}
export async function validateGoalSheet(
goalSheetId: string
) {
const supabase =
createClient();

const {
data: goals,
error,
} =
await supabase
.from(
"goals"
)
.select("*")
.eq(
"goal_sheet_id",
goalSheetId
);

if(
error
){
return{
valid:false,
error:
"Unable to validate",
};
}

if(
goals.length >
8
){
return{
valid:false,
error:
"Maximum 8 goals allowed",
};
}

let total =
0;

for(
const goal of goals
){

if(
goal.weightage <
10
){
return{
valid:false,
error:
`Goal "${goal.title}" weightage must be at least 10`,
};
}

total +=
goal.weightage;
}

if(
total !==
100
){
return{
valid:false,
error:
`Total weightage must equal 100. Current: ${total}`,
};
}

return{
valid:true,
};
}export async function submitGoalSheet(){

try{

const supabase =
createClient();

const {
data:{
user,
},
}=
await supabase.auth.getUser();

if(
!user
){
return{
error:
"Login required",
};
}

const {
data: sheet,
}=await supabase
.from(
"goal_sheets"
)
.select("*")
.eq(
"employee_id",
user.id
)
.single();

if(
sheet.locked
){
return{
error:
"Goal sheet locked",
};
}

const validation =
await validateGoalSheet(
sheet.id
);

if(
!validation.valid
){
return{
error:
validation.error,
};
}

return supabase
.from(
"goal_sheets"
)
.update({

submission_status:
"submitted",

locked:
true,

})
.eq(
"id",
sheet.id
);

}

catch{

return{
error:
"Submit failed",
};

}

}