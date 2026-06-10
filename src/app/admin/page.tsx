"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getAdminDashboard,
} from "@/services/adminservice";

export default function AdminPage() {
  const [data,
    setData] =
    useState<any>(
      null
    );

  useEffect(() => {
    async function load() {
      const res =
        await getAdminDashboard();

      setData(res);
    }

    load();
  }, []);

  if (!data)
    return (
      <div className="p-6">
        Loading...
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="mb-8 text-3xl font-bold">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-5">

        <Card
          title="Employees"
          value={
            data.employees
          }
        />

        <Card
          title="Managers"
          value={
            data.managers
          }
        />

        <Card
          title="Goal Sheets"
          value={
            data.goalSheets
          }
        />

        <Card
          title="Active Cycle"
          value={
            data.activeCycle
              ?.name
          }
        />
      </div>
    </div>
  );
}

function Card({
  title,
  value,
}: any) {
  return (
    <div className="rounded border p-5">
      <p>{title}</p>

      <h2 className="mt-3 text-3xl font-bold">
        {value}
      </h2>
    </div>
  );
}