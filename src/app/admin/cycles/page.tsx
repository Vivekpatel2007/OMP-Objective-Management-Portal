"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getCycles,
  activateCycle,
} from "@/services/adminservice";

export default function CyclesPage() {
  const [cycles,
    setCycles] =
    useState<any[]>(
      []
    );

  async function load() {
    const {
      data,
    } =
      await getCycles();

    setCycles(
      data || []
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function activate(
    id: string
  ) {
    await activateCycle(
      id
    );

    load();
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Goal Cycles
      </h1>

      <div className="space-y-4">

        {cycles.map(
          (
            cycle
          ) => (
            <div
              key={
                cycle.id
              }
              className="rounded border p-5"
            >
              <h2>
                {
                  cycle.name
                }
              </h2>

              <p>
                {
                  cycle.status
                }
              </p>

              <button
                onClick={() =>
                  activate(
                    cycle.id
                  )
                }
                className="mt-3 rounded bg-black px-4 py-2 text-white"
              >
                Activate
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}