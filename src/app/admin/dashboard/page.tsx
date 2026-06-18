"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Added for routing after logout
import {
  BarChart3,
  Bell,
  CalendarClock,
  Clock, // Re-added Clock to fix ReferenceError
  LayoutDashboard,
  LogOut, // Added for logout button
  Menu,
  Plus,
  RefreshCw,
  ScrollText,
  Settings2,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  UserCog,
  Users,
  X,
} from "lucide-react";

// Import actual services
import { getCurrentUserProfile } from "@/services/sharedgoalservice";
import {
  getAdminDashboard,
  getCycles,
  activateCycle,
  getEmployees,
} from "@/services/adminservice";
import { getAdminReportData } from "@/services/reportservice";
import { createClient } from "@/lib/supabase/client"; // Added to handle sign out

// Helper for UI styling
const getInitials = (name: string) => {
  if (!name) return "AD";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mobile, setMobile] = useState(false);

  // Data States
  const [dashboardStats, setDashboardStats] = useState<any>({
    employees: 0,
    activeCycle: null,
  });
  const [cycles, setCycles] = useState<any[]>([]);
  const [employeeList, setEmployeeList] = useState<any[]>([]);

  // Calculated Metrics
  const [orgCompletion, setOrgCompletion] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [goalAdoption, setGoalAdoption] = useState(0);
  const [deptProgress, setDeptProgress] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [userRes, adminRes, cyclesRes, reportRes, employeesRes] =
        await Promise.all([
          getCurrentUserProfile(),
          getAdminDashboard(),
          getCycles(),
          getAdminReportData(),
          getEmployees(),
        ]);

      if (userRes) setProfile(userRes);
      if (adminRes) setDashboardStats(adminRes);
      if (cyclesRes?.data) {
        // Sort cycles so the active one is at the top of the table
        const sortedCycles = cyclesRes.data.sort(
          (a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0),
        );
        setCycles(sortedCycles);
      }
      if (employeesRes?.data) setEmployeeList(employeesRes.data);

      // --- Crunch Report Data for Metrics ---
      if (reportRes) {
        const employees = reportRes.employees || [];
        const sheets = reportRes.sheets || [];
        const goals = reportRes.goals || [];

        // 1. Pending Approvals
        const pending = sheets.filter(
          (s: any) => s.submission_status === "submitted",
        ).length;
        setPendingApprovals(pending);

        // 2. Goal Adoption (Employees with goal sheets / Total Employees)
        const totalEligibleEmployees = employees.filter(
          (e: any) => e.role !== "admin",
        ).length;
        const employeesWithSheets = new Set(
          sheets.map((s: any) => s.employee_id),
        ).size;
        const adoptionPercent =
          totalEligibleEmployees > 0
            ? Math.round((employeesWithSheets / totalEligibleEmployees) * 100)
            : 0;
        setGoalAdoption(adoptionPercent);

        // 3. Org Completion & Department Breakdown
        let totalProgress = 0;
        const deptMap: Record<
          string,
          {
            total: number;
            completed: number;
            onTrack: number;
            notStarted: number;
          }
        > = {};

        // Initialize departments
        employees.forEach((emp: any) => {
          if (emp.department && emp.role !== "admin") {
            if (!deptMap[emp.department]) {
              deptMap[emp.department] = {
                total: 0,
                completed: 0,
                onTrack: 0,
                notStarted: 0,
              };
            }
          }
        });

        // Tally goal progress
        goals.forEach((goal: any) => {
          totalProgress += goal.progress || 0;

          const sheet = sheets.find((s: any) => s.id === goal.goal_sheet_id);
          if (sheet) {
            const emp = employees.find((e: any) => e.id === sheet.employee_id);
            if (emp && emp.department && deptMap[emp.department]) {
              deptMap[emp.department].total += 1;
              if (goal.progress === 100) deptMap[emp.department].completed += 1;
              else if (goal.progress > 0) deptMap[emp.department].onTrack += 1;
              else deptMap[emp.department].notStarted += 1;
            }
          }
        });

        setOrgCompletion(
          goals.length > 0 ? Math.round(totalProgress / goals.length) : 0,
        );

        // Format for UI
        const deptArray = Object.keys(deptMap)
          .map((dept) => {
            const stats = deptMap[dept];
            return {
              name: dept,
              total: stats.total,
              completedPct:
                stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
              onTrackPct:
                stats.total > 0 ? (stats.onTrack / stats.total) * 100 : 0,
              notStartedPct:
                stats.total > 0 ? (stats.notStarted / stats.total) * 100 : 0,
            };
          })
          .filter((d) => d.total > 0);

        setDeptProgress(deptArray);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  // Quick Action: Handle Logout
  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login"); // Routes user back to login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7fb] text-slate-500">
        Loading Admin Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 flex w-full font-sans overflow-x-hidden">
      {/* SIDEBAR */}
      <aside
        className={`shrink-0 min-h-screen bg-[#111115] text-white p-6 flex-col gap-8 w-64 fixed md:sticky top-0 z-50 transition-transform duration-300 ease-in-out ${mobile ? "translate-x-0 flex" : "-translate-x-full md:translate-x-0 md:flex hidden"}`}
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-blue-600 text-white flex justify-center items-center">
            <Target className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide">OMP</span>
            <span className="text-white/50 text-[10px] uppercase tracking-wider">
              Admin Console
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 mt-4">
          <Link
            href="/admin/dashboard"
            className="rounded-lg bg-blue-600 text-white text-sm font-medium flex px-4 py-3 items-center gap-3 shadow-lg shadow-blue-600/20"
          >
            <LayoutDashboard className="size-4" /> Dashboard
          </Link>
          <Link
            href="/admin/cycles"
            className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"
          >
            <CalendarClock className="size-4" /> Goal Cycles
          </Link>
          <Link
            href="/admin/emp-management"
            className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"
          >
            <Users className="size-4" /> Employee Management
          </Link>
          <Link
            href="/admin/manager-management"
            className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"
          >
            <UserCog className="size-4" /> Manager Management
          </Link>
          <Link
            href="/admin/shared-goals"
            className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"
          >
            <Share2 className="size-4" /> Shared Goals
          </Link>
          <Link
            href="/admin/goal-sheets"
            className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"
          >
            <Share2 className="size-4" /> Goal Sheets
          </Link>
        </nav>

        {/* User Profile & Logout */}
        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={handleLogout}
            className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-rose-400 text-sm font-medium flex px-4 py-2 items-center gap-3 transition-colors w-full text-left"
          >
            <LogOut className="size-4" /> Sign Out
          </button>

          <div className="rounded-xl bg-[#1a1a21] border border-white/5 flex p-3 items-center gap-3">
            <div className="size-9 font-bold rounded-full bg-blue-600 text-white text-xs flex justify-center items-center">
              {profile?.full_name ? getInitials(profile.full_name) : "AD"}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="font-semibold text-sm text-white truncate">
                {profile?.full_name || "System Admin"}
              </span>
              <span className="text-slate-400 text-xs truncate capitalize">
                {profile?.role || "HR Admin"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobile(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex p-6 md:p-8 flex-col flex-1 gap-8 overflow-auto w-full max-w-7xl mx-auto">
        <header className="flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setMobile(!mobile)}
              className="md:hidden p-2 -ml-2 text-slate-500"
            >
              {mobile ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
            <div className="flex flex-col gap-1">
              <h1 className="font-bold text-2xl text-slate-900 font-serif">
                Admin Dashboard
              </h1>
              <p className="text-slate-500 text-sm hidden md:block">
                Welcome back, {profile?.full_name || "System Admin"}. Here is
                your organization overview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative inline-flex size-10 shadow-sm rounded-full bg-white text-slate-600 border border-slate-200 justify-center items-center hover:bg-slate-50 transition-colors">
              <Bell className="size-4" />
              <span className="size-2 bg-red-500 rounded-full absolute right-0 top-0 border-2 border-white" />
            </button>
            <div className="size-10 font-bold rounded-full bg-blue-600 text-white text-xs flex justify-center items-center shadow-sm">
              {profile?.full_name ? getInitials(profile.full_name) : "AD"}
            </div>
          </div>
        </header>

        {/* METRICS ROW */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          <div className="rounded-xl bg-white shadow-sm border border-slate-200 flex p-5 flex-col gap-3 justify-between">
            <div className="flex justify-between items-start gap-1">
              <span className="text-slate-500 font-bold text-xs tracking-wider uppercase">
                Total Employees
              </span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Users className="size-4" />
              </div>
            </div>
            <div className="font-bold text-3xl font-serif text-slate-900">
              {dashboardStats.employees}
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-slate-200 flex p-5 flex-col gap-3 justify-between">
            <div className="flex justify-between items-start gap-1">
              <span className="text-slate-500 font-bold text-xs tracking-wider uppercase">
                Active Cycle
              </span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <CalendarClock className="size-4" />
              </div>
            </div>
            <div
              className="font-bold text-lg text-slate-900 line-clamp-1 mt-1"
              title={dashboardStats.activeCycle?.cycle_name}
            >
              {dashboardStats.activeCycle?.cycle_name || "None"}
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-slate-200 flex p-5 flex-col gap-3 justify-between">
            <div className="flex justify-between items-start gap-1">
              <span className="text-slate-500 font-bold text-xs tracking-wider uppercase">
                Org Completion
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="text-emerald-600 font-bold text-3xl font-serif">
              {orgCompletion}%
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-slate-200 flex p-5 flex-col gap-3 justify-between">
            <div className="flex justify-between items-start gap-1">
              <span className="text-slate-500 font-bold text-xs tracking-wider uppercase">
                Pending Approvals
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="text-amber-500 font-bold text-3xl font-serif">
              {pendingApprovals}
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-slate-200 flex p-5 flex-col gap-3 justify-between">
            <div className="flex justify-between items-start gap-1">
              <span className="text-slate-500 font-bold text-xs tracking-wider uppercase">
                Goal Adoption
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles className="size-4" />
              </div>
            </div>
            <div className="text-indigo-600 font-bold text-3xl font-serif">
              {goalAdoption}%
            </div>
          </div>
        </section>

        {/* MAIN DASHBOARD WIDGETS */}
        <section className="flex flex-col xl:flex-row gap-8">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-8 flex-1 min-w-0">
            {/* Goal Cycle Management Table */}
            <div className="rounded-xl bg-white shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex flex-col">
                  <h2 className="font-bold text-lg text-slate-900">
                    Goal Cycle Management
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Manage organization goal cycles
                  </p>
                </div>
                <Link
                  href="/admin/cycles"
                  className="inline-flex font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm px-4 py-2 items-center gap-2 shadow-sm"
                >
                  <Plus className="size-4" /> Config Cycle
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead className="bg-slate-50/80">
                    <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Cycle Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cycles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          No cycles found.
                        </td>
                      </tr>
                    ) : (
                      cycles.map((cycle) => (
                        <tr
                          key={cycle.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900 text-sm">
                            {cycle.cycle_name || "Untitled Cycle"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {cycle.status === "active" ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-50 text-slate-500 border-slate-200 capitalize">
                                {cycle.status || "Inactive"}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Link
                              href="/admin/cycle-configurations"
                              className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                            >
                              View Config
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Organization Completion Progress Bars */}
            <div className="rounded-xl bg-white shadow-sm border border-slate-200 flex flex-col p-6 gap-6">
              <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-100 pb-4">
                <div className="flex flex-col">
                  <h2 className="font-bold text-lg text-slate-900">
                    Organization Completion Dashboard
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Goal status aggregated by department
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 bg-slate-200 rounded-full" /> Not
                    Started
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 bg-amber-400 rounded-full" /> In
                    Progress
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 bg-emerald-500 rounded-full" />{" "}
                    Completed
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {deptProgress.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">
                    No active departmental goal data available.
                  </p>
                ) : (
                  deptProgress.map((dept, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span
                        className="text-slate-800 font-semibold text-sm w-32 truncate shrink-0"
                        title={dept.name}
                      >
                        {dept.name}
                      </span>
                      <div className="rounded-full flex flex-1 h-3 overflow-hidden bg-slate-100 shadow-inner">
                        <div
                          style={{ width: `${dept.notStartedPct}%` }}
                          className="bg-slate-200 h-full transition-all duration-500"
                          title={`Not Started: ${Math.round(dept.notStartedPct)}%`}
                        />
                        <div
                          style={{ width: `${dept.onTrackPct}%` }}
                          className="bg-amber-400 h-full transition-all duration-500"
                          title={`In Progress: ${Math.round(dept.onTrackPct)}%`}
                        />
                        <div
                          style={{ width: `${dept.completedPct}%` }}
                          className="bg-emerald-500 h-full transition-all duration-500"
                          title={`Completed: ${Math.round(dept.completedPct)}%`}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-8 xl:w-80 shrink-0">
            {/* Quick Admin Actions */}
            <div className="rounded-xl bg-white shadow-sm border border-slate-200 flex flex-col p-6 gap-5 h-fit">
              <h2 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
                Quick Actions
              </h2>

              <div className="flex flex-col gap-3">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Assign Shared Goal
                </label>
                <Link
                  href="/admin/shared-goals"
                  className="inline-flex font-semibold hover:bg-blue-700 transition-colors rounded-lg bg-blue-600 text-white text-sm px-4 py-2.5 justify-center items-center gap-2 w-full shadow-sm"
                >
                  <Share2 className="size-4" /> Create Assignment
                </Link>
                <p className="text-xs text-slate-500 mt-1 text-center">
                  Distribute unified goals to departments or individuals.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
