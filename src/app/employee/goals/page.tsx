"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  getGoals,
  deleteGoal,
  submitGoalSheet,
} from "@/services/goalservice";

import {
  getEmployeeSharedGoals,
  updateSharedWeightage,
} from "@/services/sharedgoalservice";

export default function EmployeeGoalsPage() {

  const [goals,setGoals]=
  useState<any[]>([]);

  const[
    sharedGoals,
    setSharedGoals,
  ]=
  useState<any[]>([]);

  const[
    loading,
    setLoading,
  ]=
  useState(true);

  const[
    locked,
    setLocked,
  ]=
  useState(false);

  const[
    submissionStatus,
    setSubmissionStatus,
  ]=
  useState("draft");

  async function fetchGoals(){

    setLoading(
      true
    );

    const response=
    await getGoals();

    if(
      response.data
    ){

      setGoals(
        response.data
      );

    }

    setLocked(
      response.locked||
      false
    );

    setSubmissionStatus(
      response.submissionStatus||
      "draft"
    );

    const shared=
    await getEmployeeSharedGoals();

    setSharedGoals(
      shared.data||
      []
    );

    setLoading(
      false
    );

  }

  useEffect(()=>{

    fetchGoals();

  },[]);

  async function saveWeight(
    goal:any
  ){

    await updateSharedWeightage(

      goal.id,

      goal.weightage

    );

    alert(
      "Weightage updated"
    );

    fetchGoals();

  }

  async function handleDelete(
    id:string
  ){

    if(
      locked
    ){

      alert(
        "Goal sheet locked"
      );

      return;

    }

    await deleteGoal(
      id
    );

    fetchGoals();

  }

  async function handleSubmitGoalSheet(){

    if(
      locked
    ){

      alert(
        "Goal sheet locked"
      );

      return;

    }

    await submitGoalSheet();

    fetchGoals();

  }

  if(
    loading
  ){

    return(

      <div className="p-10">

        Loading...

      </div>

    );

  }

  return(

<div className="p-6">

{/* HEADER */}

<div className="mb-8 flex justify-between">

<div>

<h1 className="text-4xl font-bold">

Employee Goal Sheet

</h1>

<p className="mt-2 text-gray-500">

Status:

<strong>

{" "}

{
submissionStatus
}

</strong>

</p>

</div>

{
!locked
&&
goals.length<8
&&(

<Link

href="/employee/goals/create"

className="rounded bg-black px-5 py-3 text-white"

>

Create Goal

</Link>

)

}

</div>

{/* NORMAL */}

<div>

<h2 className="mb-5 text-3xl font-bold">

My Goals

</h2>

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

className="rounded-xl border bg-white p-6"

>

<h3 className="text-2xl font-bold">

{
goal.title
}

</h3>

<p>

{
goal.description
}

</p>

<div className="mt-4 grid grid-cols-2 gap-4">

<div>

Target:

{
goal.target_value
}

</div>

<div>

Weight:

{
goal.weightage
}
%

</div>

<div>

Progress:

{
goal.progress||
0
}
%

</div>

<div>

UOM:

{
goal.uom_type
}

</div>

</div>

{
!locked
&&(

<div className="mt-5 flex gap-3">

<Link

href={`/employee/goals/edit/${goal.id}`}

className="rounded bg-yellow-500 px-4 py-2 text-white"

>

Edit

</Link>

<button

onClick={()=>

handleDelete(
goal.id
)

}

className="rounded bg-red-600 px-4 py-2 text-white"

>

Delete

</button>

</div>

)

}

</div>

)

)

}

</div>

</div>

{/* SHARED */}

<div className="mt-12">

<h2 className="mb-5 text-3xl font-bold">

Shared Goals

</h2>

{
sharedGoals.length===0

?

<div className="rounded-xl border p-6">

No shared goals

</div>

:

<div className="space-y-5">

{

sharedGoals.map(
(
goal:any
)=>(

<div

key={
goal.id
}

className="rounded-xl border bg-blue-50 p-6"

>

<div className="flex justify-between">

<div>

<h3 className="text-2xl font-bold">

{

goal.shared_goals
?.title

}

</h3>

<p>

{

goal.shared_goals
?.description

}

</p>

<p className="mt-3">

Target:

<strong>

{

goal.shared_goals
?.target_value

}

</strong>

</p>

<p>

Achievement:

<strong>

{
goal.achievement
}
%

</strong>

</p>

</div>

<div>

<label>

Weightage

</label>

<input

type="number"

value={
goal.weightage
}

onChange={(e)=>{

goal.weightage=

Number(
e.target.value
);

setSharedGoals(
[
...sharedGoals
]
);

}}

className="mt-2 rounded border p-3"

/>

<button

onClick={()=>
saveWeight(
goal
)
}

className="mt-3 rounded bg-blue-600 px-5 py-2 text-white"

>

Save

</button>

</div>

</div>

<div className="mt-5 rounded bg-white p-3">

🔒 Goal Title and Target are locked

</div>

</div>

)

)

}

</div>

}

</div>

{/* SUBMIT */}

{
!locked
&&
goals.length>0
&&(

<div className="mt-8">

<button

onClick={
handleSubmitGoalSheet
}

className="rounded bg-green-600 px-5 py-3 text-white"

>

Submit Goal Sheet

</button>

</div>

)

}

</div>

);

}