"use client";

import {
useEffect,
useState,
} from "react";

import {
getEmployees,
getManagerCheckins,
saveManagerComment,
} from "@/services/checkinservice";

export default function ManagerCheckin(){

const[
employees,
setEmployees,
]=useState<any[]>(
[]
);

const[
selected,
setSelected,
]=useState("");

const[
goals,
setGoals,
]=useState<any[]>(
[]
);

useEffect(()=>{

loadEmployees();

},[]);

useEffect(()=>{

loadGoals();

},[
selected
]);

async function loadEmployees(){

const{
data,
}=await getEmployees();

setEmployees(
data||
[]
);

}

async function loadGoals(){

const{
data,
}=await getManagerCheckins(
selected
);

setGoals(
data||
[]
);

}

async function save(
goal:any
){

await saveManagerComment(

goal.id,

goal.manager_comment

);

alert(
"Saved"
);

}

return(

<div className="p-6">

<h1 className="mb-6 text-3xl font-bold">

Manager Check-ins

</h1>

<select

value={
selected
}

onChange={(e)=>
setSelected(
e.target.value
)
}

className="mb-6 border p-3"
>

<option value="">

All Employees

</option>

{
employees.map(
(
emp
)=>(
<option
key={
emp.id
}
value={
emp.id
}
>

{
emp.full_name
}

</option>
)
)

}

</select>

<div className="space-y-5">

{
goals.map(
(
goal
)=>(
<div
key={
goal.id
}
className="rounded border p-5"
>

<h2 className="text-2xl font-bold">

{
goal.goal_sheets
?.profiles
?.full_name
}

</h2>

<p>

Goal:
{" "}

{
goal.title
}

</p>

<p>

Target:
{" "}

{
goal.target_value
}

</p>

<p>

Actual:
{" "}

{
goal.actual_achievement
}

</p>

<p>

Progress:
{" "}

{
goal.progress
}
%

</p>

<textarea

value={
goal.manager_comment||
""
}

onChange={(e)=>{

goal.manager_comment=
e.target.value;

setGoals(
[
...goals
]
);

}}

className="mt-4 w-full border p-3"

placeholder="Manager Comment"
/>

<button

onClick={()=>
save(
goal
)
}

className="mt-4 rounded bg-green-600 px-5 py-2 text-white"
>

Save

</button>

</div>
)
)

}

</div>

</div>

);

}