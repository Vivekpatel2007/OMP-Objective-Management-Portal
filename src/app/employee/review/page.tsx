"use client";

import { useEffect, useState } from "react";

import {
  getCurrentGoalSheet,
  submitSelfReview,
} from "@/services/reviewservice";

export default function EmployeeReviewPage() {
  const [loading, setLoading] =
    useState(true);

  const [goalSheet, setGoalSheet] =
    useState<any>(null);

  const [selfReview, setSelfReview] =
    useState("");

  const [
    employeeRating,
    setEmployeeRating,
  ] = useState(3);

  useEffect(() => {
    async function load() {
      const response =
        await getCurrentGoalSheet();

      console.log(response);

      if (response.data) {
        setGoalSheet(
          response.data
        );

        setSelfReview(
          response.data
            ?.self_review ||
            ""
        );

        setEmployeeRating(
          response.data
            ?.employee_rating ||
            3
        );
      }

      setLoading(false);
    }

    load();
  }, []);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const response =
      await submitSelfReview(
        selfReview,
        employeeRating
      );

    console.log(response);

    if (response.error) {
      alert(response.error);

      return;
    }

    alert(
      "Self review submitted"
    );

    window.location.reload();
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading review...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Self Appraisal
      </h1>

      <div className="mb-6 rounded border p-5">
        <p>
          Status:
          {" "}
          {
            goalSheet?.submission_status
          }
        </p>
      </div>

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-5 rounded border p-5"
      >
        <div>
          <label className="mb-2 block">
            Self Review
          </label>

          <textarea
            rows={6}
            value={
              selfReview
            }
            onChange={(e) =>
              setSelfReview(
                e.target.value
              )
            }
            className="w-full rounded border p-3"
            placeholder="Describe achievements and challenges..."
          />
        </div>

        <div>
          <label className="mb-2 block">
            Self Rating
          </label>

          <select
            value={
              employeeRating
            }
            onChange={(e) =>
              setEmployeeRating(
                Number(
                  e.target.value
                )
              )
            }
            className="w-full rounded border p-3"
          >
            <option value={1}>
              1
            </option>

            <option value={2}>
              2
            </option>

            <option value={3}>
              3
            </option>

            <option value={4}>
              4
            </option>

            <option value={5}>
              5
            </option>
          </select>
        </div>

        <button
          className="rounded bg-black px-5 py-2 text-white"
        >
          Submit Review
        </button>
      </form>
    </div>
  );
}