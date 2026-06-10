import { createClient } from "@/lib/supabase/client";

export async function getAnalytics() {
  try {
    const supabase = createClient();

    // Goal Sheets
    const {
      data: sheets,
    } = await supabase
      .from("goal_sheets")
      .select("*");

    // Goals
    const {
      data: goals,
    } = await supabase
      .from("goals")
      .select("*");

    const totalSheets =
      sheets?.length || 0;

    const approved =
      sheets?.filter(
        (x) =>
          x.submission_status ===
          "approved"
      ).length || 0;

    const rejected =
      sheets?.filter(
        (x) =>
          x.submission_status ===
          "rejected"
      ).length || 0;

    const employeeRatings =
      sheets
        ?.filter(
          (x) =>
            x.employee_rating
        )
        .map(
          (x) =>
            x.employee_rating
        ) || [];

    const managerRatings =
      sheets
        ?.filter(
          (x) =>
            x.manager_rating
        )
        .map(
          (x) =>
            x.manager_rating
        ) || [];

    const progress =
      goals
        ?.filter(
          (x) =>
            x.progress !==
            null
        )
        .map(
          (x) =>
            x.progress
        ) || [];

    const avg = (
      arr: number[]
    ) =>
      arr.length
        ? (
            arr.reduce(
              (
                a,
                b
              ) =>
                a + b,
              0
            ) /
            arr.length
          ).toFixed(1)
        : "0";

    return {
      totalSheets,

      approved,

      rejected,

      averageEmployeeRating:
        avg(
          employeeRatings
        ),

      averageManagerRating:
        avg(
          managerRatings
        ),

      averageProgress:
        avg(progress),
    };
  } catch (err) {
    console.log(err);

    return null;
  }
}