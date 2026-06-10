"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  getQuarterlyGoals,
  updateQuarterlyCheckin,
} from "@/services/checkinservice";

export default function EmployeeCheckinPage() {
  const [quarter, setQuarter] =
    useState("Q1");

  const [goals, setGoals] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadGoals();
  }, [quarter]);

  async function loadGoals() {
    setLoading(true);

    const response =
      await getQuarterlyGoals(
        quarter
      );

    setGoals(
      response.data ||
        []
    );

    setLoading(false);
  }

  async function save(
    goal: any
  ) {
    const response =
      await updateQuarterlyCheckin(
        goal
      );

    if (
      response?.error
    ) {
      alert(
        response.error
      );

      return;
    }

    await loadGoals();

    setMessage(
      "Check-in saved. Progress updated automatically."
    );
  }

  const avgProgress =
    goals.length
      ? Math.round(
          goals.reduce(
            (
              total,
              g
            ) =>
              total +
              (g.progress ||
                0),
            0
          ) /
            goals.length
        )
      : 0;

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Header */}

      <div className="border-b bg-white">

        <div className="flex items-center justify-between p-5">

          <div>

            <p className="font-semibold text-blue-700">
              EMPLOYEE
              WORKSPACE
            </p>

            <h1 className="text-5xl font-bold">
              Quarterly
              Check-ins
            </h1>

            <p className="mt-2 text-gray-500">
              Update actual
              achievement
              and status
              for goals
            </p>

          </div>

          <Link
            href="/employee/dashboard"
            className="rounded-xl border px-5 py-3"
          >
            Back
          </Link>

        </div>

      </div>

      <div className="p-5">

        {/* Top */}

        <div className="mb-6 grid grid-cols-3 gap-5">

          <Card
            title="Quarter"
            value={quarter}
            sub="Selected period"
          />

          <Card
            title="Goals"
            value={goals.length}
            sub="Available goals"
          />

          <Card
            title="Progress"
            value={`${avgProgress}%`}
            sub="Auto computed"
          />

        </div>

        {/* Quarter */}

        <div className="mb-6 rounded-2xl bg-white p-5 shadow">

          <div className="flex justify-between">

            <h2 className="text-2xl font-semibold">
              Check-in
              Workspace
            </h2>

            <div className="flex gap-3">

              {[
                "Q1",
                "Q2",
                "Q3",
                "Q4",
              ].map(
                (
                  q
                ) => (
                  <button
                    key={q}
                    onClick={() =>
                      setQuarter(
                        q
                      )
                    }
                    className={`rounded-xl px-5 py-2 ${
                      quarter ===
                      q
                        ? "bg-blue-600 text-white"
                        : "border"
                    }`}
                  >
                    {q}
                  </button>
                )
              )}

            </div>

          </div>

        </div>

        {message && (
          <div className="mb-5 rounded-xl bg-green-50 p-4 text-green-700">

            {message}

          </div>
        )}

        {/* Goals */}

        <div className="space-y-6">

          {goals.map(
            (
              goal
            ) => (
              <div
                key={
                  goal.id
                }
                className="rounded-2xl bg-white p-6 shadow"
              >

                <div className="flex justify-between">

                  <div>

                    <div className="flex items-center gap-3">

                      <h2 className="text-3xl font-bold">

                        {
                          goal.title
                        }

                      </h2>

                      <span className="rounded-full border px-4 py-1">

                        {
                          goal.goal_status ||
                          "Not Started"
                        }

                      </span>

                    </div>

                    <p className="mt-3 text-gray-600">

                      {
                        goal.thrust_area
                      }

                    </p>

                    <p className="mt-1">

                      Target:

                      {" "}

                      {
                        goal.target_value
                      }

                    </p>

                    <p>

                      Progress:

                      {" "}

                      {
                        goal.progress ||
                        0
                      }
                      %

                    </p>

                  </div>

                  <div className="flex gap-3">

                    <input
                      type="number"
                      value={
                        goal.actual_achievement ||
                        ""
                      }
                      disabled={
                        goal.quarter_locked
                      }
                      placeholder="Actual"

                      onChange={(
                        e
                      ) => {
                        goal.actual_achievement =
                          Number(
                            e
                              .target
                              .value
                          );

                        setGoals(
                          [
                            ...goals,
                          ]
                        );
                      }}

                      className="rounded-xl border p-3"
                    />

                    <select
                      value={
                        goal.goal_status ||
                        "Not Started"
                      }

                      disabled={
                        goal.quarter_locked
                      }

                      onChange={(
                        e
                      ) => {
                        goal.goal_status =
                          e
                            .target
                            .value;

                        setGoals(
                          [
                            ...goals,
                          ]
                        );
                      }}

                      className="rounded-xl border p-3"
                    >

                      <option>
                        Not Started
                      </option>

                      <option>
                        On Track
                      </option>

                      <option>
                        Completed
                      </option>

                    </select>

                    <button
                      onClick={() =>
                        save(
                          goal
                        )
                      }

                      disabled={
                        goal.quarter_locked
                      }

                      className="rounded-xl bg-blue-600 px-5 text-white"
                    >
                      Submit
                    </button>

                  </div>

                </div>

                {/* Progress */}

                <div className="mt-6">

                  <div className="h-3 rounded bg-slate-200">

                    <div
                      style={{
                        width: `${
                          goal.progress ||
                          0
                        }%`,
                      }}
                      className="h-3 rounded bg-blue-600"
                    />

                  </div>

                </div>

                <div className="mt-4 grid grid-cols-3 text-sm text-gray-500">

                  <div>

                    Actual:

                    {" "}

                    {
                      goal.actual_achievement ||
                      "-"
                    }

                  </div>

                  <div>

                    Updated:

                    {" "}

                    {goal.updated_at
                      ?.split(
                        "T"
                      )[0] ||
                      "-"}

                  </div>

                  <div>

                    Manager:

                    {" "}

                    {
                      goal.manager_comment ||
                      "No comment"
                    }

                  </div>

                </div>

              </div>
            )
          )}

        </div>

      </div>

    </div>
  );
}

function Card({
  title,
  value,
  sub,
}: any) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <p className="text-gray-500">
        {title}
      </p>

      <h2 className="mt-2 text-5xl font-bold">
        {value}
      </h2>

      <p className="mt-2 text-gray-500">
        {sub}
      </p>

    </div>
  );
}