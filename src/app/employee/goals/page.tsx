"use client";

import { useEffect, useState } from "react";

import { getGoals } from "@/services/goalservice";

interface Goal {
  id: string;
  title: string;
  description: string;
  thrust_area: string;
  uom_type: string;
  target_value: number;
  weightage: number;
  status: string;
}

export default function EmployeeGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGoals() {
      const response = await getGoals();

      console.log(response);

      if (response.data) {
        setGoals(response.data);
      }

      setLoading(false);
    }

    fetchGoals();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-lg font-semibold">
        Loading goals...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          My Goals
        </h1>

        <a
          href="/employee/goals/create"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Create Goal
        </a>
      </div>

      {goals.length === 0 ? (
        <div className="rounded border p-6 text-center text-gray-500">
          No goals created yet.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="rounded-lg border p-5 shadow"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {goal.title}
                </h2>

                <span className="rounded bg-gray-100 px-3 py-1 text-sm">
                  {goal.status}
                </span>
              </div>

              <p className="mb-4 text-gray-600">
                {goal.description}
              </p>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">
                    Thrust Area:
                  </span>{" "}
                  {goal.thrust_area}
                </p>

                <p>
                  <span className="font-semibold">
                    UOM Type:
                  </span>{" "}
                  {goal.uom_type}
                </p>

                <p>
                  <span className="font-semibold">
                    Target Value:
                  </span>{" "}
                  {goal.target_value}
                </p>

                <p>
                  <span className="font-semibold">
                    Weightage:
                  </span>{" "}
                  {goal.weightage}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}