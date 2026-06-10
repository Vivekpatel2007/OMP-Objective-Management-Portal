import { createClient } from "@/lib/supabase/client";

export async function getLeaderboard() {
  try {
    const supabase =
      createClient();

    // Profiles
    const {
      data: profiles,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select("*");

    // Goals
    const {
      data: goals,
    } =
      await supabase
        .from(
          "goals"
        )
        .select("*");

    if (
      !profiles ||
      !goals
    ) {
      return [];
    }

    const leaderboard =
      profiles
        .filter(
          (
            p: any
          ) =>
            p.role ===
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
                      total,
                      g
                    ) =>
                      total +
                      (
                        g.progress ||
                        0
                      ),
                    0
                  ) /
                  employeeGoals.length
                : 0;

            return {
              id:
                employee.id,

              name:
                employee.full_name ||
                "Employee",

              department:
                employee.department ||
                "-",

              progress:
                avgProgress,

              employeeRating:
                0,

              managerRating:
                0,

              score:
                Math.round(
                  avgProgress
                ),
            };
          }
        );

    leaderboard.sort(
      (
        a,
        b
      ) =>
        b.score -
        a.score
    );

    console.log(
      leaderboard
    );

    return leaderboard;
  } catch (
    err
  ) {
    console.log(
      err
    );

    return [];
  }
}