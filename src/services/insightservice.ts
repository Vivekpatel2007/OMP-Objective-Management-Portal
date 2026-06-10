import { createClient } from "@/lib/supabase/client";

export async function getInsights() {
  try {
    const supabase =
      createClient();

    const {
      data: profiles,
    } =
      await supabase
        .from("profiles")
        .select("*");

    const {
      data: goals,
    } =
      await supabase
        .from("goals")
        .select("*");

    if (
      !profiles ||
      !goals
    ) {
      return [];
    }

    const insights =
      profiles
        .filter(
          (u: any) =>
            u.role ===
            "employee"
        )
        .map(
          (
            employee: any
          ) => {
            const employeeGoals =
              goals.filter(
                (
                  g: any
                ) =>
                  g.employee_id ===
                  employee.id
              );

            const avgProgress =
              employeeGoals.length
                ? employeeGoals.reduce(
                    (
                      a,
                      b
                    ) =>
                      a +
                      (
                        b.progress ||
                        0
                      ),
                    0
                  ) /
                  employeeGoals.length
                : 0;

            let risk =
              "Low";

            let suggestion =
              "Continue";

            if (
              avgProgress <
              40
            ) {
              risk =
                "High";

              suggestion =
                "Break goals into milestones";
            }

            else if (
              avgProgress <
              70
            ) {
              risk =
                "Medium";

              suggestion =
                "Increase review frequency";
            }

            return {
              id:
                employee.id,

              employee:
                employee.full_name,

              department:
                employee.department,

              progress:
                Math.round(
                  avgProgress
                ),

              risk,

              suggestion,

              predictedRating:
                (
                  avgProgress /
                  20
                ).toFixed(
                  1
                ),
            };
          }
        );

    return insights;
  }

  catch (
    err
  ) {
    console.log(
      err
    );

    return [];
  }
}