
"use client";

import { useState } from "react";
import Link from "next/link";

import {
ArrowLeft,
Target,
Save,
Loader2,
ChevronRight,
} from "lucide-react";

import {
createGoal,
} from "@/services/goalservice";

export default function CreateGoalPage(){

const[
title,
setTitle,
]=useState("");

const[
description,
setDescription,
]=useState("");

const[
thrustArea,
setThrustArea,
]=useState("");

const[
uomType,
setUomType,
]=useState("");

const[
targetValue,
setTargetValue,
]=useState("");

const[
weightage,
setWeightage,
]=useState("");

const[
loading,
setLoading,
]=useState(false);

const[
message,
setMessage,
]=useState("");

async function submit(
e:React.FormEvent
){

e.preventDefault();

setLoading(
true
);

setMessage("");

try{

const res=
await createGoal({

title,

description,

thrustArea,

uomType,

targetValue,

weightage,

});

if(
res?.error
){

setMessage(
res.error
);

return;

}

window.location.href=
"/employee/dashboard";

}

finally{

setLoading(
false
);

}

}

return(

<div className="min-h-screen bg-[#F8F9FC]">

<div className="max-w-7xl mx-auto px-5 py-8">

{/* BACK */}

<Link
href="/employee/goals"
className="
inline-flex
items-center
gap-2
text-sm
text-gray-500
hover:text-black
mb-6
"
>

<ArrowLeft
size={16}
/>

Back

</Link>

{/* HERO */}

<div
className="
rounded-[32px]
bg-[#0F1729]
text-white
overflow-hidden
"
>

<div className="p-8">

<div
className="
inline-flex
w-14
h-14
rounded-2xl
bg-indigo-600
items-center
justify-center
mb-5
"
>

<Target
size={26}
/>

</div>

<h1
className="
text-4xl
font-black
mb-3
"
>

Create Goal

</h1>

<p
className="
text-white/50
max-w-2xl
"
>

Create measurable objectives
aligned with your quarter
performance.

</p>

</div>

</div>

<div
className="
grid
xl:grid-cols-[1.4fr_0.6fr]
gap-6
mt-6
"
>

{/* FORM */}

<form
onSubmit={
submit
}
className="
bg-white
rounded-[32px]
p-8
border
border-gray-100
"
>

<div className="space-y-6">

<Field
label="Goal Title"
>

<input
required
value={
title
}
onChange={
e=>
setTitle(
e.target.value
)
}
placeholder="Increase customer retention"
className={input}
/>

</Field>

<Field
label="Description"
>

<textarea
required
rows={5}
value={
description
}
onChange={
e=>
setDescription(
e.target.value
)
}
placeholder="Describe goal..."
className={`${input} resize-none`}
/>

</Field>

<div className="grid md:grid-cols-2 gap-5">

<Field
label="Thrust Area"
>

<input
required
value={
thrustArea
}
onChange={
e=>
setThrustArea(
e.target.value
)
}
placeholder="Sales"
className={input}
/>

</Field>

<Field
label="Measurement"
>

<select
required
value={
uomType
}
onChange={
e=>
setUomType(
e.target.value
)
}
className={input}
>

<option value="">

Select

</option>

<option value="numeric_max">

Numeric Max

</option>

<option value="percentage_max">

Percentage

</option>

<option value="timeline">

Timeline

</option>

</select>

</Field>

<Field
label="Target"
>

<input
required
type="number"
value={
targetValue
}
onChange={
e=>
setTargetValue(
e.target.value
)
}
className={input}
/>

</Field>

<Field
label="Weightage %"
>

<input
required
min={10}
max={100}
type="number"
value={
weightage
}
onChange={
e=>
setWeightage(
e.target.value
)
}
className={input}
/>

</Field>

</div>

</div>

{

message

&&

<div
className="
mt-5
rounded-xl
bg-red-50
text-red-600
p-4
"
>

{message}

</div>

}

<button
disabled={
loading
}
className="
mt-8
w-full
h-14
rounded-2xl
bg-indigo-600
text-white
font-semibold
hover:bg-indigo-700
transition
flex
justify-center
items-center
gap-3
"
>

{

loading

?

<>

<Loader2
size={18}
className="
animate-spin
"
/>

Saving...

</>

:

<>

<Save
size={18}
/>

Create Goal

</>

}

</button>

</form>

{/* SIDE */}

<div className="space-y-5">

<Card>

<h3
className="
font-semibold
mb-3
"
>

Goal Guidelines

</h3>

<ul
className="
space-y-3
text-sm
text-gray-500
"
>

<li>

•

Max 8 goals

</li>

<li>

•

Weight ≥ 10%

</li>

<li>

•

Total = 100%

</li>

<li>

•

Be measurable

</li>

</ul>

</Card>

<Card>

<h3
className="
font-semibold
mb-4
"
>

Weight Preview

</h3>

<div
className="
h-3
rounded-full
bg-gray-100
overflow-hidden
"
>

<div
className="
h-full
bg-indigo-600
"
style={{
width:
`${Math.min(
100,
Number(
weightage
||
0
)
)}%`
}}
/>

</div>

<div
className="
mt-3
text-sm
text-gray-500
"
>

{
weightage
||
0
}
%

allocated

</div>

</Card>

<Card>

<Link
href="/employee/goals"
className="
flex
justify-between
items-center
"
>

View Goal Sheet

<ChevronRight
size={16}
/>

</Link>

</Card>

</div>

</div>

</div>

</div>

);

}

function Field({
label,
children,
}:any){

return(

<div>

<label
className="
block
text-sm
font-medium
mb-2
"
>

{label}

</label>

{children}

</div>

);

}

function Card({
children,
}:any){

return(

<div
className="
bg-white
rounded-[32px]
p-6
border
border-gray-100
"
>

{children}

</div>

);

}

const input=
`
w-full
h-14
rounded-2xl
border
border-gray-200
px-5
outline-none
focus:ring-4
focus:ring-indigo-100
focus:border-indigo-500
transition
`;
