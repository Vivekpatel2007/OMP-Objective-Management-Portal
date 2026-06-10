import { createClient } from "@/lib/supabase/client";

export async function getQuarterlyGoals(
quarter:string
){
const supabase=
createClient();

const{
data:{
user,
},
}=await supabase.auth.getUser();

if(!user){

return{
data:[]
};

}

const{
data:sheet,
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

if(!sheet){

return{
data:[]
};

}

return supabase
.from(
"goals"
)
.select("*")
.eq(
"goal_sheet_id",
sheet.id
)
.eq(
"quarter",
quarter
);
}


export async function updateQuarterlyCheckin(
goal:any
){

const supabase=
createClient();

const target=
Number(
goal.target_value
);

const current=
Number(
goal.actual_achievement
);

let progress=0;

if(
target>0
){

progress=
Math.round(
(current/
target)
*
100
);

if(
progress>
100
){

progress=
100;

}

}

return supabase
.from(
"goals"
)
.update({

actual_achievement:
current,

goal_status:
goal.goal_status,

progress:
progress,

progress_score:
progress,

updated_at:
new Date(),

})
.eq(
"id",
goal.id
);

}

export async function getEmployees() {

const supabase =
createClient();

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

export async function getManagerCheckins(
employeeId?:string
){

const supabase=
createClient();

const{
data:sheets,
}=await supabase
.from(
"goal_sheets"
)
.select("*");

const{
data:profiles,
}=await supabase
.from(
"profiles"
)
.select("*");

const{
data:goals,
}=await supabase
.from(
"goals"
)
.select("*");

if(
!goals
){

return{
data:[]
};

}

const merged=
goals.map(
(
goal:any
)=>{

const sheet=
sheets?.find(
(
s:any
)=>
s.id===
goal.goal_sheet_id
);

const employee=
profiles?.find(
(
p:any
)=>
p.id===
sheet
?.employee_id
);

return{

...goal,

employee,

};

}
);

const filtered=
employeeId

?

merged.filter(
(
g:any
)=>

g.employee
?.id===employeeId
)

:

merged;

return{

data:
filtered,

};

}
export async function saveManagerComment(
  id: string,
  comment: string
) {
  const supabase =
    createClient();

  return supabase
    .from(
      "goals"
    )
    .update({
      manager_comment:
        comment,
    })
    .eq(
      "id",
      id
    );
}