"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import {
  getSubmittedGoalSheets,
} from "@/services/managerservice";

export default function ManagerDashboardPage() {
  const [goalSheets, setGoalSheets] = useState<any[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  // Fetch submissions
  useEffect(() => {
    async function fetchSubmissions() {
      const response =
        await getSubmittedGoalSheets();

      console.log(response);

      if (response.data) {
        setGoalSheets(response.data);
      }

      setLoading(false);
    }

    fetchSubmissions();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        Loading submissions...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Manager Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Review submitted employee goal sheets
        </p>
      </div>

      {/* Empty State */}
      {goalSheets.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-gray-500">
          No submitted goal sheets.
        </div>
      ) : (
        <div className="space-y-5">
          {goalSheets.map((sheet) => (
            <Link
              key={sheet.id}
              href={`/manager/submissions/${sheet.id}`}
            >
              <div className="cursor-pointer rounded-lg border p-5 shadow transition hover:bg-gray-50">
                {/* Employee Info */}
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">
                    {sheet.profile?.full_name}
                  </h2>

                  <p className="text-sm text-gray-600">
                    Employee ID:{" "}
                    {sheet.profile?.employee_id}
                  </p>

                  <p className="text-sm text-gray-600">
                    Department:{" "}
                    {sheet.profile?.department}
                  </p>

                  <p className="mt-3 inline-block rounded bg-blue-100 px-3 py-1 text-sm text-blue-600 capitalize">
                    {sheet.submission_status}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-gray-500">
                    Click to review goals
                  </p>

                  <span className="text-sm font-medium text-black">
                    View Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}