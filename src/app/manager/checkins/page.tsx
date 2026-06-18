"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  Bell,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileDown,
  LayoutDashboard,
  MessageSquarePlus,
  Table2,
  Target,
  Menu,
  X,
  Users,
  ClipboardCheck,
  Loader2,
  LogOut,
  Filter
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Textarea } from "@/components/ui/textarea";
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { getManagerCheckins, saveManagerComment } from "@/services/checkinservice";
import { getCurrentUserProfile } from "@/services/sharedgoalservice";

export default function ManagerCheckinsPage() {
  const [mobile, setMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  const [allGoals, setAllGoals] = useState<any[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<any[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("All");
  
  const [breakdownData, setBreakdownData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [savingComment, setSavingComment] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const filtered = selectedQuarter === "All" ? allGoals : allGoals.filter(g => g.quarter === selectedQuarter);
    setFilteredGoals(filtered);

    const employeeStats: Record<string, any> = {};
    filtered.forEach((g: any) => {
      const empName = g.employee?.full_name?.split(" ")[0] || 'Unknown';
      if (!employeeStats[empName]) employeeStats[empName] = { name: empName, completed: 0, onTrack: 0, behind: 0 };

      const status = (g.goal_status || "on_track").toLowerCase().replace(" ", "_");
      if (status === "completed") employeeStats[empName].completed += 1;
      else if (status === "behind" || status === "at_risk") employeeStats[empName].behind += 1;
      else employeeStats[empName].onTrack += 1;
    });
    setBreakdownData(Object.values(employeeStats));
  }, [allGoals, selectedQuarter]);

  async function loadData() {
    setLoading(true);
    try {
      const [userRes, checkinsRes] = await Promise.all([
        getCurrentUserProfile(),
        getManagerCheckins().catch(() => ({ data: [] }))
      ]);

      setProfile(userRes || null);
      const fetchedGoals = checkinsRes?.data || [];
      setAllGoals(fetchedGoals);

      const quarterStats: Record<string, { total: number, count: number }> = {
        "Q1": { total: 0, count: 0 }, "Q2": { total: 0, count: 0 },
        "Q3": { total: 0, count: 0 }, "Q4": { total: 0, count: 0 }
      };

      fetchedGoals.forEach((g: any) => {
        const q = g.quarter || "Q1";
        if (quarterStats[q]) {
          quarterStats[q].total += Number(g.progress || 0);
          quarterStats[q].count += 1;
        }
      });

      setTrendData(["Q1", "Q2", "Q3", "Q4"].map(q => ({
        quarter: q,
        averageProgress: quarterStats[q].count > 0 ? Math.round(quarterStats[q].total / quarterStats[q].count) : 0
      })));
    } catch (err) {
      console.error("Failed to load checkins:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const handleExport = (format: "csv" | "excel") => {
    if (!filteredGoals || filteredGoals.length === 0) return alert(`No data to export.`);
    const headers = ["Employee Name", "Quarter", "Goal Title", "Target", "Actual", "Progress (%)", "Status"];
    const escapeCSV = (str: any) => {
      const s = String(str || "");
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = filteredGoals.map(g => [
      escapeCSV(g.employee?.full_name || "Unknown"), escapeCSV(g.quarter || "N/A"),
      escapeCSV(g.title), escapeCSV(g.target_value), escapeCSV(g.actual_achievement || 0),
      escapeCSV(g.progress || 0), escapeCSV(g.goal_status || "On Track")
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute("download", `Team_Checkins_${selectedQuarter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveComment = async (goalId: string) => {
    const text = commentInputs[goalId] || "";
    setSavingComment(goalId);
    const { error } = await saveManagerComment(goalId, text);
    if (!error) {
      setAllGoals(allGoals.map(g => g.id === goalId ? { ...g, manager_comment: text } : g));
      setEditingCommentId(null);
    } else alert("Failed to save comment.");
    setSavingComment(null);
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FC]"><Loader2 className="size-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      <aside className={`fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition-transform ${mobile ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 flex flex-col`}>
        <div className="p-5 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-indigo-600 text-white flex justify-center items-center shrink-0"><Target className="size-5" /></div>
          <div className="flex flex-col text-white"><span className="font-bold text-sm">GoalTrack</span></div>
        </div>
        <nav className="space-y-2 px-3 flex-1 mt-4">
          <Item icon={LayoutDashboard} href="/manager/dashboard" label="Dashboard" />
          <Item icon={CheckCircle} href="/manager/approvals/id" label="Approvals" />
          <Item icon={ClipboardCheck} href="/manager/checkins" label="Check-ins" active />
          <Item icon={Users} href="/manager/shared-goals" label="Shared Goals" />
          <div className="pt-4 mt-4 border-t border-white/10">
            <button onClick={handleSignOut} className="flex w-full gap-3 px-4 py-3 rounded-xl transition text-white/70 hover:bg-rose-500/10 hover:text-rose-500 text-left items-center text-sm">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white px-5 py-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobile(!mobile)} className="md:hidden text-neutral-600"><Menu /></button>
            <h1 className="font-semibold">Team Check-ins</h1>
          </div>
        </header>

        <main className="p-4 md:p-8 overflow-auto flex-1">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            
            <div className="flex justify-between items-end gap-4">
              <div>
                <h2 className="font-bold text-2xl">Check-in Reviews</h2>
                <p className="text-neutral-500 text-sm">Review quarterly goal progress.</p>
              </div>
              <Button onClick={() => handleExport("csv")} variant="outline"><FileDown className="size-4 mr-2" /> Export</Button>
            </div>

            <Card className="shadow-sm rounded-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-neutral-100 bg-white flex justify-between items-center">
                <div className="flex items-center gap-2"><Filter size={16} className="text-neutral-500" /><span className="text-sm font-semibold">Quarter:</span></div>
                <div className="flex bg-neutral-100 rounded-lg p-1">
                  {["All", "Q1", "Q2", "Q3", "Q4"].map((q) => (
                    <button key={q} onClick={() => setSelectedQuarter(q)} className={`px-4 py-1.5 rounded-md text-sm font-medium ${selectedQuarter === q ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"}`}>{q}</button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-neutral-50/80 text-neutral-500 border-b border-neutral-200">
                    <tr><th className="p-4">Employee Name</th><th className="p-4">Goal Title</th><th className="p-4">Planned</th><th className="p-4">Progress</th><th className="p-4">Manager Comment</th></tr>
                  </thead>
                  <tbody>
                    {filteredGoals.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-neutral-500">No active goals found for {selectedQuarter}.</td></tr>
                    ) : (
                      filteredGoals.map((g) => (
                        <tr key={g.id} className="border-b border-neutral-50 bg-white hover:bg-neutral-50">
                          <td className="p-4 font-medium">{g.employee?.full_name || "Unknown"}</td>
                          <td className="p-4 text-neutral-600 truncate max-w-[200px]">{g.title}</td>
                          <td className="p-4">{g.target_value}</td>
                          <td className="p-4 font-bold text-indigo-600">{g.progress || 0}%</td>
                          <td className="p-4">
                            {editingCommentId === g.id ? (
                              <div className="flex gap-2">
                                <input value={commentInputs[g.id] || ""} onChange={(e) => setCommentInputs({ ...commentInputs, [g.id]: e.target.value })} className="border rounded px-2 py-1 text-xs w-full" />
                                <Button size="sm" onClick={() => handleSaveComment(g.id)} className="h-7 text-xs">Save</Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-xs max-w-[200px] truncate">{g.manager_comment || "None"}</span>
                                <button onClick={() => { setEditingCommentId(g.id); setCommentInputs({ ...commentInputs, [g.id]: g.manager_comment || ""}); }} className="text-[10px] font-medium text-indigo-600 hover:underline">Edit</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
              <Card className="shadow-sm rounded-2xl p-6">
                <CardHeader className="p-0 mb-6"><CardTitle className="text-lg">Quarterly Trend</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <ChartContainer className="h-[250px] w-full" config={{ averageProgress: { color: "#4f46e5" } }}>
                    <LineChart data={trendData}><XAxis dataKey="quarter" /><YAxis domain={[0, 100]} /><Line dataKey="averageProgress" stroke="#4f46e5" /></LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-2xl p-6">
                <CardHeader className="p-0 mb-6"><CardTitle className="text-lg">Status Breakdown</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <ChartContainer className="h-[250px] w-full" config={{ completed: { color: "#10b981" }, onTrack: { color: "#4f46e5" }, behind: { color: "#f43f5e" } }}>
                    <BarChart data={breakdownData}><XAxis dataKey="name" /><YAxis /><Bar dataKey="completed" stackId="a" fill="#10b981" /><Bar dataKey="onTrack" stackId="a" fill="#4f46e5" /><Bar dataKey="behind" stackId="a" fill="#f43f5e" /></BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function Item({ icon: Icon, href, label, active, badge }: any) {
  return (
    <Link href={href} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${active ? "bg-indigo-600 text-white font-medium shadow-sm" : "text-white/70 hover:bg-white/10"}`}>
      <div className="flex items-center gap-3"><Icon size={18} /> {label}</div>
      {badge && <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full">{badge}</span>}
    </Link>
  );
}