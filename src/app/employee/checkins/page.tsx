"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import {
  LayoutDashboard,
  ListChecks,
  CalendarCheck,
  BarChart3,
  Menu,
  X,
  Target,
  CheckCircle2,
  Lock,
  LogOut,
  Users,
  Briefcase,
  UserCircle,
  Send
} from "lucide-react";

import { getQuarterlyGoals, updateQuarterlyCheckin } from "@/services/checkinservice";
import { getCurrentUserProfile, getEmployeeSharedGoals } from "@/services/sharedgoalservice";
import { getGoals } from "@/services/goalservice";
import { Badge } from "@/components/ui/badge";

export default function EmployeeCheckinPage() {
  const [tab, setTab] = useState<"sheet" | "shared">("sheet");
  const [quarter, setQuarter] = useState("Q1");
  const [goals, setGoals] = useState<any[]>([]);
  const [sharedGoals, setSharedGoals] = useState<any[]>([]);
  const [sheetStatus, setSheetStatus] = useState("draft");
  
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  
  const [mobile, setMobile] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [quarter]);

  async function loadData() {
    setLoading(true);
    try {
      const [response, user, sharedRes, sheetRes] = await Promise.all([
        getQuarterlyGoals(quarter),
        getCurrentUserProfile(),
        getEmployeeSharedGoals(),
        getGoals() 
      ]);

      setGoals(response?.data || []);
      setProfile(user);
      setSharedGoals(sharedRes?.data || []);
      setSheetStatus(sheetRes?.submissionStatus || "draft");
    } catch (error) {
      console.error("Failed to load check-in data", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // --- SAVE PERSONAL SHEET GOALS ---
  async function save(goal: any) {
    setSavingId(goal.id);
    const response = await updateQuarterlyCheckin(goal);
    if (response?.error) {
      alert("Failed to update check-in: " + response.error);
      setSavingId(null);
      return;
    }
    setMessage(`Check-in and weight for "${goal.title}" saved successfully.`);
    setTimeout(() => setMessage(""), 4000);
    await loadData();
    setSavingId(null);
  }

  // --- SAVE SHARED GOALS (DRAFT) ---
  async function saveShared(sg: any) {
    setSavingId(sg.id);
    const supabase = createClient();
    
    const { error } = await supabase
      .from("shared_goal_assignments")
      .update({ 
        weightage: sg.weightage || 0
      })
      .eq("id", sg.id);

    if (error) {
      alert(error.message);
    } else {
      setMessage(`Shared goal progress and weight updated!`);
      setTimeout(() => setMessage(""), 4000);
    }
    await loadData();
    setSavingId(null);
  }

  // --- SUBMIT SHARED GOALS (LOCKS IT) ---
  async function submitShared(sg: any) {
    const ownerName = sg.shared_goals?.owner_name || "Assigner";
    if (!confirm(`Submit this shared goal update to ${ownerName}? You won't be able to edit it until it is reviewed.`)) return;

    setSavingId("submit-" + sg.id);
    const supabase = createClient();
    
    // Updates progress, weightage, and sets status to submitted
    const { error } = await supabase
      .from("shared_goal_assignments")
      .update({ 
        weightage: sg.weightage || 0,
        status: "submitted" // Sets status so it locks in the UI
      })
      .eq("id", sg.id);

    if (error) {
      alert(error.message);
    } else {
      setMessage(`Shared goal successfully submitted to ${ownerName}!`);
      setTimeout(() => setMessage(""), 5000);
    }
    await loadData();
    setSavingId(null);
  }

  const handleGoalUpdate = (goalId: string, field: string, value: string | number) => {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, [field]: value } : g)));
  };

  const handleSharedGoalUpdate = (assignmentId: string, field: string, value: number) => {
    setSharedGoals((prev) => prev.map((g) => (g.id === assignmentId ? { ...g, [field]: value } : g)));
  };

  const isSheetLocked = sheetStatus === "submitted" || sheetStatus === "approved";

  // --- FILTER SHARED GOALS BY QUARTER ---
  const displayedSharedGoals = sharedGoals.filter(sg => {
    const targetQuarter = sg.shared_goals?.quarter;
    // Show if it matches exactly, OR if the goal is set to apply to "All Quarters", OR if not set (fallback)
    return targetQuarter === quarter || targetQuarter === "All Quarters" || !targetQuarter;
  });

  if (loading && !profile) return <div className="h-screen bg-[#F8F9FC] flex items-center justify-center font-medium text-neutral-500">Loading Workspace...</div>;

  return (
    <div className="flex h-screen bg-[#F8F9FC] overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition-transform flex flex-col ${mobile ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-5"><h1 className="text-white font-bold text-xl">GoalTrack</h1></div>
        <nav className="space-y-2 px-3 mt-4">
          <Nav icon={LayoutDashboard} label="Dashboard" href="/employee/dashboard" />
          <Nav icon={ListChecks} label="My Goal Sheet" href="/employee/goals" />
          <Nav active icon={CalendarCheck} label="Check-ins" href="/employee/checkins" />
          <Nav icon={BarChart3} label="Reports" href="/employee/report" />
          <div className="pt-4 mt-4 border-t border-white/10">
            <button onClick={handleSignOut} className="flex w-full gap-3 px-4 py-3 rounded-xl transition text-white/70 hover:bg-rose-500/10 hover:text-rose-500 text-left">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white px-5 py-4 border-b flex justify-between items-center z-10 shrink-0">
          <div className="flex gap-3 items-center">
            <button className="md:hidden" onClick={() => setMobile(!mobile)}>{mobile ? <X /> : <Menu />}</button>
            <div className="font-semibold text-neutral-800">Check-in Workspace</div>
          </div>
          <div className="text-sm font-medium">{profile?.full_name}</div>
        </header>

        <main className="p-5 md:p-8 overflow-auto flex-1 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">
            
            <div className="flex gap-6 border-b border-neutral-200">
              <button onClick={() => setTab("sheet")} className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors ${tab === "sheet" ? "border-indigo-600 text-indigo-600" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
                <ListChecks size={16} className="inline mr-2" />
                Personal Goals Check-in
              </button>
              <button onClick={() => setTab("shared")} className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors ${tab === "shared" ? "border-indigo-600 text-indigo-600" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
                <Users size={16} className="inline mr-2" />
                Shared Goals Check-in
              </button>
            </div>

            {message && (
              <div className="bg-emerald-50 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 border border-emerald-200">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <p className="font-medium text-sm">{message}</p>
              </div>
            )}

            {/* QUARTER SELECTOR (Shared across both tabs) */}
            <div className="flex justify-between items-center flex-wrap gap-4 mb-2">
              <div className="flex bg-white rounded-xl p-1 shadow-sm border border-neutral-200">
                {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                  <button key={q} onClick={() => setQuarter(q)} className={`px-6 py-2 rounded-lg font-semibold text-sm ${quarter === q ? "bg-indigo-600 text-white" : "text-neutral-500 hover:bg-neutral-50"}`}>
                    {q}
                  </button>
                ))}
              </div>
              {tab === "sheet" && isSheetLocked && <span className="text-amber-600 font-semibold text-sm bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-2"><Lock size={14} /> Sheet is locked</span>}
            </div>

            {/* TAB: SHEET GOALS */}
            {tab === "sheet" && (
              <div className="space-y-6">
                {goals.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-12 text-center flex flex-col items-center shadow-sm">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                      <Target className="text-neutral-400" size={28} />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">No personal goals scheduled for {quarter}</h3>
                    <p className="text-neutral-500 mt-1 text-sm max-w-sm">
                      There are no personal sheet goals assigned to you for this specific quarter. Check another quarter or add goals to your sheet.
                    </p>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <div key={`sheet-goal-${goal.id}`} className={`bg-white rounded-2xl p-6 shadow-sm border border-neutral-200/60 ${isSheetLocked ? 'opacity-90' : ''}`}>
                      <h2 className="text-xl font-bold mb-4 text-neutral-900">{goal.title}</h2>
                      
                      <div className="grid lg:grid-cols-2 gap-6 bg-neutral-50/50 p-5 rounded-xl border border-neutral-100">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><div className="text-neutral-500 text-xs uppercase tracking-wider font-semibold">Target</div><div className="font-semibold text-lg text-neutral-900 mt-1">{goal.target_value} <span className="text-sm font-medium text-neutral-500">{goal.uom_type}</span></div></div>
                          <div><div className="text-neutral-500 text-xs uppercase tracking-wider font-semibold">Current Progress</div><div className="font-semibold text-lg text-indigo-600 mt-1">{goal.progress}%</div></div>
                        </div>

                        <div className="flex gap-4 items-end flex-wrap">
                          <div className="flex-1 min-w-[120px]">
                            <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Actual Achievement</label>
                            <input
                              type="number"
                              value={goal.actual_achievement || ""}
                              disabled={isSheetLocked}
                              placeholder="Achieved..."
                              onChange={(e) => handleGoalUpdate(goal.id, "actual_achievement", Number(e.target.value))}
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm disabled:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Weightage (%)</label>
                            <input
                              type="number"
                              value={goal.weightage || ""}
                              disabled={isSheetLocked}
                              placeholder="Weight %"
                              onChange={(e) => handleGoalUpdate(goal.id, "weightage", Number(e.target.value))}
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm disabled:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <button
                            onClick={() => save(goal)}
                            disabled={isSheetLocked || savingId === goal.id}
                            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:bg-indigo-300 shadow-sm transition-colors hover:bg-indigo-700 h-[42px] shrink-0"
                          >
                            Save Update
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: SHARED GOALS */}
            {tab === "shared" && (
              <div className="space-y-6">
                {displayedSharedGoals.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-12 text-center flex flex-col items-center shadow-sm">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                      <Users className="text-neutral-400" size={28} />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">No Shared Goals for {quarter}</h3>
                    <p className="text-neutral-500 mt-1 text-sm max-w-sm">
                      There are currently no shared goals assigned to you targeting this specific quarter. Check another quarter to see your assignments.
                    </p>
                  </div>
                ) : (
                  displayedSharedGoals.map((sg) => {
                    const isSgLocked = sg.status === "submitted" || sg.status === "approved";
                    const ownerName = sg.shared_goals?.owner_name || "Admin";

                    return (
                      <div key={`shared-goal-${sg.id}`} className={`bg-white rounded-2xl p-6 shadow-sm border border-neutral-200/60 transition-all hover:shadow-md ${isSgLocked ? 'opacity-90' : ''}`}>
                        
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h2 className="text-lg font-bold text-neutral-900 mb-1">{sg.shared_goals?.title}</h2>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                                {sg.shared_goals?.quarter || 'All Quarters'}
                              </Badge>
                              {isSgLocked && <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-200">Submitted</Badge>}
                            </div>
                            <p className="text-sm text-neutral-500">{sg.shared_goals?.description}</p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 capitalize border-indigo-100">
                                {sg.shared_goals?.assignment_type || 'Custom'} Assignment
                              </Badge>
                              {sg.shared_goals?.department && (
                                <Badge variant="outline" className="text-neutral-600 bg-neutral-50 border-neutral-200 flex items-center gap-1">
                                  <Briefcase size={12}/> {sg.shared_goals?.department}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 mt-1">
                              <UserCircle size={14} className="text-neutral-400" /> Assigned by: <span className="text-neutral-800">{ownerName}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid lg:grid-cols-2 gap-6 bg-indigo-50/30 p-5 rounded-xl border border-indigo-50 mt-6">
                          <div className="grid grid-cols-2 gap-4 text-sm items-center">
                            <div><div className="text-neutral-500 text-xs uppercase tracking-wider font-semibold">Target Value</div><div className="font-semibold text-lg text-neutral-900 mt-1">{sg.shared_goals?.target_value} {sg.shared_goals?.uom_type}</div></div>
                          </div>

                          <div className="flex gap-4 items-end flex-wrap">
                            
                            

                            <div className="flex-1 min-w-[100px]">
                              <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Weightage (%)</label>
                              <input
                                  type="number"
                                  min={0} max={100}
                                  value={sg.weightage || ""}
                                  disabled={isSgLocked}
                                  onChange={(e) => handleSharedGoalUpdate(sg.id, "weightage", Number(e.target.value))}
                                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm disabled:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="Weight %"
                                />
                            </div>
                            
                            {!isSgLocked && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveShared(sg)}
                                  disabled={savingId === sg.id || isSgLocked}
                                  className="rounded-lg bg-white border border-neutral-300 text-neutral-700 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 h-[42px] transition-colors"
                                >
                                  {savingId === sg.id ? "..." : "Save"}
                                </button>
                                <button
                                  onClick={() => submitShared(sg)}
                                  disabled={savingId === "submit-" + sg.id || isSgLocked}
                                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 h-[42px] transition-colors flex items-center gap-2"
                                >
                                  <Send size={14} /> Submit
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E5E7EB; border-radius: 20px; }
      `}} />
    </div>
  );
}

function Nav({ icon: Icon, label, href, active }: any) {
  return (
    <Link href={href} className={`flex gap-3 px-4 py-3 rounded-xl transition-colors ${active ? "bg-indigo-600 text-white font-medium" : "text-white/70 hover:bg-white/10"}`}>
      <Icon size={18} /> {label}
    </Link>
  );
}