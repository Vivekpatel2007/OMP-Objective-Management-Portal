"use client";

import { use } from "react";

import { useEffect, useState } from "react";

import {
  getGoals,
  updateGoalProgress,
} from "@/services/goalservice";

export default function ProgressPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = use(params);

  const [goal, setGoal] =
    useState<any>(null);

  const [progress, setProgress] =
    useState(0);

  const [achievement, setAchievement] =
    useState("");

  const [
    employeeComment,
    setEmployeeComment,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function fetchGoal() {
      const response =
        await getGoals();

      const selected =
        response.data?.find(
          (g: any) =>
            g.id === id
        );

      if (selected) {
        setGoal(selected);

        setProgress(
          selected.progress || 0
        );

        setAchievement(
          selected.achievement ||
            ""
        );

        setEmployeeComment(
          selected.employee_comment ||
            ""
        );
      }

      setLoading(false);
    }

    fetchGoal();
  }, [id]);

  async function saveProgress(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const response =
      await updateGoalProgress(
        id,
        progress,
        achievement,
        employeeComment
      );

    if (response.error) {
      alert(response.error);

      return;
    }

    alert(
      "Progress updated"
    );

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
        Update Progress
      </h1>

      <div className="mb-6 rounded border p-5">
        <h2 className="text-xl font-semibold">
          {goal?.title}
        </h2>

        <p>
          {goal?.description}
        </p>
      </div>

      <form
        onSubmit={
          saveProgress
        }
        className="space-y-5 rounded border p-5"
      >
        <div>
          <label>
            Progress %
          </label>

          <input
            type="number"
            min={0}
            max={100}
            value={
              progress
            }
            onChange={(e) =>
              setProgress(
                Number(
                  e.target.value
                )
              )
            }
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label>
            Achievement
          </label>

          <textarea
            rows={4}
            value={
              achievement
            }
            onChange={(e) =>
              setAchievement(
                e.target.value
              )
            }
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label>
            Comment
          </label>

          <textarea
            rows={4}
            value={
              employeeComment
            }
            onChange={(e) =>
              setEmployeeComment(
                e.target.value
              )
            }
            className="w-full rounded border p-2"
          />
        </div>

        <button
          className="rounded bg-purple-600 px-5 py-2 text-white"
        >
          Save Progress
        </button>
      </form>
    </div>
  );
}