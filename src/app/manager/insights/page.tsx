"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getInsights,
} from "@/services/insightservice";

export default function InsightsPage() {
  const [
    insights,
    setInsights,
  ] =
    useState<any[]>(
      []
    );

  const [loading,
    setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      const result =
        await getInsights();

      setInsights(
        result
      );

      setLoading(
        false
      );
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6">

      <h1 className="mb-8 text-3xl font-bold">
        AI Performance Insights
      </h1>

      {insights.length ===
      0 ? (
        <div className="rounded border p-6">
          No insights
        </div>
      ) : (
        <div className="space-y-5">

          {insights.map(
            (
              item
            ) => (
              <div
                key={
                  item.id
                }
                className="rounded border p-5 shadow"
              >
                <h2 className="text-2xl font-bold">

                  {
                    item.employee
                  }

                </h2>

                <p>
                  Department:
                  {" "}
                  {
                    item.department
                  }
                </p>

                <p>
                  Progress:
                  {" "}
                  {
                    item.progress
                  }
                  %
                </p>

                <p>
                  Risk:
                  {" "}
                  {
                    item.risk
                  }
                </p>

                <p>
                  Predicted Rating:
                  {" "}
                  {
                    item.predictedRating
                  }
                  /5
                </p>

                <div className="mt-4 rounded bg-gray-100 p-4">

                  <strong>
                    Recommendation
                  </strong>

                  <p className="mt-2">

                    {
                      item.suggestion
                    }

                  </p>

                </div>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}