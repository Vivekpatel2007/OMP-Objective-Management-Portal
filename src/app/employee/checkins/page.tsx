"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  LayoutDashboard,
  ListChecks,
  CalendarCheck,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lock,
  MessageSquare,
  Save,
} from "lucide-react";

// Real Services
import {
  getQuarterlyGoals,
  updateQuarterlyCheckin,
} from "@/services/checkinservice";
import { getCurrentUserProfile } from "@/services/sharedgoalservice";
import { getNotifications } from "@/services/notificationservice";

export default function EmployeeCheckinPage() {
  const [quarter, setQuarter] = useState("Q1");
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  
  // App Shell States
  const [mobile, setMobile] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [quarter]);

  async function loadData() {
    setLoading(true);
    try {
      const [response, user, notif] = await Promise.all([
        getQuarterlyGoals(quarter),
        getCurrentUserProfile(),
        getNotifications()
      ]);

      setGoals(response?.data || []);
      setProfile(user);
      setNotifications(notif?.data || []);
    } catch (error) {
      console.error("Failed to load check-in data", error);
    } finally {
      setLoading(false);
    }
  }

  async function save(goal: any) {
    setSavingId(goal.id);
    
    // The service expects the goal object with target_value, actual_achievement, goal_status
    const response = await updateQuarterlyCheckin(goal);

    if (response?.error) {
      alert("Failed to update check-in: " + response.error);
      setSavingId(null);
      return;
    }

    setMessage(`Check-in for "${goal.title}" saved successfully.`);
    setTimeout(() => setMessage(""), 4000); // Auto-hide message after 4s
    
    // Reload data to get the newly calculated progress from the backend
    await loadData();
    setSavingId(null);
  }

  // Handle local state updates before saving
  const handleGoalUpdate = (goalId: string, field: string, value: string | number) => {
    setGoals((prevGoals) =>
      prevGoals.map((g) => (g.id === goalId ? { ...g, [field]: value } : g))
    );
  };

  // Calculate Average Progress dynamically from the fetched goals
  const avgProgress = goals.length
    ? Math.round(
        goals.reduce((total, g) => total + (Number(g.progress) || 0), 0) / goals.length
      )
    : 0;

  if (loading && !profile) {
    return (
      <div className="h-screen bg-[#F8F9FC] flex items-center justify-center text-indigo-600">
        <div className="flex flex-col items-center gap-3">
          <Clock className="animate-spin" size={32} />
          <p className="font-medium">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FC] overflow-hidden">
      
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition-transform flex flex-col ${
          mobile ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-5">
          <h1 className="text-white font-bold text-xl tracking-tight">GoalTrack</h1>
        </div>

        <nav className="space-y-2 px-3 mt-4">
          <Nav icon={LayoutDashboard} label="Dashboard" href="/employee/dashboard" />
          <Nav icon={ListChecks} label="My Goal Sheet" href="/employee/goals" />
          <Nav active icon={CalendarCheck} label="Check-ins" href="/employee/checkins" />
          <Nav icon={BarChart3} label="Reports" href="/employee/report" />
          <Nav icon={Settings} label="Settings" href="/settings" />
        </nav>

        <div className="mt-auto p-5 flex gap-3 items-center border-t border-white/10">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white grid place-items-center font-semibold shrink-0">
            {profile?.full_name?.substring(0, 2).toUpperCase() || "EM"}
          </div>
          <div className="overflow-hidden">
            <div className="font-medium text-white truncate text-sm">{profile?.full_name}</div>
            <div className="text-xs text-white/50">{profile?.department || "Employee"}</div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white px-5 py-4 border-b flex justify-between items-center z-10 shrink-0">
          <div className="flex gap-3 items-center">
            <button className="md:hidden text-neutral-600" onClick={() => setMobile(!mobile)}>
              {mobile ? <X /> : <Menu />}
            </button>
            <div className="font-semibold text-neutral-800">Check-in Workspace</div>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/notifications" className="relative text-neutral-500 hover:text-indigo-600 transition">
              <Bell size={20} />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
              )}
            </Link>
            <div className="text-sm font-medium text-neutral-700 hidden sm:block">
              {profile?.full_name}
            </div>
          </div>
        </header>

        {/* PAGE BODY */}
        <main className="p-5 md:p-8 overflow-auto flex-1 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Title & Quarter Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Quarterly Check-ins</h1>
                <p className="mt-1 text-neutral-500 text-sm">Update actual achievements and track status for your goals.</p>
              </div>

              <div className="flex bg-white rounded-xl p-1 shadow-sm border border-neutral-200 w-full md:w-auto">
                {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuarter(q)}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
                      quarter === q
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Toast */}
            {message && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 shadow-sm">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <p className="font-medium text-sm">{message}</p>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <StatCard title="Active Quarter" value={quarter} sub="Selected period" icon={Clock} />
              <StatCard title="Total Goals" value={goals.length} sub={`Assigned in ${quarter}`} icon={Target} />
              <StatCard title="Avg. Progress" value={`${avgProgress}%`} sub="Auto computed" icon={TrendingUp} />
            </div>

            {/* Goals List */}
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12 text-neutral-400 font-medium">Loading goals...</div>
              ) : goals.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-12 text-center flex flex-col items-center shadow-sm">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                    <ListChecks className="text-neutral-400" size={28} />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">No goals found for {quarter}</h3>
                  <p className="text-neutral-500 mt-1 text-sm max-w-sm">
                    There are no goals assigned to you for this specific quarter yet. Try checking another quarter or create a new goal in your goal sheet.
                  </p>
                </div>
              ) : (
                goals.map((goal) => {
                  const isLocked = goal.locked || false; // Using generic lock safety check
                  const progressValue = Number(goal.progress) || 0;

                  return (
                    <div key={goal.id} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200/60 transition-all hover:shadow-md">
                      
                      {/* Goal Header */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-neutral-900 leading-tight">{goal.title}</h2>
                            {isLocked && (
                              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-1 rounded-md">
                                <Lock size={12} /> Locked
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500">{goal.thrust_area || "General Focus Area"}</p>
                        </div>
                        
                        <div className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(goal.goal_status)}`}>
                          {goal.goal_status || "Not Started"}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold text-neutral-700">Progress</span>
                          <span className="font-bold text-indigo-600">{progressValue}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            style={{ width: `${progressValue}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressValue >= 100 ? "bg-emerald-500" : progressValue < 40 ? "bg-amber-500" : "bg-indigo-600"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Grid Info & Inputs */}
                      <div className="grid lg:grid-cols-2 gap-6 bg-neutral-50/50 p-5 rounded-xl border border-neutral-100">
                        
                        {/* Left: Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-neutral-500 mb-1 font-medium text-xs uppercase tracking-wider">Target Value</div>
                            <div className="font-semibold text-neutral-900 text-lg">
                              {goal.target_value} <span className="text-sm font-medium text-neutral-500">{goal.uom_type}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-neutral-500 mb-1 font-medium text-xs uppercase tracking-wider">Last Updated</div>
                            <div className="font-medium text-neutral-700 mt-1">
                              {goal.updated_at ? new Date(goal.updated_at).toLocaleDateString() : "Never"}
                            </div>
                          </div>
                          {goal.manager_comment && (
                            <div className="col-span-2 mt-2 bg-white p-3 rounded-lg border border-indigo-100 flex items-start gap-3 shadow-sm">
                              <MessageSquare size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                              <div>
                                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 mb-1">Manager Feedback</div>
                                <div className="text-neutral-600 text-sm italic leading-relaxed">{goal.manager_comment}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: Update Form */}
                        <div className="flex flex-col justify-end gap-3 border-t lg:border-t-0 lg:border-l border-neutral-200 pt-4 lg:pt-0 lg:pl-6">
                          <div className="text-sm font-semibold text-neutral-900 mb-1">Log Check-in Update</div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={goal.actual_achievement || ""}
                              disabled={isLocked}
                              placeholder="Actual achieved..."
                              onChange={(e) => handleGoalUpdate(goal.id, "actual_achievement", Number(e.target.value))}
                              className="flex-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-400 transition-shadow"
                            />
                            <select
                              value={goal.goal_status || "Not Started"}
                              disabled={isLocked}
                              onChange={(e) => handleGoalUpdate(goal.id, "goal_status", e.target.value)}
                              className="flex-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white disabled:bg-neutral-100 disabled:text-neutral-400 transition-shadow"
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="On Track">On Track</option>
                              <option value="Off Track">Off Track</option>
                              <option value="At Risk">At Risk</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                          <button
                            onClick={() => save(goal)}
                            disabled={isLocked || savingId === goal.id}
                            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:bg-indigo-300 w-full lg:w-auto lg:self-end shadow-sm"
                          >
                            {savingId === goal.id ? (
                              <Clock className="animate-spin" size={16} />
                            ) : (
                              <Save size={16} />
                            )}
                            {savingId === goal.id ? "Saving..." : "Save Update"}
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
          </div>
        </main>
      </div>

      {/* Global CSS for scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E5E7EB; border-radius: 20px; }
      `}} />
    </div>
  );
}

/* Helper Components & Functions */

function StatCard({ title, value, sub, icon: Icon }: any) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-200/60 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">{title}</p>
        <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">{value}</h2>
        <p className="mt-1 text-xs text-neutral-400 font-medium">{sub}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
        <Icon size={20} />
      </div>
    </div>
  );
}

function Nav({ icon: Icon, label, href, active }: any) {
  return (
    <Link
      href={href}
      className={`flex gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "On Track":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Off Track":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "At Risk":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-neutral-50 text-neutral-600 border-neutral-200";
  }
}