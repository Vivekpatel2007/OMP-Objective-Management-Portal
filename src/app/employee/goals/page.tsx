"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  getGoals,
  deleteGoal,
  submitGoalSheet,
} from "@/services/goalservice";

export default function EmployeeGoalsPage() {
  const [goals, setGoals] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [locked, setLocked] =
    useState(false);

  const [
    submissionStatus,
    setSubmissionStatus,
  ] = useState("draft");

  async function fetchGoals() {
    setLoading(true);

    const response =
      await getGoals();

    console.log(response);

    if (response.data) {
      setGoals(
        response.data
      );
    }

    setLocked(
      response.locked ||
        false
    );

    setSubmissionStatus(
      response.submissionStatus ||
        "draft"
    );

    setLoading(false);
  }

  useEffect(() => {
    fetchGoals();
  }, []);

  async function handleDelete(
    id: string
  ) {
    if (locked) {
      alert(
        "Goal sheet locked"
      );

      return;
    }

    const confirmed =
      confirm(
        "Delete goal?"
      );

    if (
      !confirmed
    )
      return;

    const response =
      await deleteGoal(
        id
      );

    console.log(
      response
    );

    if (
      response.error
    ) {
      alert(
        response.error
      );

      return;
    }

    alert(
      "Goal deleted"
    );

    fetchGoals();
  }

  async function handleSubmitGoalSheet() {
    if (
      locked
    ) {
      alert(
        "Goal sheet locked"
      );

      return;
    }

    const confirmed =
      confirm(
        "Submit goal sheet?"
      );

    if (
      !confirmed
    )
      return;

    const response =
      await submitGoalSheet();

    console.log(
      response
    );

    if (
      response?.error
    ) {
      alert(
        response.error
      );

      return;
    }

    alert(
      "Goal sheet submitted"
    );

    fetchGoals();
  }

  if (
    loading
  ) {
    return (
      <div className="p-6">
        Loading goals...
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Header */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Employee Goal Sheet
          </h1>

          <p className="mt-2 text-gray-600">

            Status:

            <span className="ml-2 font-semibold">

              {
                submissionStatus
              }

            </span>

          </p>

        </div>

        {/* Create */}

        {!locked &&
          goals.length <
            8 && (
            <Link
              href="/employee/goals/create"
              className="rounded bg-black px-5 py-2 text-white"
            >
              Create Goal
            </Link>
          )}

      </div>

      {/* Locked */}

      {locked && (
        <div className="mb-5 rounded border border-green-300 bg-green-50 p-4">

          Goal sheet locked

        </div>
      )}

      {/* Empty */}

      {goals.length ===
      0 ? (
        <div className="rounded border p-6 text-center">

          No goals available

        </div>
      ) : (
        <div className="space-y-5">

          {goals.map(
            (
              goal
            ) => (
              <div
                key={
                  goal.id
                }
                className="rounded border p-5 shadow"
              >
                <h2 className="text-xl font-semibold">

                  {
                    goal.title
                  }

                </h2>

                <p className="mt-2 text-gray-600">

                  {
                    goal.description
                  }

                </p>

                <div className="mt-4 grid grid-cols-2 gap-4">

                  <div>

                    Target:
                    {" "}
                    {
                      goal.target_value
                    }

                  </div>

                  <div>

                    Weightage:
                    {" "}
                    {
                      goal.weightage
                    }
                    %

                  </div>

                  <div>

                    Progress:
                    {" "}
                    {
                      goal.progress ||
                      0
                    }
                    %

                  </div>

                  <div>

                    UOM:
                    {" "}
                    {
                      goal.uom_type
                    }

                  </div>

                </div>

                {/* Actions */}

                {!locked && (
                  <div className="mt-5 flex gap-3">

                    <Link
                      href={`/employee/goals/edit/${goal.id}`}
                      className="rounded bg-yellow-500 px-4 py-2 text-white"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() =>
                        handleDelete(
                          goal.id
                        )
                      }
                      className="rounded bg-red-600 px-4 py-2 text-white"
                    >
                      Delete
                    </button>

                    <Link
                      href={`/employee/goals/progress/${goal.id}`}
                      className="rounded bg-purple-600 px-4 py-2 text-white"
                    >
                      Update Progress
                    </Link>

                  </div>
                )}

              </div>
            )
          )}

        </div>
      )}

      {/* Submit */}

      {!locked &&
        goals.length >
          0 && (
          <div className="mt-8">

            <button
              onClick={
                handleSubmitGoalSheet
              }
              className="rounded bg-green-600 px-5 py-2 text-white"
            >
              Submit Goal Sheet
            </button>

          </div>
        )}

    </div>
  );
}