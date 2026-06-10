"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getEmployees,
} from "@/services/adminservice";

export default function EmployeesPage() {
  const [employees,
    setEmployees] =
    useState<any[]>(
      []
    );

  useEffect(() => {
    async function load() {
      const {
        data,
      } =
        await getEmployees();

      setEmployees(
        data || []
      );
    }

    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Employees
      </h1>

      <div className="space-y-4">

        {employees.map(
          (
            emp
          ) => (
            <div
              key={
                emp.id
              }
              className="rounded border p-4"
            >
              <h2>
                {
                  emp.full_name
                }
              </h2>

              <p>
                {
                  emp.department
                }
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}