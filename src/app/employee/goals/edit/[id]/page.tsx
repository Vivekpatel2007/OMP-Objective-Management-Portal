"use client";

import { use } from "react";

import { useEffect, useState } from "react";

import {
  getGoals,
  updateGoal,
} from "@/services/goalservice";

export default function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");

  const [thrustArea, setThrustArea] =
    useState("");

  const [uomType, setUomType] = useState("");

  const [targetValue, setTargetValue] =
    useState("");

  const [weightage, setWeightage] =
    useState("");

  // Fetch goal
  useEffect(() => {
    async function fetchGoal() {
      const response = await getGoals();

      const goal = response.data?.find(
        (g: any) => g.id === id
      );

      if (goal) {
        setTitle(goal.title);

        setDescription(goal.description);

        setThrustArea(goal.thrust_area);

        setUomType(goal.uom_type);

        setTargetValue(
          String(goal.target_value)
        );

        setWeightage(
          String(goal.weightage)
        );
      }

      setLoading(false);
    }

    fetchGoal();
  }, [id]);

  // Update
  async function handleUpdate(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const response = await updateGoal(id, {
      title,
      description,
      thrustArea,
      uomType,
      targetValue,
      weightage,
    });

    console.log(response);

    if (response.error) {
      alert(response.error);
      return;
    }

    alert("Goal updated successfully");

    window.location.href =
      "/employee/goals";
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Edit Goal
      </h1>

      <form
        onSubmit={handleUpdate}
        className="space-y-5 rounded-lg border p-6 shadow"
      >
        <input
          type="text"
          placeholder="Goal Title"
          className="w-full rounded border p-2"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
        />

        <textarea
          placeholder="Description"
          className="w-full rounded border p-2"
          rows={4}
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="Thrust Area"
          className="w-full rounded border p-2"
          value={thrustArea}
          onChange={(e) =>
            setThrustArea(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="UOM Type"
          className="w-full rounded border p-2"
          value={uomType}
          onChange={(e) =>
            setUomType(e.target.value)
          }
        />

        <input
          type="number"
          placeholder="Target Value"
          className="w-full rounded border p-2"
          value={targetValue}
          onChange={(e) =>
            setTargetValue(
              e.target.value
            )
          }
        />

        <input
          type="number"
          placeholder="Weightage"
          className="w-full rounded border p-2"
          value={weightage}
          onChange={(e) =>
            setWeightage(
              e.target.value
            )
          }
        />

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Update Goal
        </button>
      </form>
    </div>
  );
}