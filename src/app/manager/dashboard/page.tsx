"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  Bell,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock,
  Download,
  FileClock,
  LayoutDashboard,
  Lock,
  MessageSquare,
  RotateCcw,
  ScrollText,
  Target,
  Users,
  UsersRound,
  X,
  Menu,
  LogOut
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Import actual services
import { getSubmittedGoalSheets, approveGoalSheet, rejectGoalSheet } from "@/services/managerservice";
import { getManagerCheckins } from "@/services/checkinservice";
import { getCurrentUserProfile } from "@/services/sharedgoalservice";

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mobile, setMobile] = useState(false);
  
  // Data States
  const [pendingSheets, setPendingSheets] = useState<any[]>([]);
  const [teamProgress, setTeamProgress] = useState<any[]>([]);
  const [allGoals, setAllGoals] = useState<any[]>([]);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [userRes, sheetsRes, checkinsRes] = await Promise.all([
        getCurrentUserProfile(),
        getSubmittedGoalSheets(),
        getManagerCheckins() // Gets all goals with employee data attached
      ]);

      if (userRes) setProfile(userRes);

      const sheets = sheetsRes?.data || [];
      const goals = checkinsRes?.data || [];
      
      setAllGoals(goals);

      // Filter only sheets that are submitted (awaiting approval)
      const pending = sheets.filter((s: any) => s.submission_status === "submitted");
      setPendingSheets(pending);

      // Calculate Team Progress from goals
      // Group by employee
      const employeeMap: Record<string, { name: string; totalProgress: number; count: number }> = {};
      
      goals.forEach((g: any) => {
        if (g.employee) {
          const empId = g.employee.id;
          if (!employeeMap[empId]) {
            employeeMap[empId] = { name: g.employee.full_name, totalProgress: 0, count: 0 };
          }
          employeeMap[empId].totalProgress += Number(g.progress || 0);
          employeeMap[empId].count += 1;
        }
      });

      const progressArray = Object.values(employeeMap).map((emp) => ({
        name: emp.name,
        progress: Math.round(emp.totalProgress / emp.count)
      })).sort((a, b) => b.progress - a.progress);

      setTeamProgress(progressArray);

    } catch (err) {
      console.error("Failed to load manager dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // --- ACTIONS ---

  const handleApprove = async (sheetId: string) => {
    if (!confirm("Are you sure you want to approve this goal sheet?")) return;
    const res = await approveGoalSheet(sheetId);
    if (!res.error) {
      alert("Goal sheet approved.");
      loadData(); // Refresh UI
    } else {
      alert(res.error);
    }
  };

  const handleReject = async (sheetId: string) => {
    if (!confirm("Are you sure you want to return this goal sheet for rework?")) return;
    const res = await rejectGoalSheet(sheetId);
    if (!res.error) {
      alert("Goal sheet returned to employee.");
      loadData(); // Refresh UI
    } else {
      alert(res.error);
    }
  };

  const toggleSheet = (id: string) => {
    setExpandedSheet(expandedSheet === id ? null : id);
  };

  // --- DERIVED STATS ---
  const teamSize = teamProgress.length;
  const pendingCount = pendingSheets.length;
  const overallDeptProgress = teamSize > 0 
    ? Math.round(teamProgress.reduce((acc, curr) => acc + curr.progress, 0) / teamSize) 
    : 0;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FC]">
        Loading Manager Portal...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition-transform ${
          mobile ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col`}
      >
        <div className="p-5 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-indigo-600 text-white flex justify-center items-center shrink-0">
            <Target className="size-5" />
          </div>
          <div className="flex flex-col text-white">
            <span className="leading-tight font-bold text-sm">GoalTrack</span>
            <span className="leading-tight text-white/50 text-xs">Manager Portal</span>
          </div>
        </div>
        
        <nav className="space-y-2 px-3 flex-1 mt-4">
          <Item icon={LayoutDashboard} href="/manager/dashboard" label="Dashboard" active />
          
          <Item 
            icon={CheckCircle} 
            href="/manager/approvals/id" 
            label="Approvals" 
            badge={pendingCount > 0 ? pendingCount : undefined} 
          />
          <Item icon={ClipboardCheck} href="/manager/checkins" label="Check-ins" />
          <Item icon={Users} href="/manager/shared-goals" label="Shared Goals" />
          
          <div className="pt-4 mt-4 border-t border-white/10">
            <button onClick={handleSignOut} className="flex w-full gap-3 px-4 py-3 rounded-xl transition text-white/70 hover:bg-rose-500/10 hover:text-rose-500 text-left items-center text-sm">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="bg-white px-5 py-4 border-b flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <button onClick={() => setMobile(!mobile)} className="md:hidden">
              {mobile ? <X /> : <Menu />}
            </button>
            <div className="flex flex-col">
              <h1 className="font-semibold text-neutral-950 text-base">
                Manager Portal
              </h1>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="flex flex-col items-end">
                <span className="leading-none font-semibold text-sm">
                  {profile?.full_name || "Manager"}
                </span>
                <span className="text-neutral-500 text-xs">
                  {profile?.department || "Department"}
                </span>
              </div>
              <div className="size-8 font-semibold rounded-full bg-indigo-100 text-indigo-700 text-xs flex justify-center items-center">
                {profile?.full_name?.substring(0, 2).toUpperCase() || "MGR"}
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <main className="p-4 md:p-8 overflow-auto flex-1">
          <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-5">
                <CardHeader className="flex p-0 flex-row justify-between items-center gap-2">
                  <span className="font-medium text-neutral-500 text-xs uppercase tracking-wider">Team Size</span>
                  <div className="size-8 rounded-lg bg-indigo-50 flex justify-center items-center">
                    <Users className="size-4 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-0 mt-3 flex flex-col gap-1">
                  <div className="font-bold text-neutral-950 text-2xl">{teamSize}</div>
                  <span className="text-neutral-500 text-xs">Direct reports</span>
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-5">
                <CardHeader className="flex p-0 flex-row justify-between items-center gap-2">
                  <span className="font-medium text-neutral-500 text-xs uppercase tracking-wider">Pending Approvals</span>
                  <div className="relative size-8 rounded-lg bg-amber-50 flex justify-center items-center">
                    <Clock className="size-4 text-amber-600" />
                    {pendingCount > 0 && (
                      <span className="size-3 font-bold rounded-full bg-red-500 text-white text-[9px] flex absolute -right-1 -top-1 justify-center items-center">
                        !
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 mt-3 flex flex-col gap-1">
                  <div className="font-bold text-amber-600 text-2xl">{pendingCount}</div>
                  <span className="text-neutral-500 text-xs">Goal sheets awaiting review</span>
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-5">
                <CardHeader className="flex p-0 flex-row justify-between items-center gap-2">
                  <span className="font-medium text-neutral-500 text-xs uppercase tracking-wider">Check-ins Pending</span>
                  <div className="size-8 rounded-lg bg-orange-50 flex justify-center items-center">
                    <FileClock className="size-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-0 mt-3 flex flex-col gap-1">
                  <div className="font-bold text-orange-600 text-2xl">0</div>
                  <span className="text-neutral-500 text-xs">Updates due this week</span>
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-5">
                <CardHeader className="flex p-0 flex-row justify-between items-center gap-2">
                  <span className="font-medium text-neutral-500 text-xs uppercase tracking-wider">Dept Completion</span>
                  <div className="size-8 rounded-lg bg-emerald-50 flex justify-center items-center">
                    <Check className="size-4 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-0 mt-3 flex flex-col gap-1">
                  <div className="font-bold text-emerald-600 text-2xl">{overallDeptProgress}%</div>
                  <span className="text-neutral-500 text-xs">Average team progress</span>
                </CardContent>
              </Card>
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
              
              {/* Left Column: Approvals */}
              <div className="flex flex-col gap-4">
                <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6 flex flex-col gap-4">
                  <CardHeader className="flex p-0 flex-row justify-between items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="font-semibold text-lg">Pending Goal Approvals</CardTitle>
                      <CardDescription className="text-sm">
                        {pendingCount} employee goal sheets awaiting your review
                      </CardDescription>
                    </div>
                    {pendingCount > 0 && (
                      <Badge variant="secondary" className="rounded-full bg-indigo-50 text-indigo-700">
                        {pendingCount} New
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex p-0 flex-col gap-3 mt-2">
                    {pendingSheets.length === 0 ? (
                      <div className="text-center py-10 px-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50">
                        <CheckCircle className="size-8 text-neutral-300 mx-auto mb-2" />
                        <h3 className="font-medium text-neutral-900">All caught up!</h3>
                        <p className="text-neutral-500 text-sm">No goal sheets are pending approval.</p>
                      </div>
                    ) : (
                      pendingSheets.map((sheet: any) => {
                        const isExpanded = expandedSheet === sheet.id;
                        const sheetGoals = allGoals.filter(g => g.goal_sheet_id === sheet.id);

                        return (
                          <div key={sheet.id} className={`rounded-xl border border-solid transition-colors ${isExpanded ? 'border-indigo-200 bg-indigo-50/10' : 'border-neutral-200 bg-white'} flex p-4 flex-col gap-4`}>
                            {/* Card Header (Clickable) */}
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSheet(sheet.id)}>
                              <div className="flex items-center gap-3">
                                <div className="size-10 font-bold rounded-full bg-indigo-100 text-indigo-700 text-xs flex justify-center items-center">
                                  {sheet.profile?.full_name?.substring(0, 2).toUpperCase() || "EM"}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-neutral-950 text-sm">
                                    {sheet.profile?.full_name || "Employee"}
                                  </span>
                                  <span className="text-neutral-500 text-xs">
                                    Submitted {new Date(sheet.updated_at || sheet.created_at).toLocaleDateString()} · {sheetGoals.length} goals
                                  </span>
                                </div>
                              </div>
                              {isExpanded ? <ChevronUp className="size-5 text-neutral-500" /> : <ChevronDown className="size-5 text-neutral-500" />}
                            </div>

                            {/* Expanded Content: Goals List */}
                            {isExpanded && (
                              <div className="flex flex-col gap-4 mt-2">
                                <div className="rounded-lg bg-white border border-neutral-200 overflow-hidden">
                                  <div className="grid grid-cols-[1fr_90px_70px] md:grid-cols-[1fr_90px_70px_70px] font-medium bg-neutral-50 text-neutral-500 text-[11px] uppercase tracking-wider px-4 py-2">
                                    <span>Goal Title</span>
                                    <span>Thrust Area</span>
                                    <span className="hidden md:block">Target</span>
                                    <span>Weight</span>
                                  </div>
                                  {sheetGoals.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-neutral-500">No goals found in this sheet.</div>
                                  ) : (
                                    sheetGoals.map((g: any) => (
                                      <div key={g.id} className="grid grid-cols-[1fr_90px_70px] md:grid-cols-[1fr_90px_70px_70px] text-xs border-t border-neutral-200 px-4 py-3 items-center">
                                        <span className="text-neutral-900 font-medium truncate pr-2" title={g.title}>{g.title}</span>
                                        <span className="text-neutral-500 capitalize">{g.thrust_area || "-"}</span>
                                        <span className="hidden md:block text-neutral-700 font-medium">{g.target_value || "-"}</span>
                                        <span className="text-neutral-700 font-medium">{g.weightage || 0}%</span>
                                      </div>
                                    ))
                                  )}
                                </div>

                                <div className="rounded-lg bg-amber-50 flex px-3 py-2 items-center gap-2 border border-amber-100">
                                  <Lock className="size-3.5 text-amber-600 shrink-0" />
                                  <span className="text-amber-700 text-xs">
                                    Approving this sheet will lock the goals for the employee.
                                  </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2">
                                  <Button 
                                    onClick={(e) => { e.stopPropagation(); handleApprove(sheet.id); }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex-1 h-9"
                                  >
                                    <Check className="size-4 mr-1" /> Approve
                                  </Button>
                                  <Button
                                    onClick={(e) => { e.stopPropagation(); handleReject(sheet.id); }}
                                    variant="outline"
                                    className="text-amber-700 border-amber-200 hover:bg-amber-50 text-xs flex-1 h-9"
                                  >
                                    <RotateCcw className="size-4 mr-1" /> Return for Rework
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Progress & Actions */}
              <div className="flex flex-col gap-6">
                
                {/* Team Progress Overview */}
                <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6 flex flex-col gap-4">
                  <CardHeader className="p-0 gap-1">
                    <CardTitle className="font-semibold text-lg">Team Progress Overview</CardTitle>
                    <CardDescription className="text-sm">Overall goal completion by member</CardDescription>
                  </CardHeader>
                  <CardContent className="flex p-0 flex-col gap-4 mt-2">
                    {teamProgress.length === 0 ? (
                      <p className="text-sm text-neutral-500">No active goals to track yet.</p>
                    ) : (
                      teamProgress.map((member, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5">
                          <div className="text-sm flex justify-between items-center">
                            <span className="text-neutral-900 font-medium">{member.name}</span>
                            <span className={`font-bold ${
                              member.progress >= 75 ? "text-emerald-600" :
                              member.progress >= 40 ? "text-amber-600" :
                              "text-red-600"
                            }`}>
                              {member.progress}%
                            </span>
                          </div>
                          <div className="rounded-full bg-neutral-100 w-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                member.progress >= 75 ? "bg-emerald-500" :
                                member.progress >= 40 ? "bg-amber-500" :
                                "bg-red-500"
                              }`} 
                              style={{ width: `${member.progress}%` }} 
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6 flex flex-col gap-4">
                  <CardHeader className="p-0 gap-1">
                    <CardTitle className="font-semibold text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex p-0 flex-col gap-3 mt-1">
                    <Link href="/manager/shared-goals" className="w-full">
                      <Button className="w-full bg-[#0F1729] hover:bg-[#0F1729]/90 text-white justify-start gap-2 h-10 rounded-xl">
                        <UsersRound className="size-4" />
                        Assign Shared Goal
                      </Button>
                    </Link>
                    
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Re-usable Sidebar Item Component
function Item({ icon: Icon, href, label, active, badge }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
        active
          ? "bg-indigo-600 text-white font-medium"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        {label}
      </div>
      {badge && (
        <span className="min-w-[20px] font-semibold rounded-full bg-red-500 text-white text-[10px] flex px-1.5 justify-center items-center h-5">
          {badge}
        </span>
      )}
    </Link>
  );
}