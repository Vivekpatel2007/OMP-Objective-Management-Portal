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

export async function createSharedGoal(
goal:any
){

const supabase=
createClient();

const profile=
await getCurrentUserProfile();

if(
!profile
){

return{
error:
"User profile not found",
};

}

const payload={

title:
goal.title,

description:
goal.description,

target_value:
Number(
goal.target
)||0,

uom_type:
goal.uom,

assignment_type:
goal.type,

department:
goal.department||
profile.department||
null,

primary_owner:
profile.id,

};

console.log(
"Creating:",
payload
);

const{
data:sharedGoal,
error:goalError,
}=
await supabase
.from(
"shared_goals"
)
.insert(
payload
)
.select()
.single();

if(
goalError
){

console.log(
goalError
);

return{
error:
goalError.message,
};

}

let recipients:any[]=[];

/*
ALL
*/

if(
goal.type==="all"
){

const{
data,
error,
}=
await supabase
.from(
"profiles"
)
.select("*")
.eq(
"role",
"employee"
);

if(error){

return{
error:
error.message,
};

}

recipients=
data||
[];

}

/*
DEPARTMENT
*/

else if(
goal.type==="department"
){

const dept=
goal.department||
profile.department;

const{
data,
error,
}=
await supabase
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
dept);

if(error){

return{
error:
error.message,
};

}

recipients=
data||
[];

}

/*
EMPLOYEE
*/

else{

recipients=
goal.employees||
[];

}

if(
recipients.length===0
){

return{
error:
"No employees selected",
};

}

const assignments=
recipients.map(
(
emp:any
)=>({

shared_goal_id:
sharedGoal.id,

employee_id:
emp.id,

weightage:
goal.weightage||
10,

})
);

console.log(
assignments
);

const{
error:assignError,
}=
await supabase
.from(
"shared_goal_assignments"
)
.insert(
assignments
);

if(
assignError
){

console.log(
assignError
);

return{
error:
assignError.message,
};

}

return{
data:
sharedGoal,
};

}

/*
SHOW SHARED GOALS
*/

export async function getSharedGoals(){

const supabase=
createClient();

const profile=
await getCurrentUserProfile();

if(
!profile
){

return{
data:[]
};

}

let query=
supabase
.from(
"shared_goals"
)
.select("*")
.order(
"created_at",
{
ascending:
false,
}
);

if(
profile.role==="manager"
){

query=
query.eq(
"department",
profile.department
);

}

return query;

}

export async function getEmployeeSharedGoals(){

const supabase=
createClient();

const{
data:{
user,
},
}=await supabase.auth.getUser();

if(
!user
){

return{
data:[]
};

}

return supabase

.from(
"shared_goal_assignments"
)

.select(`

*,

shared_goals(

id,

title,

description,

target_value,

uom_type

)

`)

.eq(
"employee_id",
user.id
);

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