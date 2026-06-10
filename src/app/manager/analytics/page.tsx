"use client";

import { useEffect, useState } from "react";

import { getAnalytics } from "@/services/analyticsservice";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      const response =
        await getAnalytics();

      console.log(
        "ANALYTICS:",
        response
      );

      setAnalytics(response);

      setLoading(false);
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Performance Analytics
        </h1>

        <p className="mt-2 text-gray-600">
          Overview of goal sheets,
          ratings and progress
        </p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

        <Card
          title="Total Goal Sheets"
          value={
            analytics?.totalSheets || 0
          }
        />

        <Card
          title="Approved"
          value={
            analytics?.approved || 0
          }
        />

        <Card
          title="Rejected"
          value={
            analytics?.rejected || 0
          }
        />

        <Card
          title="Avg Employee Rating"
          value={`${analytics?.averageEmployeeRating || 0}/5`}
        />

        <Card
          title="Avg Manager Rating"
          value={`${analytics?.averageManagerRating || 0}/5`}
        />

        <Card
          title="Avg Progress"
          value={`${analytics?.averageProgress || 0}%`}
        />
      </div>

      {/* Empty */}
      {!analytics && (
        <div className="mt-8 rounded border p-6 text-center text-gray-500">
          No analytics available.
        </div>
      )}
    </div>
  );
}

// Analytics Card

function Card({
  title,
  value,
}: {
  title: string;

  value: any;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className="mt-3 text-4xl font-bold">
        {value}
      </h2>
    </div>
  );
}