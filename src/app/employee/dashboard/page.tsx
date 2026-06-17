"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
LayoutDashboard,
ListChecks,
CalendarCheck,
Users,
BarChart2,
Bell,
Settings,
Target,
TrendingUp,
ArrowUpRight,
ChevronRight,
Menu,
X,
Flag,
Send,
Edit3,
FileText,
PieChart,
Clock,
} from "lucide-react";

import {
getGoals,
submitGoalSheet,
} from "@/services/goalservice";

import {
getEmployeeSharedGoals,
getCurrentUserProfile,
} from "@/services/sharedgoalservice";

import {
getNotifications,
} from "@/services/notificationservice";

interface Goal{
id:string|number;
title:string;
weightage:number|string;
target_value:number|string;
progress:number|string;
}

const COLORS=[
"#5B4EFF",
"#10B981",
"#F59E0B",
"#3B82F6",
"#EC4899",
];

function Progress({
value,
color,
}:{
value:number;
color:string;
}){

return(

<div>

<div className="h-2 rounded-full bg-gray-100 overflow-hidden">

<div
className="h-full rounded-full"
style={{
width:`${value}%`,
backgroundColor:color,
}}
/>

</div>

<div className="text-xs text-gray-400 mt-1">

{value}%

</div>

</div>

);

}

function Stat({
title,
value,
icon:Icon,
}:any){

return(

<div className="bg-white rounded-2xl border p-5">

<div className="flex justify-between">

<div className="text-gray-400 text-sm">

{title}

</div>

<Icon
size={18}
/>

</div>

<div className="mt-5 text-3xl font-bold">

{value}

</div>

</div>

);

}

export default function EmployeeDashboard(){

const[
loading,
setLoading,
]=useState(true);

const[
profile,
setProfile,
]=useState<any>(
null
);

const[
goals,
setGoals,
]=useState<
Goal[]
>([]);

const[
sharedGoals,
setSharedGoals,
]=useState<any[]>(
[]
);

const[
notifications,
setNotifications,
]=useState<any[]>(
[]
);

const[
mobile,
setMobile,
]=useState(
false
);

const[
stats,
setStats,
]=useState({

total:0,

progress:0,

weight:0,

status:
"draft",

});

useEffect(
()=>{

load();

},
[]
);

async function load(){

try{

setLoading(
true
);

const[
goalRes,
shared,
user,
notif,
]=
await Promise.all([

getGoals(),

getEmployeeSharedGoals(),

getCurrentUserProfile(),

getNotifications(),

]);

const data=
goalRes?.data
||
[];

setGoals(
data
);

setSharedGoals(
shared?.data
||
[]
);

setNotifications(
notif?.data
||
[]
);

setProfile(
user
);

const totalWeight=
data.reduce(
(a,b)=>
a+
Number(
b.weightage||
0
),
0
);

const avg=
data.length

?

Math.round(
data.reduce(
(a,b)=>
a+
Number(
b.progress||
0
),
0
)
/data.length
)

:0;

setStats({

total:
data.length,

progress:
avg,

weight:
totalWeight,

status:
goalRes
?.submissionStatus
||
"draft",

});

}

finally{

setLoading(
false
);

}

}

async function submit(){

const res=
await submitGoalSheet();

if(
res?.error
){

alert(
res.error
);

return;

}

alert(
"Goal Sheet Submitted"
);

load();

}

if(
loading
){

return(

<div className="h-screen grid place-items-center">

Loading Dashboard...

</div>

);

}

return(

<div className="flex h-screen bg-[#F8F9FC]">

{/* SIDEBAR */}

<aside
className={`
fixed
md:static
bg-[#0F1729]
w-[230px]
h-screen
z-50
transition

${

mobile

?

"translate-x-0"

:

"-translate-x-full"

}

md:translate-x-0

`}
>

<div className="p-5">

<h1 className="text-white font-bold text-xl">

GoalTrack

</h1>

</div>

<nav className="space-y-2 px-3">

<Item
icon={
LayoutDashboard
}
href="/employee/dashboard"
label="Dashboard"
/>

<Item
icon={
ListChecks
}
href="/employee/goals"
label="Goals"
/>

<Item
icon={
CalendarCheck
}
href="/employee/checkins"
label="Check-ins"
/>

<Item
icon={
BarChart2
}
href="/employee/report"
label="Reports"
/>

<Item
icon={
Settings
}
href="/settings"
label="Settings"
/>

</nav>

</aside>

<div className="flex-1 flex flex-col">

<header className="bg-white px-5 py-4 border-b flex justify-between">

<div className="flex gap-3 items-center">

<button
onClick={()=>
setMobile(
!mobile
)
}
className="md:hidden"
>

{
mobile

?

<X/>

:

<Menu/>

}

</button>

<div>

Dashboard

</div>

</div>

<div className="flex gap-3">

<Link
href="/notifications"
className="relative"
>

<Bell/>

{
notifications.length>
0
&&(

<div
className="
absolute
top-0
right-0
w-2
h-2
bg-indigo-600
rounded-full
"
/>

)

}

</Link>

<div>

{
profile
?.full_name
}

</div>

</div>

</header>

<main className="p-5 overflow-auto">

<div className="bg-[#0F1729] rounded-3xl p-6 text-white mb-5">

<div className="flex justify-between">

<div>

<h2 className="text-3xl font-bold">

Hello,

{
profile
?.full_name
}

👋

</h2>

<p className="text-white/50 mt-2">

Track goals
and progress

</p>

</div>

<div className="hidden md:flex">

<div>

<Clock/>

Q3 Active

</div>

</div>

</div>

</div>

<div className="grid md:grid-cols-4 gap-4">

<Stat
title="Goals"
value={stats.total}
icon={Target}
/>

<Stat
title="Progress"
value={`${stats.progress}%`}
icon={TrendingUp}
/>

<Stat
title="Weight"
value={`${stats.weight}%`}
icon={PieChart}
/>

<Stat
title="Status"
value={stats.status}
icon={FileText}
/>

</div>

<div className="flex gap-3 mt-5">

<Link
href="/employee/goals"
className="
px-4
py-2
rounded-xl
bg-indigo-600
text-white
"
>

View Goals

</Link>

<button
onClick={
submit
}
className="
px-4
py-2
rounded-xl
bg-white
border
"
>

<Send
size={15}
/>

</button>

</div>

<div className="grid xl:grid-cols-3 gap-5 mt-6">

<div className="xl:col-span-2 bg-white rounded-3xl p-5">

<h3 className="font-semibold mb-5">

My Goals

</h3>

<div className="space-y-5">

{

goals.length===0

?

<div>

No Goals

</div>

:

goals.map(
(
g,
i
)=>(

<div
key={
g.id
}
>

<div className="flex justify-between">

<div>

{
g.title
}

</div>

<div>

{
g.weightage
}
%

</div>

</div>

<Progress
value={
Number(
g.progress||
0
)
}
color={
COLORS[
i%
COLORS.length
]
}
/>

</div>

)
)

}

</div>

</div>

<div className="bg-white rounded-3xl p-5">

<h3 className="font-semibold mb-5">

Shared Goals

</h3>

<div className="space-y-3">

{
sharedGoals.length===0

?

<div>

No Shared Goals

</div>

:

sharedGoals.map(
g=>(

<div
key={
g.id
}
className="
border
rounded-xl
p-4
"
>

<div className="font-medium">

{
g.shared_goals
?.title
}

</div>

<div className="text-sm text-gray-400">

Target:

{
g.shared_goals
?.target_value
}

</div>

</div>

)
)

}

</div>

</div>

</div>

</main>

</div>

</div>

);

}

function Item({
icon:Icon,
href,
label,
}:any){

return(

<Link
href={href}
className="
flex
gap-3
px-4
py-3
rounded-xl
text-white/70
hover:bg-white/10
"
>

<Icon
size={16}
/>

{label}

</Link>

);

}
