"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  createSharedGoal,
  getEmployees,
  getCurrentUserProfile,
  getSharedGoals,
} from "@/services/sharedgoalservice";

export default function SharedGoalsPage() {
  const [profile, setProfile] =
    useState<any>(null);

  const [employees, setEmployees] =
    useState<any[]>([]);

  const [selected, setSelected] =
    useState<any[]>([]);

  const [sharedGoals, setSharedGoals] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [goal, setGoal] =
    useState({

      title: "",

      description: "",

      target: "",

      uom: "min",

      weightage: 10,

      type:
        "department",

      department:
        "",

    });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(
      true
    );

    const user =
      await getCurrentUserProfile();

    setProfile(
      user
    );

    const emp =
      await getEmployees();

    setEmployees(
      emp.data ||
        []
    );

    const existing =
      await getSharedGoals();

    setSharedGoals(
      existing.data ||
        []
    );

    if (
      user?.role ===
      "manager"
    ) {
      setGoal(
        (
          prev
        ) => ({
          ...prev,

          department:
            user.department,

          type:
            "department",

        })
      );
    }

    setLoading(
      false
    );
  }

  function toggleEmployee(
    emp: any
  ) {
    const exists =
      selected.some(
        (
          s
        ) =>
          s.id ===
          emp.id
      );

    if (
      exists
    ) {
      setSelected(

        selected.filter(
          (
            s
          ) =>
            s.id !==
            emp.id
        )

      );

      return;
    }

    setSelected([
      ...selected,
      emp,
    ]);
  }

  async function create() {
    if (
      !goal.title
    ) {
      alert(
        "Goal title required"
      );

      return;
    }

    const response =
      await createSharedGoal({

        ...goal,

        employees:
          selected,

      });

    if (
      response.error
    ) {
      alert(
        response.error
      );

      return;
    }

    alert(
      "Shared Goal Created"
    );

    load();

    setSelected(
      []
    );

    setGoal({

      title: "",

      description: "",

      target: "",

      uom: "min",

      weightage: 10,

      type:
        profile?.role ===
        "manager"

          ?

          "department"

          :

          "all",

      department:
        profile?.department ||
        "",

    });
  }

  if (
    loading
  ) {
    return (
      <div className="p-10">

        Loading...

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">

      <div className="flex">

        {/* LEFT */}

        <div className="flex-1 p-10">

          <div className="mb-8 flex justify-between">

            <div>

              <p className="font-semibold text-blue-600">

                MANAGER CONSOLE

              </p>

              <h1 className="text-5xl font-bold">

                Shared Goals

              </h1>

              <p className="mt-2 text-gray-500">

                Assign KPIs to employees

              </p>

            </div>

            <Link
              href="/manager/dashboard"
              className="rounded-xl border bg-white px-6 py-3"
            >
              Back
            </Link>

          </div>

          <div className="rounded-3xl bg-white p-8 shadow">

            <input
              placeholder="Goal Title"
              value={
                goal.title
              }
              onChange={(e)=>
                setGoal({

                  ...goal,

                  title:
                    e.target
                      .value,

                })
              }
              className="mb-5 w-full rounded-xl border p-4"
            />

            <textarea
              placeholder="Description"
              value={
                goal.description
              }
              onChange={(e)=>
                setGoal({

                  ...goal,

                  description:
                    e.target
                      .value,

                })
              }
              className="mb-5 w-full rounded-xl border p-4"
            />

            <div className="grid grid-cols-3 gap-5">

              <input
                type="number"
                placeholder="Target"
                value={
                  goal.target
                }
                onChange={(e)=>
                  setGoal({

                    ...goal,

                    target:
                      e.target
                        .value,

                  })
                }
                className="rounded-xl border p-4"
              />

              <input
                type="number"
                placeholder="Weightage"
                value={
                  goal.weightage
                }
                onChange={(e)=>
                  setGoal({

                    ...goal,

                    weightage:
                      Number(
                        e.target
                          .value
                      ),

                  })
                }
                className="rounded-xl border p-4"
              />

              <select
                value={
                  goal.uom
                }
                onChange={(e)=>
                  setGoal({

                    ...goal,

                    uom:
                      e.target
                        .value,

                  })
                }
                className="rounded-xl border p-4"
              >

                <option>
                  min
                </option>

                <option>
                  max
                </option>

                <option>
                  zero
                </option>

              </select>

            </div>

            <div className="mt-8">

              <h2 className="mb-4 text-2xl font-bold">

                Assign To

              </h2>

              <div className="flex gap-3">

                <button
                  onClick={()=>
                    setGoal({

                      ...goal,

                      type:
                        "department",

                    })
                  }
                  className={`rounded-full px-5 py-2 ${
                    goal.type ===
                    "department"

                      ?

                      "bg-blue-600 text-white"

                      :

                      "bg-gray-200"

                  }`}
                >

                  Entire Department

                </button>

                <button
                  onClick={()=>
                    setGoal({

                      ...goal,

                      type:
                        "employee",

                    })
                  }
                  className={`rounded-full px-5 py-2 ${
                    goal.type ===
                    "employee"

                      ?

                      "bg-blue-600 text-white"

                      :

                      "bg-gray-200"

                  }`}
                >

                  Specific Employees

                </button>

              </div>

              <div className="mt-5 rounded-xl bg-blue-50 p-5">

                Department:

                <strong>

                  {" "}

                  {
                    profile
                      ?.department
                  }

                </strong>

              </div>

              {goal.type ===
                "employee" && (

                <div className="mt-6 grid grid-cols-3 gap-3">

                  {employees.map(
                    (
                      emp
                    ) => {

                      const active =
                        selected.some(
                          (
                            s
                          ) =>
                            s.id ===
                            emp.id
                        );

                      return (

                        <button
                          key={
                            emp.id
                          }

                          onClick={()=>
                            toggleEmployee(
                              emp
                            )
                          }

                          className={`rounded-2xl border p-4 text-left ${
                            active

                              ?

                              "bg-blue-600 text-white"

                              :

                              "bg-white"

                          }`}
                        >

                          <h3 className="font-bold">

                            {
                              emp.full_name
                            }

                          </h3>

                          <p>

                            {
                              emp.employee_id
                            }

                          </p>

                        </button>

                      );

                    }
                  )}

                </div>

              )}

            </div>

            <button
              onClick={
                create
              }
              className="mt-8 rounded-2xl bg-blue-600 px-8 py-4 text-white"
            >

              Create Shared Goal

            </button>

          </div>

        </div>

        {/* RIGHT */}

        <div className="w-[420px] border-l bg-white p-8">

          <h2 className="text-3xl font-bold">

            Existing Shared Goals

          </h2>

          <p className="mb-6 text-gray-500">

            Already assigned KPIs

          </p>

          <div className="space-y-4">

            {sharedGoals.length ===
            0 ? (

              <div className="rounded-xl border p-5">

                No shared goals

              </div>

            ) : (

              sharedGoals.map(
                (
                  g
                ) => (

                  <div
                    key={
                      g.id
                    }

                    className="rounded-2xl border bg-slate-50 p-5"
                  >

                    <h3 className="font-bold">

                      {
                        g.title
                      }

                    </h3>

                    <p className="mt-2 text-gray-500">

                      {
                        g.description
                      }

                    </p>

                    <p className="mt-3">

                      Target:

                      {" "}

                      {
                        g.target_value
                      }

                    </p>

                    <p>

                      Assignment:

                      {" "}

                      {
                        g.assignment_type
                      }

                    </p>

                    <p>

                      Created:

                      {" "}

                      {
                        g.created_at
                          ?.split(
                            "T"
                          )[0]
                      }

                    </p>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </div>

    </div>
  );
}