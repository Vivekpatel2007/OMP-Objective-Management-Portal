"use client";

import { use } from "react";

import { useEffect, useState } from "react";

import {
  getGoalSheetDetails,
  approveGoalSheet,
  rejectGoalSheet,
} from "@/services/managerservice";
import Link from "next/link";
export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params
  const { id } = use(params);

  const [data, setData] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  // Fetch details
  useEffect(() => {
    async function fetchDetails() {
      const response =
        await getGoalSheetDetails(id);

      console.log(response);

      setData(response);

      setLoading(false);
    }

    fetchDetails();
  }, [id]);

  // Approve
  async function handleApprove() {
    const response =
      await approveGoalSheet(id);

    console.log(response);

    if (response.error) {
      alert(response.error);
      return;
    }

    alert("Goal Sheet Approved");

    window.location.reload();
  }

  // Reject
  async function handleReject() {
    const response =
      await rejectGoalSheet(id);

    console.log(response);

    if (response.error) {
      alert(response.error);
      return;
    }

    alert("Goal Sheet Rejected");

    window.location.reload();
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading goal sheet...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Employee Info */}
      <div className="mb-8 rounded-lg border p-5 shadow">
        <h1 className="mb-4 text-3xl font-bold">
          Employee Goal Sheet
        </h1>

        <p>
          <strong>Name:</strong>{" "}
          {data?.profile?.full_name}
        </p>

        <p>
          <strong>Employee ID:</strong>{" "}
          {data?.profile?.employee_id}
        </p>

        <p>
          <strong>Department:</strong>{" "}
          {data?.profile?.department}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {data?.goalSheet?.submission_status}
        </p>
      </div>
    <div className="mt-4">
  {data?.goalSheet?.submission_status ===
    "approved" && (
    <div className="inline-block rounded bg-green-100 px-4 py-2 text-green-700">
      Goal Sheet Approved
    </div>
  )}

  {data?.goalSheet?.submission_status ===
    "rejected" && (
    <div className="inline-block rounded bg-red-100 px-4 py-2 text-red-700">
      Goal Sheet Rejected
    </div>
  )}

  {data?.goalSheet?.submission_status ===
    "submitted" && (
    <div className="inline-block rounded bg-blue-100 px-4 py-2 text-blue-700">
      Awaiting Review
    </div>
  )}
</div>
      {/* Goals */}
      <div className="space-y-5">
        {data?.goals?.map((goal: any) => (
          <div
            key={goal.id}
            className="rounded-lg border p-5 shadow"
          >
            <h2 className="mb-3 text-xl font-semibold">
              {goal.title}
            </h2>

            <p className="mb-4 text-gray-600">
              {goal.description}
            </p>

            <div className="space-y-2 text-sm">
              <p>
                <strong>Thrust Area:</strong>{" "}
                {goal.thrust_area}
              </p>

              <p>
                <strong>UOM Type:</strong>{" "}
                {goal.uom_type}
              </p>

              <p>
                <strong>Target Value:</strong>{" "}
                {goal.target_value}
              </p>

              <p>
                <strong>Weightage:</strong>{" "}
                {goal.weightage}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
{data?.goalSheet?.submission_status ===
  "submitted" && (
  <div className="mt-8 flex gap-4">
    <button
      onClick={handleApprove}
      className="rounded bg-green-600 px-5 py-2 text-white"
    >
      Approve
    </button>

    <button
      onClick={handleReject}
      className="rounded bg-red-600 px-5 py-2 text-white"
    >
      Reject
    </button>
    <div className="mt-6">
  <Link
    href={`/manager/review/${id}`}
    className="rounded bg-black px-5 py-2 text-white"
  >
    Open Review
  </Link>
</div>
  </div>
  
)}
    </div>
  );
}