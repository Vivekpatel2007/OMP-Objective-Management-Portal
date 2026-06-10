"use client";

import { use } from "react";

import { useEffect, useState } from "react";

import {
  submitManagerReview,
} from "@/services/reviewservice";

import {
  getGoalSheetDetails,
} from "@/services/managerservice";

export default function ManagerReviewPage({
  params,
}: {
  params: Promise<{
    sheetId: string;
  }>;
}) {
  const { sheetId } =
    use(params);

  const [loading, setLoading] =
    useState(true);

  const [data, setData] =
    useState<any>(null);

  const [
    managerReview,
    setManagerReview,
  ] = useState("");

  const [
    managerRating,
    setManagerRating,
  ] = useState(3);

  useEffect(() => {
    async function load() {
      const response =
        await getGoalSheetDetails(
          sheetId
        );

      console.log(response);

      setData(response);

      setManagerReview(
        response.goalSheet
          ?.manager_review ||
          ""
      );

      setManagerRating(
        response.goalSheet
          ?.manager_rating ||
          3
      );

      setLoading(false);
    }

    load();
  }, [sheetId]);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const response =
      await submitManagerReview(
        sheetId,
        managerReview,
        managerRating
      );

    console.log(response);

    if (response.error) {
      alert(response.error);

      return;
    }

    alert(
      "Manager review submitted"
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
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Manager Review
      </h1>

      {/* Employee */}
      <div className="mb-6 rounded border p-5">
        <p>
          <strong>
            Employee:
          </strong>{" "}
          {
            data.profile
              ?.full_name
          }
        </p>

        <p>
          <strong>
            Employee Rating:
          </strong>{" "}
          {
            data.goalSheet
              ?.employee_rating
          }
          /5
        </p>

        <p>
          <strong>
            Employee Review:
          </strong>
        </p>

        <p className="mt-2 text-gray-600">
          {
            data.goalSheet
              ?.self_review
          }
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-5 rounded border p-5"
      >
        <div>
          <label className="mb-2 block">
            Manager Review
          </label>

          <textarea
            rows={6}
            value={
              managerReview
            }
            onChange={(e) =>
              setManagerReview(
                e.target.value
              )
            }
            className="w-full rounded border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block">
            Final Rating
          </label>

          <select
            value={
              managerRating
            }
            onChange={(e) =>
              setManagerRating(
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
          className="rounded bg-green-600 px-5 py-2 text-white"
        >
          Submit Review
        </button>
      </form>
    </div>
  );
}