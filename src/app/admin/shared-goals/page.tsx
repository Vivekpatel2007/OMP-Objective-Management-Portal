"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
createSharedGoal,
getEmployees,
getSharedGoals,
} from "@/services/sharedgoalservice";

export default function AdminSharedGoals(){

const[
employees,
setEmployees,
]=useState<any[]>(
[]
);

const[
selected,
setSelected,
]=useState<any[]>(
[]
);

const[
sharedGoals,
setSharedGoals,
]=useState<any[]>(
[]
);

const[
departments,
setDepartments,
]=useState<string[]>(
[]
);

const[
goal,
setGoal,
]=useState({

title:"",

description:"",

target:"",

uom:"min",

weightage:10,

type:"all",

department:"",

});

async function load(){

const emp=
await getEmployees();

setEmployees(
emp.data||
[]
);

const goals=
await getSharedGoals();

setSharedGoals(
goals.data||
[]
);

setDepartments(

[
...new Set(

(emp.data||
[])

.map(
(
e:any
)=>
e.department
)

)

]

);

}

useEffect(()=>{

load();

},[]);

function toggle(
emp:any
){

if(
selected.some(
(
s
)=>
s.id===emp.id
)
){

setSelected(

selected.filter(
(
s
)=>
s.id!==emp.id
)

);

return;

}

setSelected(
[
...selected,
emp,
]
);

}

async function create(){

const response=
await createSharedGoal({

...goal,

employees:
selected,

});

if(
response.error
){

alert(
response.error
);

return;

}

alert(
"Created"
);

load();

}

return(

<div className="min-h-screen bg-slate-100">

<div className="flex">

{/* LEFT */}

<div className="flex-1 p-10">

<div className="mb-8 flex justify-between">

<div>

<p className="font-semibold text-red-600">

ADMIN PANEL

</p>

<h1 className="text-5xl font-bold">

Shared Goals

</h1>

</div>

<Link
href="/admin/dashboard"
className="rounded-xl border bg-white px-5 py-3"
>

Back

</Link>

</div>

<div className="rounded-3xl bg-white p-8 shadow">

<input

placeholder="Goal Title"

className="mb-5 w-full rounded-xl border p-4"

onChange={(e)=>

setGoal({

...goal,

title:
e.target.value,

})

}

/>

<textarea

placeholder="Description"

className="mb-5 w-full rounded-xl border p-4"

onChange={(e)=>

setGoal({

...goal,

description:
e.target.value,

})

}

/>

<div className="grid grid-cols-3 gap-5">

<input

type="number"

placeholder="Target"

className="rounded-xl border p-4"

onChange={(e)=>

setGoal({

...goal,

target:
e.target.value,

})

}

/>

<input

type="number"

placeholder="Weightage"

className="rounded-xl border p-4"

onChange={(e)=>

setGoal({

...goal,

weightage:
Number(
e.target.value
),

})

}

/>

<select

className="rounded-xl border p-4"

onChange={(e)=>

setGoal({

...goal,

uom:
e.target.value,

})

}
>

<option>

min

</option>

<option>

max

</option>

<option>

zero

</option>

</select>

</div>

<div className="mt-8">

<h2 className="mb-4 text-2xl font-bold">

Assign To

</h2>

<div className="flex gap-3">

{
[
"all",
"department",
"employee",
].map(
(
type
)=>(

<button

key={
type
}

onClick={()=>

setGoal({

...goal,

type,

})

}

className={`rounded-full px-5 py-2 ${
goal.type===type

?

"bg-red-600 text-white"

:

"bg-gray-200"

}`}

>

{
type
}

</button>

)

)

}

</div>

{
goal.type==="department"

&&

<select

className="mt-5 w-full rounded-xl border p-4"

onChange={(e)=>

setGoal({

...goal,

department:
e.target.value,

})

}
>

<option>

Select Department

</option>

{
departments.map(
(
d
)=>(

<option
key={
d
}
>

{
d
}

</option>

)

)

}

</select>

}

{
goal.type==="employee"

&&

<div className="mt-5 grid grid-cols-3 gap-3">

{
employees.map(
(
emp
)=>{

const active=
selected.some(
(
s
)=>
s.id===emp.id
);

return(

<button

key={
emp.id
}

onClick={()=>
toggle(
emp
)
}

className={`rounded-xl border p-4 text-left ${
active

?

"bg-red-600 text-white"

:

"bg-white"

}`}

>

<h3>

{
emp.full_name
}

</h3>

<p>

{
emp.department
}

</p>

</button>

);

}

)

}

</div>

}

</div>

<button

onClick={
create
}

className="mt-8 rounded-2xl bg-red-600 px-8 py-4 text-white"

>

Create Goal

</button>

</div>

</div>

{/* RIGHT */}

<div className="w-[420px] border-l bg-white p-8">

<h2 className="text-3xl font-bold">

Shared Goals

</h2>

<div className="mt-5 space-y-4">

{
sharedGoals.map(
(
g
)=>(

<div
key={
g.id
}
className="rounded-2xl border p-5"
>

<h3>

{
g.title
}

</h3>

<p>

{
g.assignment_type
}

</p>

<p>

Target:
{
g.target_value
}

</p>

</div>

)

)

}

</div>

</div>

</div>

</div>

);

}