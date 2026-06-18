"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import {
  LayoutDashboard,
  ListChecks,
  CalendarCheck,
  BarChart2,
  Bell,
  Target,
  TrendingUp,
  Menu,
  X,
  Send,
  FileText,
  PieChart,
  Clock,
  LogOut,
  Plus
} from "lucide-react";

import { getGoals, submitGoalSheet } from "@/services/goalservice";
import { getEmployeeSharedGoals, getCurrentUserProfile } from "@/services/sharedgoalservice";
import { getNotifications } from "@/services/notificationservice";
import { getOrCreateGoalSheet } from "@/services/goal-sheetservice"; // Imported to handle creation

// Assuming you have shadcn UI select components. If not, use standard <select> tags.
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Goal {
  id: string | number;
  title: string;
  weightage: number | string;
  target_value: number | string;
  progress: number | string;
  quarter?: string; // Added to handle quarter filtering
}

const COLORS = ["#5B4EFF", "#10B981", "#F59E0B", "#3B82F6", "#EC4899"];

function Progress({ value, color }: { value: number; color: string }) {
  return (
    <div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-xs text-slate-400 mt-1 font-medium">{value}%</div>
    </div>
  );
}

function Stat({ title, value, icon: Icon }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="text-slate-400 text-sm font-medium">{title}</div>
        <Icon size={18} className="text-indigo-500" />
      </div>
      <div className="mt-4 text-3xl font-bold text-slate-800 capitalize">
        {value}
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sharedGoals, setSharedGoals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mobile, setMobile] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("Loading Phase...");
  
  // New States for filtering and sheet management
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");
  const [hasGoalSheet, setHasGoalSheet] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    progress: 0,
    weight: 0,
    status: "draft",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const supabase = createClient();

      // Fetch dynamic active phase from database
      const fetchPhase = async () => {
        const { data: activeCycle } = await supabase
          .from("goal_cycles")
          .select("*")
          .eq("is_active", true)
          .maybeSingle();

        let activePhaseName = "Off-cycle";
        let defaultQuarter = "Q1";

        if (activeCycle) {
          const now = new Date();
          const isWithin = (start?: string, end?: string) => {
            if (!start || !end) return false;
            return now >= new Date(start) && now <= new Date(end);
          };

          if (isWithin(activeCycle.goal_setting_start, activeCycle.goal_setting_end)) activePhaseName = "Goal Setting Phase";
          else if (isWithin(activeCycle.q1_start, activeCycle.q1_end)) { activePhaseName = "Q1 Active"; defaultQuarter = "Q1"; }
          else if (isWithin(activeCycle.q2_start, activeCycle.q2_end)) { activePhaseName = "Q2 Active"; defaultQuarter = "Q2"; }
          else if (isWithin(activeCycle.q3_start, activeCycle.q3_end)) { activePhaseName = "Q3 Active"; defaultQuarter = "Q3"; }
          else if (isWithin(activeCycle.q4_start, activeCycle.q4_end)) { activePhaseName = "Q4 Active"; defaultQuarter = "Q4"; }
        }
        
        setSelectedQuarter(defaultQuarter);
        return activePhaseName;
      };

      const [goalRes, shared, user, notif, phase] = await Promise.all([
        getGoals(),
        getEmployeeSharedGoals(),
        getCurrentUserProfile(),
        getNotifications().catch(() => ({ data: [] })), 
        fetchPhase(),
      ]);

      // Check if user has an active goal sheet
      if (goalRes?.error === "Goal sheet not found") {
        setHasGoalSheet(false);
      } else {
        setHasGoalSheet(true);
      }

      const data = goalRes?.data || [];
      
      setGoals(data);
      setSharedGoals(shared?.data || []);
      setNotifications(notif?.data || []);
      setProfile(user);
      setCurrentPhase(phase);

      const totalWeight = data.reduce((a, b) => a + Number(b.weightage || 0), 0);
      const avg = data.length
        ? Math.round(data.reduce((a, b) => a + Number(b.progress || 0), 0) / data.length)
        : 0;

      setStats({
        total: data.length,
        progress: avg,
        weight: totalWeight,
        status: goalRes?.submissionStatus || "draft",
      });

    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSheet() {
    const res = await getOrCreateGoalSheet();
    if (res?.error) {
      alert(res.error);
      return;
    }
    alert("Goal Sheet created successfully for this cycle.");
    load(); // Reload dashboard to fetch the new sheet
  }

  async function submit() {
    const res = await submitGoalSheet();
    if (res?.error) {
      alert(res.error);
      return;
    }
    alert("Goal Sheet Submitted Successfully");
    load();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // Filter goals by the selected dropdown quarter
  const filteredGoals = goals.filter((g) => g.quarter === selectedQuarter);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FC] text-slate-500 font-medium">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static bg-[#0F1729] w-[240px] h-screen z-50 transition-transform duration-300 ${
          mobile ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col`}
      >
        <div className="p-6">
          <h1 className="text-white font-serif text-2xl font-bold tracking-tight">
            GoalTrack
          </h1>
        </div>

        <nav className="space-y-1.5 px-4 flex-1 flex flex-col">
          <Item icon={LayoutDashboard} href="/employee/dashboard" label="Dashboard" active />
          <Item icon={ListChecks} href="/employee/goals" label="Goals" />
          <Item icon={CalendarCheck} href="/employee/checkins" label="Check-ins" />
          <Item icon={BarChart2} href="/employee/report" label="Reports" />
          <Item icon={ListChecks} href="/employee/guidelines" label="Guideline" />
          
          <div className="mt-auto mb-6">
            <button 
              onClick={handleSignOut} 
              className="flex w-full items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors text-rose-400 hover:bg-rose-500/10 text-left"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setMobile(!mobile)}
              className="md:hidden text-slate-500 hover:text-slate-800 transition-colors"
            >
              {mobile ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="font-semibold text-slate-800 text-lg">Dashboard</div>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/notifications" className="relative text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell size={20} />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </Link>
            <div className="flex items-center gap-3 pl-5 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
              <div className="text-sm font-medium text-slate-700 hidden sm:block">
                {profile?.full_name}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 overflow-auto flex-1">
          {/* Welcome Banner */}
          <div className="bg-[#0F1729] rounded-2xl p-8 text-white mb-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10 gap-4">
              <div>
                <h2 className="text-3xl font-serif font-bold">
                  Welcome back, {profile?.full_name?.split(" ")[0]} 👋
                </h2>
                <p className="text-slate-400 mt-2">
                  Here is an overview of your current goal progress.
                </p>
              </div>
              
              {/* Dynamic Phase Indicator */}
              <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-100 px-4 py-2 rounded-lg text-sm font-medium w-fit">
                <Clock size={16} />
                {currentPhase}
              </div>
            </div>
          </div>

          {/* Create Goal Sheet Prompt if missing */}
          {!hasGoalSheet && (
             <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 mb-6 text-center flex flex-col items-center justify-center shadow-sm">
                <Target size={40} className="text-indigo-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">No Goal Sheet Found</h3>
                <p className="text-slate-600 mb-6 max-w-md text-sm">
                  You haven't initiated a goal sheet for the current active cycle. Create one to start assigning your quarterly goals.
                </p>
                <button 
                  onClick={handleCreateSheet}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/20"
                >
                  <Plus size={18} /> Create Cycle Goal Sheet
                </button>
             </div>
          )}

          {hasGoalSheet && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Stat title="Total Goals" value={stats.total} icon={Target} />
                <Stat title="Avg. Progress" value={`${stats.progress}%`} icon={TrendingUp} />
                <Stat title="Total Weight" value={`${stats.weight}%`} icon={PieChart} />
                <Stat title="Sheet Status" value={stats.status} icon={FileText} />
              </div>

              <div className="flex gap-3 mb-6">
                <Link
                  href="/employee/goals"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
                >
                  Manage Goals
                </Link>
                {stats.status === "draft" && stats.weight === 100 && (
                  <button
                    onClick={submit}
                    className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Send size={16} className="text-slate-400" />
                    Submit for Approval
                  </button>
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* My Goals List (Filtered by Quarter) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif font-bold text-slate-800 text-lg">Current Goals</h3>
                    
                    {/* Quarter Filter Dropdown */}
                    <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                      <SelectTrigger className="w-[120px] bg-white text-sm font-medium">
                        <SelectValue placeholder="Quarter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1">Q1</SelectItem>
                        <SelectItem value="Q2">Q2</SelectItem>
                        <SelectItem value="Q3">Q3</SelectItem>
                        <SelectItem value="Q4">Q4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-6">
                    {filteredGoals.length === 0 ? (
                      <div className="text-slate-400 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                        No goals found for {selectedQuarter}.
                      </div>
                    ) : (
                      filteredGoals.map((g, i) => (
                        <div key={g.id} className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div className="font-medium text-slate-800">{g.title}</div>
                            <div className="text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              Wt: {g.weightage}%
                            </div>
                          </div>
                          <Progress value={Number(g.progress || 0)} color={COLORS[i % COLORS.length]} />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Shared Goals */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="font-serif font-bold text-slate-800 text-lg mb-6">Shared Goals</h3>
                  <div className="space-y-4">
                    {sharedGoals.length === 0 ? (
                      <div className="text-slate-400 text-sm text-center py-6">
                        No shared goals assigned to you.
                      </div>
                    ) : (
                      sharedGoals.map((g) => (
                        <div key={g.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 transition-colors hover:border-indigo-100">
                          <div className="font-medium text-slate-800 text-sm mb-1 line-clamp-2">
                            {g.shared_goals?.title}
                          </div>
                          <div className="text-xs text-slate-500 font-medium flex justify-between">
                            <span>Target: <span className="text-slate-700">{g.shared_goals?.target_value}</span></span>
                            <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded">{g.shared_goals?.quarter || 'Q1'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Item({ icon: Icon, href, label, active = false }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
        active 
          ? "bg-indigo-600/10 text-indigo-400" 
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}