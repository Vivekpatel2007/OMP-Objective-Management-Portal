"use client";

import { useEffect, useState } from "react";

import { getLeaderboard } from "@/services/leaderboardservice";

export default function LeaderboardPage() {
  const [employees, setEmployees] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const response =
        await getLeaderboard();

      console.log(
        "LEADERBOARD DATA",
        response
      );

      setEmployees(
        response || []
      );

      setLoading(false);
    }

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        Loading leaderboard...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Performance Leaderboard
        </h1>

        <p className="mt-2 text-gray-600">
          Employee rankings based on
          performance
        </p>
      </div>

      {/* Empty */}

      {employees.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-gray-500">
          No leaderboard data available
        </div>
      ) : (
        <div className="space-y-5">

          {employees.map(
            (
              employee,
              index
            ) => (
              <div
                key={
                  employee.id ||
                  index
                }
                className="rounded-lg border p-6 shadow"
              >
                <div className="flex items-center justify-between">

                  {/* Left */}

                  <div>

                    <h2 className="text-2xl font-semibold">

                      {index === 0 &&
                        "🥇 "}

                      {index === 1 &&
                        "🥈 "}

                      {index === 2 &&
                        "🥉 "}

                      #
                      {index + 1}

                      {" · "}

                      {
                        employee.name
                      }

                    </h2>

                    <p className="mt-2 text-gray-500">
                      {
                        employee.department
                      }
                    </p>

                  </div>

                  {/* Score */}

                  <div className="text-right">

                    <div className="text-4xl font-bold">

                      {
                        employee.score
                      }

                    </div>

                    <p className="text-sm text-gray-500">
                      Performance Score
                    </p>

                  </div>
                </div>

                {/* Metrics */}

                <div className="mt-6 grid grid-cols-3 gap-4">

                  <MetricCard
                    title="Progress"
                    value={`${Math.round(
                      employee.progress
                    )}%`}
                  />

                  <MetricCard
                    title="Employee Rating"
                    value={`${employee.employeeRating}/5`}
                  />

                  <MetricCard
                    title="Manager Rating"
                    value={`${employee.managerRating}/5`}
                  />

                </div>
              </div>
            )
          )}

        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;

  value: string;
}) {
  return (
    <div className="rounded-lg bg-gray-100 p-4">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h3 className="mt-2 text-2xl font-bold">
        {value}
      </h3>

    </div>
  );
}