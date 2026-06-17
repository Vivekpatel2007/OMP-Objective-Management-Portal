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
  ScrollText,
  Users,
  ClipboardCheck,
  Loader2,
  LogOut,
  Filter
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
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Textarea } from "@/components/ui/textarea";
import {
  Bar,
  BarChart as RechartsBarChart,
  Line,
  LineChart as RechartsLineChart,
  CartesianGrid,
  XAxis,
  YAxis
} from "recharts";

// Real Services
import { getManagerCheckins, saveManagerComment } from "@/services/checkinservice";
import { getCurrentUserProfile } from "@/services/sharedgoalservice";

export default function TeamReportsPage() {
  const [mobile, setMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // Goals Data
  const [allGoals, setAllGoals] = useState<any[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<any[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("All");
  
  // Charts Data
  const [breakdownData, setBreakdownData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  // Comment Editing State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [savingComment, setSavingComment] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate filtered data & breakdown chart when quarter changes
  useEffect(() => {
    const filtered = selectedQuarter === "All" 
      ? allGoals 
      : allGoals.filter(g => g.quarter === selectedQuarter);
      
    setFilteredGoals(filtered);

    // Breakdown Chart Data (Per-Employee Goal Status based on FILTERED goals)
    const employeeStats: Record<string, any> = {};
    filtered.forEach((g: any) => {
      const empName = g.employee?.full_name?.split(" ")[0] || 'Unknown';
      if (!employeeStats[empName]) {
        employeeStats[empName] = { name: empName, completed: 0, onTrack: 0, behind: 0 };
      }

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
        getManagerCheckins()
      ]);

      setProfile(userRes);

      const fetchedGoals = checkinsRes?.data || [];
      setAllGoals(fetchedGoals);

      // Trend Data (Average progress by Quarter based on ALL goals to show history)
      const quarterStats: Record<string, { total: number, count: number }> = {
        "Q1": { total: 0, count: 0 },
        "Q2": { total: 0, count: 0 },
        "Q3": { total: 0, count: 0 },
        "Q4": { total: 0, count: 0 }
      };

      fetchedGoals.forEach((g: any) => {
        const q = g.quarter || "Q1";
        if (quarterStats[q]) {
          quarterStats[q].total += Number(g.progress || 0);
          quarterStats[q].count += 1;
        }
      });

      const trends = ["Q1", "Q2", "Q3", "Q4"].map(q => ({
        quarter: q,
        averageProgress: quarterStats[q].count > 0 
          ? Math.round(quarterStats[q].total / quarterStats[q].count) 
          : 0
      }));
      setTrendData(trends);

    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // --- EXPORT LOGIC ---
  const handleExport = (format: "csv" | "excel") => {
    if (!filteredGoals || filteredGoals.length === 0) {
      alert(`No data available to export for ${selectedQuarter}.`);
      return;
    }

    const headers = [
      "Employee Name", 
      "Quarter",
      "Goal Title", 
      "Planned Target", 
      "Actual Achievement", 
      "Progress (%)", 
      "Employee Comment", 
      "Manager Comment", 
      "Status"
    ];

    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      const stringified = String(str);
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    const rows = filteredGoals.map(g => [
      escapeCSV(g.employee?.full_name || "Unknown"),
      escapeCSV(g.quarter || "N/A"),
      escapeCSV(g.title),
      escapeCSV(`${g.target_value} ${g.uom_type || ''}`.trim()),
      escapeCSV(`${g.actual_achievement || 0} ${g.uom_type || ''}`.trim()),
      escapeCSV(g.progress || 0),
      escapeCSV(g.employee_comment || ""),
      escapeCSV(g.manager_comment || ""),
      escapeCSV(g.goal_status || "On Track")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const dateStr = new Date().toISOString().split('T')[0];
    const extension = format === "excel" ? "csv" : "csv"; 
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Team_Checkins_${selectedQuarter}_${dateStr}.${extension}`);
    
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
    } else {
      alert("Failed to save comment.");
    }
    setSavingComment(null);
  };

  const startEditing = (goal: any) => {
    setEditingCommentId(goal.id);
    setCommentInputs({ ...commentInputs, [goal.id]: goal.manager_comment || "" });
  };

  const getStatusBadge = (status?: string) => {
    const normalized = (status || "On Track").toLowerCase().replace(" ", "_");
    if (normalized === "completed") {
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none rounded-full px-3 font-semibold">Completed</Badge>;
    }
    if (normalized === "behind" || normalized === "at_risk") {
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none rounded-full px-3 font-semibold">Behind</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none rounded-full px-3 font-semibold">On Track</Badge>;
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FC]">
        <div className="flex flex-col items-center gap-2 text-indigo-600">
          <Loader2 className="size-8 animate-spin" />
          <span className="text-sm font-medium">Loading Team Reports...</span>
        </div>
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="bg-white px-5 py-4 border-b flex justify-between items-center z-10 shrink-0">
          <div className="flex gap-3 items-center">
            <button onClick={() => setMobile(!mobile)} className="md:hidden text-neutral-600">
              {mobile ? <X /> : <Menu />}
            </button>
            <div className="flex flex-col">
              <h1 className="font-semibold text-neutral-950 text-base">Team Reports</h1>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/notifications" className="relative text-neutral-500 hover:text-neutral-900 transition-colors">
              <Bell size={20} />
            </Link>
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

        {/* PAGE CONTENT */}
        <main className="p-4 md:p-8 overflow-auto flex-1">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <header className="flex flex-col gap-1.5">
                <h2 className="font-bold text-2xl text-neutral-900 tracking-tight">
                  Check-in Reviews
                </h2>
                <p className="text-neutral-500 text-sm">
                  Review quarterly goal progress and add manager feedback for the {profile?.department || "team"}.
                </p>
              </header>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button 
                  onClick={() => handleExport("csv")}
                  className="rounded-xl gap-2 flex-1 md:flex-none border-neutral-200 text-neutral-700 hover:bg-neutral-50" 
                  variant="outline"
                >
                  <FileDown className="size-4 text-neutral-500" /> Export CSV
                </Button>
                <Button 
                  onClick={() => handleExport("excel")}
                  className="rounded-xl gap-2 flex-1 md:flex-none border-neutral-200 text-neutral-700 hover:bg-neutral-50" 
                  variant="outline"
                >
                  <Table2 className="size-4 text-neutral-500" /> Export Excel
                </Button>
              </div>
            </div>

            {/* Quarter Filter and Table Card */}
            <Card className="shadow-sm rounded-2xl border-neutral-200/60 overflow-hidden flex flex-col">
              
              {/* Toolbar */}
              <div className="p-4 border-b border-neutral-100 bg-white flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-neutral-500" />
                  <span className="text-sm font-semibold text-neutral-700">Filter by Quarter:</span>
                </div>
                <div className="flex bg-neutral-100 rounded-lg p-1">
                  {["All", "Q1", "Q2", "Q3", "Q4"].map((q) => (
                    <button 
                      key={q} 
                      onClick={() => setSelectedQuarter(q)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        selectedQuarter === q 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-neutral-50/80 text-neutral-500 border-b border-neutral-200">
                    <tr>
                      <th className="font-medium p-4">Employee Name</th>
                      <th className="font-medium p-4">Quarter</th>
                      <th className="font-medium p-4">Goal Title</th>
                      <th className="font-medium p-4">Planned</th>
                      <th className="font-medium p-4">Actual</th>
                      <th className="font-medium p-4 w-[150px]">Progress</th>
                      <th className="font-medium p-4">Employee Comment</th>
                      <th className="font-medium p-4">Manager Comment</th>
                      <th className="font-medium p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    
                    {filteredGoals.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-neutral-500 bg-white">
                          No active goals found for {selectedQuarter === "All" ? "your team" : selectedQuarter}.
                        </td>
                      </tr>
                    ) : (
                      filteredGoals.map((g) => {
                        const isEditing = editingCommentId === g.id;
                        const progress = g.progress || 0;
                        const uom = g.uom_type || "";
                        
                        let progressColor = "bg-indigo-500";
                        if (progress >= 100) progressColor = "bg-emerald-500";
                        else if (progress < 40) progressColor = "bg-rose-500";

                        return (
                          <tr key={g.id} className="bg-white hover:bg-neutral-50/50 transition-colors">
                            <td className="p-4 font-medium text-neutral-900">
                              {g.employee?.full_name || "Unknown"}
                            </td>
                            <td className="p-4 text-neutral-500">
                              <Badge variant="outline" className="bg-neutral-50 text-neutral-600">{g.quarter || "N/A"}</Badge>
                            </td>
                            <td className="p-4 text-neutral-600 truncate max-w-[180px]" title={g.title}>
                              {g.title}
                            </td>
                            <td className="p-4 text-neutral-600">
                              {g.target_value} {uom}
                            </td>
                            <td className="p-4 font-medium text-neutral-900">
                              {g.actual_achievement || 0} {uom}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-full bg-neutral-100 w-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${progressColor}`} 
                                    style={{ width: `${progress}%` }} 
                                  />
                                </div>
                                <span className="text-xs font-medium text-neutral-600 w-8">{progress}%</span>
                              </div>
                            </td>
                            <td className="p-4 text-neutral-500 text-xs whitespace-normal min-w-[200px]">
                              {g.employee_comment || "No comment provided."}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <div className="flex flex-col gap-2 min-w-[220px]">
                                  <Textarea
                                    className="min-h-[60px] rounded-xl text-xs resize-none border-neutral-200 focus-visible:ring-indigo-500"
                                    placeholder="Add feedback..."
                                    value={commentInputs[g.id] || ""}
                                    onChange={(e) => setCommentInputs({ ...commentInputs, [g.id]: e.target.value })}
                                  />
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={() => handleSaveComment(g.id)}
                                      disabled={savingComment === g.id}
                                      className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white w-fit h-7 text-xs px-3" 
                                      size="sm"
                                    >
                                      {savingComment === g.id ? "Saving..." : "Save"}
                                    </Button>
                                    <Button 
                                      onClick={() => setEditingCommentId(null)}
                                      variant="ghost"
                                      className="rounded-lg text-neutral-500 h-7 text-xs px-3 hover:bg-neutral-100" 
                                      size="sm"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="min-w-[220px] whitespace-normal">
                                  {g.manager_comment ? (
                                    <div className="flex flex-col gap-1 items-start">
                                      <p className="text-xs text-neutral-700">{g.manager_comment}</p>
                                      <button 
                                        onClick={() => startEditing(g)}
                                        className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                                      >
                                        Edit Comment
                                      </button>
                                    </div>
                                  ) : (
                                    <Button 
                                      onClick={() => startEditing(g)}
                                      className="rounded-lg gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50" 
                                      size="sm" 
                                      variant="outline"
                                    >
                                      <MessageSquarePlus className="size-4" /> Add Feedback
                                    </Button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {getStatusBadge(g.goal_status)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination (Visual Only for now) */}
              <div className="flex justify-between items-center p-4 border-t border-neutral-100 bg-neutral-50/30">
                <div className="text-neutral-500 text-sm">
                  Showing <span className="font-medium text-neutral-900">1–{filteredGoals.length}</span> of <span className="font-medium text-neutral-900">{filteredGoals.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button className="rounded-lg border-neutral-200 text-neutral-600" size="icon" variant="outline" disabled>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 h-9 w-9 p-0">
                    1
                  </Button>
                  <Button className="rounded-lg border-neutral-200 text-neutral-600" size="icon" variant="outline" disabled>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
              
              {/* Trends Chart - Always shows ALL quarters */}
              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6 flex flex-col">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="font-semibold text-lg text-neutral-900">
                    Quarterly Progress Average
                  </CardTitle>
                  <CardDescription className="text-neutral-500 mt-1">
                    Average goal completion % across all quarters
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  {trendData.every(d => d.averageProgress === 0) ? (
                    <div className="w-full h-[250px] flex items-center justify-center text-neutral-400 text-sm border border-dashed rounded-xl">
                      Not enough data to map trends
                    </div>
                  ) : (
                    <ChartContainer
                      className="w-full h-[250px]"
                      config={{
                        averageProgress: { color: "#4f46e5", label: "Avg Progress %" }, 
                      }}
                    >
                      <RechartsLineChart
                        data={trendData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="quarter" tickLine={false} axisLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} dy={10} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} domain={[0, 100]} />
                        <ChartTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line dataKey="averageProgress" dot={{ r: 4, fill: "#4f46e5" }} stroke="#4f46e5" strokeWidth={3} type="monotone" />
                      </RechartsLineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Breakdown Chart - Matches Filter */}
              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6 flex flex-col">
                <CardHeader className="p-0 mb-6 flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="font-semibold text-lg text-neutral-900">
                      Goal Status Breakdown
                    </CardTitle>
                    <CardDescription className="text-neutral-500 mt-1">
                      Per-employee distribution for {selectedQuarter === "All" ? "all quarters" : selectedQuarter}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  {breakdownData.length === 0 ? (
                    <div className="w-full h-[250px] flex items-center justify-center text-neutral-400 text-sm border border-dashed rounded-xl">
                      No goal data available for {selectedQuarter}
                    </div>
                  ) : (
                    <>
                      <ChartContainer
                        className="w-full h-[250px]"
                        config={{
                          completed: { color: "#10b981", label: "Completed" }, 
                          onTrack: { color: "#4f46e5", label: "On Track" },   
                          behind: { color: "#f43f5e", label: "Behind" },      
                        }}
                      >
                        <RechartsBarChart
                          data={breakdownData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} dy={10} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} allowDecimals={false} />
                          <ChartTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#F3F4F6'}} />
                          <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={32} />
                          <Bar dataKey="onTrack" stackId="a" fill="#4f46e5" />
                          <Bar dataKey="behind" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                      </ChartContainer>

                      {/* Legend */}
                      <div className="flex flex-wrap justify-center items-center gap-6 mt-6">
                        <LegendItem color="bg-emerald-500" label="Completed" />
                        <LegendItem color="bg-indigo-600" label="On Track" />
                        <LegendItem color="bg-rose-500" label="Behind / At Risk" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F8F9FC;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E5E7EB;
          border-radius: 20px;
        }
      `}} />
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
          ? "bg-indigo-600 text-white font-medium shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        {label}
      </div>
      {badge && (
        <span className="min-w-[20px] font-semibold rounded-full bg-rose-500 text-white text-[10px] flex px-1.5 justify-center items-center h-5">
          {badge}
        </span>
      )}
    </Link>
  );
}

// Re-usable Legend Item Component
function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium">
      <span className={`size-2.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}