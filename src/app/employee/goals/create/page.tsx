"use client";

import { useState } from "react";

import { createGoal } from "@/services/goalservice";

export default function CreateGoalPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thrustArea, setThrustArea] = useState("");
  const [uomType, setUomType] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [weightage, setWeightage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("FORM SUBMITTED");

    const response = await createGoal({
      title,
      description,
      thrustArea,
      uomType,
      targetValue,
      weightage,
    });

    console.log("CREATE GOAL RESPONSE:", response);

    if (response?.error) {
      alert(response.error);
      return;
    }

    alert("Goal Created Successfully");

    // Reset form
    setTitle("");
    setDescription("");
    setThrustArea("");
    setUomType("");
    setTargetValue("");
    setWeightage("");
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Create Goal
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border p-6 shadow"
      >
        <div>
          <label className="mb-2 block font-medium">
            Goal Title
          </label>

          <input
            type="text"
            className="w-full rounded border p-2"
            placeholder="Increase sales revenue"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Description
          </label>

          <textarea
            className="w-full rounded border p-2"
            rows={4}
            placeholder="Describe the goal..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Thrust Area
          </label>

          <input
            type="text"
            className="w-full rounded border p-2"
            placeholder="Sales"
            value={thrustArea}
            onChange={(e) => setThrustArea(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            UOM Type
          </label>

          <select
            className="w-full rounded border p-2"
            value={uomType}
            onChange={(e) => setUomType(e.target.value)}
            required
          >
            <option value="">Select</option>

            <option value="numeric_min">
              Numeric Min
            </option>

            <option value="numeric_max">
              Numeric Max
            </option>

            <option value="percentage_min">
              Percentage Min
            </option>

            <option value="percentage_max">
              Percentage Max
            </option>

            <option value="timeline">
              Timeline
            </option>

            <option value="zero_based">
              Zero Based
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Target Value
          </label>

          <input
            type="number"
            className="w-full rounded border p-2"
            placeholder="100"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Weightage
          </label>

          <input
            type="number"
            className="w-full rounded border p-2"
            placeholder="20"
            value={weightage}
            onChange={(e) => setWeightage(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Create Goal
        </button>
      </form>
    </div>
  );
}