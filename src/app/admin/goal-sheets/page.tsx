"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Search,
  Settings2,
  Share2,
  Target,
  UserCog,
  Users,
  X
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { getAdminReportData } from "@/services/reportservice";
import { getCurrentUserProfile } from "@/services/sharedgoalservice";

const getInitials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
};

const getDeptStyles = (dept: string) => {
  return "bg-slate-100 text-slate-700 border-slate-200"; 
};

const getStatusStyles = (status: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "submitted" || normalized === "approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (normalized === "draft") return "bg-amber-100 text-amber-700 border-amber-200";
  if (normalized === "rejected") return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-500 border-slate-200"; 
};

const getProgressColor = (progress: number) => {
  if (progress >= 70) return "bg-blue-500"; 
  if (progress >= 30) return "bg-amber-500";
  return "bg-slate-300";
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return { top: "—", bottom: "" };
  const date = new Date(dateStr);
  const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  const year = date.getFullYear().toString();
  return { top: monthDay + ",", bottom: year };
};

export default function GoalSheetsAdministration() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [allSheets, setAllSheets] = useState<any[]>([]);
  const [filteredSheets, setFilteredSheets] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [managerFilter, setManagerFilter] = useState("All Managers");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("All Time"); 

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [userRes, reportRes] = await Promise.all([
        getCurrentUserProfile(),
        getAdminReportData(),
      ]);

      if (userRes) setProfile(userRes);

      if (reportRes) {
        const { employees: allProfiles = [], sheets = [], goals = [] } = reportRes;
        const leadershipList = allProfiles.filter((p: any) => p.role === "manager" || p.role === "admin");

        const enrichedSheets = sheets.map((sheet: any) => {
          const emp = allProfiles.find((p: any) => p.id === sheet.employee_id) || {};
          const manager = leadershipList.find((m: any) => m.id === emp.manager_id) || {};
          const sheetGoals = goals.filter((g: any) => g.goal_sheet_id === sheet.id);

          let totalProgress = 0;
          sheetGoals.forEach((g: any) => { totalProgress += (g.progress || 0); });
          const avgProgress = sheetGoals.length > 0 ? Math.round(totalProgress / sheetGoals.length) : 0;

          const lastUpdate = sheetGoals.reduce((latest: any, g: any) => {
            if (!g.updated_at) return latest;
            return !latest || new Date(g.updated_at) > new Date(latest) ? g.updated_at : latest;
          }, sheet.updated_at || sheet.created_at);

          const finalStatus = sheet.submission_status || "Not Started";

          return {
            ...sheet,
            employee_name: emp.full_name || "Unknown",
            employee_email: emp.email || "No email",
            department: emp.department || "Unassigned",
            manager_name: manager.full_name || "Unassigned",
            status: finalStatus,
            progress: avgProgress,
            last_update: lastUpdate,
            goals: sheetGoals 
          };
        });

        setAllSheets(enrichedSheets);
        setFilteredSheets(enrichedSheets);
      }
    } catch (err) {
      console.error("Failed to load goal sheets data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let result = allSheets;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.employee_name.toLowerCase().includes(q) || s.employee_email.toLowerCase().includes(q));
    }
    if (deptFilter !== "All Departments") {
      result = result.filter(s => s.department === deptFilter);
    }
    if (managerFilter !== "All Managers") {
      result = result.filter(s => s.manager_name === managerFilter);
    }
    if (statusFilter !== "All Statuses") {
      if (statusFilter === "Submitted") result = result.filter(s => s.status === "submitted" || s.status === "approved");
      if (statusFilter === "Draft") result = result.filter(s => s.status === "draft");
      if (statusFilter === "Not Started") result = result.filter(s => s.status === "Not Started");
      if (statusFilter === "Rejected") result = result.filter(s => s.status === "rejected");
    }
    if (dateFilter !== "All Time") {
      const now = new Date();
      let cutoffDate = new Date();
      if (dateFilter === "Last 7 Days") cutoffDate.setDate(now.getDate() - 7);
      else if (dateFilter === "Last 30 Days") cutoffDate.setDate(now.getDate() - 30);
      else if (dateFilter === "Last 3 Months") cutoffDate.setMonth(now.getMonth() - 3);
      result = result.filter(s => new Date(s.last_update) >= cutoffDate);
    }
    setFilteredSheets(result);
  }, [searchQuery, deptFilter, managerFilter, statusFilter, dateFilter, allSheets]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const totalCount = allSheets.length;
  const submittedCount = allSheets.filter(s => s.status === "submitted" || s.status === "approved").length;
  const inReviewCount = allSheets.filter(s => s.status === "submitted").length;
  const needsAttentionCount = allSheets.filter(s => s.status === "rejected" || s.status === "Not Started").length;

  const departments = ["All Departments", ...Array.from(new Set(allSheets.map(s => s.department).filter(Boolean)))];
  const managers = ["All Managers", ...Array.from(new Set(allSheets.map(s => s.manager_name).filter(Boolean)))];

  if (loading) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7fb] text-slate-500">Loading Goal Sheets...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 flex w-full font-sans relative">
      <aside className={`shrink-0 min-h-screen bg-[#111115] text-white p-6 flex-col gap-8 w-64 fixed md:sticky top-0 z-40 transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full md:translate-x-0 md:flex hidden"}`}>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-slate-800 text-white flex justify-center items-center border border-slate-700">
            <Target className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide">GoalPortal</span>
            <span className="text-white/50 text-[10px] uppercase tracking-wider">Admin Console</span>
          </div>
        </div>
        
        <nav className="flex flex-col gap-1.5 mt-4">
          <Link href="/admin/dashboard" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><LayoutDashboard className="size-4" /> Dashboard</Link>
          <Link href="/admin/cycles" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><CalendarClock className="size-4" /> Goal Cycles</Link>
          <Link href="/admin/emp-management" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><Users className="size-4" /> Employee Management</Link>
          <Link href="/admin/manager-management" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><UserCog className="size-4" /> Manager Management</Link>
          <Link href="/admin/shared-goals" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><Share2 className="size-4" /> Shared Goals</Link>
          <Link href="/admin/goal-sheets" className="rounded-lg bg-white/10 text-white text-sm font-medium flex px-4 py-3 items-center gap-3"><Settings2 className="size-4" /> Goal Sheets</Link>
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <button onClick={handleLogout} className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-rose-400 text-sm font-medium flex px-4 py-2 items-center gap-3 transition-colors w-full text-left">
            <LogOut className="size-4" /> Sign Out
          </button>
          <div className="rounded-xl bg-[#1a1a21] border border-white/5 flex p-3 items-center gap-3">
            <div className="size-9 font-bold rounded-full bg-blue-600 text-white text-xs flex justify-center items-center">
              {profile?.full_name ? getInitials(profile.full_name) : "AD"}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="font-semibold text-sm text-white truncate">{profile?.full_name || "System Admin"}</span>
              <span className="text-slate-400 text-xs truncate capitalize">{profile?.role || "HR Admin"}</span>
            </div>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      {/* Changed <main> to flow naturally without h-screen blocking scrolling */}
      <main className="flex flex-col flex-1 min-w-0 overflow-auto">
        <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          <header className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div className="flex items-start gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-500 mt-1"><Menu className="size-6" /></button>
              <div className="flex flex-col gap-1">
                <h1 className="font-bold text-3xl text-slate-900 tracking-tight">Goal Sheets</h1>
                <p className="text-slate-500 text-sm">View every employee goal sheet and inspect full details, progress, and approvals.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white" />
                <input type="text" placeholder="Find Sheet" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-[#1a1a1a] text-white placeholder-slate-400 border border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-shadow" />
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><FileText className="size-5" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total Goal Sheets</span><span className="text-2xl font-bold text-slate-900">{totalCount}</span></div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0"><CheckCircle2 className="size-5" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Submitted</span><span className="text-2xl font-bold text-emerald-600">{submittedCount}</span></div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0"><Clock className="size-5" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-xs font-medium uppercase tracking-wider">In Review</span><span className="text-2xl font-bold text-amber-500">{inReviewCount}</span></div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="size-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0"><AlertCircle className="size-5" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Needs Attention</span><span className="text-2xl font-bold text-rose-500">{needsAttentionCount}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg text-slate-900">All Goal Sheets</h2>
                  <p className="text-sm text-slate-500">Browse sheets, status, and open the full record from the details panel.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    {departments.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)} className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    {managers.map(m => <option key={m as string} value={m as string}>{m as string}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="All Statuses">Review Stage: All</option>
                    <option value="Submitted">Submitted / Review</option>
                    <option value="Draft">Draft</option>
                    <option value="Not Started">Not Started</option>
                    <option value="Rejected">Needs Attention</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="All Time">Date: All Time</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 3 Months">Last 3 Months</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Reporting Manager</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4 text-right">Last Update</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSheets.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No goal sheets match your criteria.</td></tr>
                  ) : (
                    filteredSheets.map((sheet) => {
                      const dateParts = formatDate(sheet.last_update);
                      return (
                        <tr key={sheet.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`size-10 rounded-full font-bold text-sm flex items-center justify-center text-white shadow-sm ${sheet.employee_name.includes("Riya") ? "bg-blue-600" : sheet.employee_name.includes("Arjun") ? "bg-purple-600" : sheet.employee_name.includes("Priya") ? "bg-emerald-600" : sheet.employee_name.includes("Karan") ? "bg-rose-600" : "bg-teal-600"}`}>
                                {getInitials(sheet.employee_name)}
                              </div>
                              <div className="flex flex-col"><span className="text-sm font-bold text-slate-900">{sheet.employee_name}</span><span className="text-xs text-slate-500">{sheet.employee_email}</span></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getDeptStyles(sheet.department)}`}>{sheet.department}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap"><div className="flex flex-col text-sm font-medium text-slate-700"><span>{sheet.manager_name.split(" ")[0]}</span><span>{sheet.manager_name.split(" ").slice(1).join(" ")}</span></div></td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${getStatusStyles(sheet.status)}`}>{sheet.status === "approved" ? "Approved" : sheet.status === "submitted" ? "Submitted" : sheet.status}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(sheet.progress)}`} style={{ width: `${Math.max(0, Math.min(100, sheet.progress))}%` }} />
                              </div>
                              <span className="text-sm font-medium text-slate-600 w-8">{sheet.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right"><div className="flex flex-col text-xs text-slate-500"><span>{dateParts.top}</span><span>{dateParts.bottom}</span></div></td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button onClick={() => setSelectedSheet(sheet)} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"><Eye className="size-4" /> View</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedSheet && (
          <>
            <div className="fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedSheet(null)} />
            <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-xl text-slate-900">Goal Sheet Details</h3>
                  <p className="text-sm text-slate-500">Open objectives and active metrics.</p>
                </div>
                <button onClick={() => setSelectedSheet(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="size-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                <div className="flex items-center gap-4 bg-white border border-slate-100 shadow-sm p-4 rounded-xl">
                  <div className="size-12 rounded-full font-bold text-lg flex items-center justify-center text-white bg-blue-600 shadow-sm">{getInitials(selectedSheet.employee_name)}</div>
                  <div className="flex flex-col"><span className="font-bold text-slate-900">{selectedSheet.employee_name}</span><span className="text-sm text-slate-500">{selectedSheet.employee_email}</span></div>
                  <div className="ml-auto"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${getStatusStyles(selectedSheet.status)}`}>{selectedSheet.status}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Manager</span><span className="font-semibold text-slate-800 text-sm">{selectedSheet.manager_name}</span></div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overall Progress</span><span className="font-semibold text-blue-600 text-lg">{selectedSheet.progress}%</span></div>
                </div>
                <hr className="border-slate-100" />
                <div className="flex flex-col gap-4">
                  <h4 className="font-bold text-slate-900">Objectives ({selectedSheet.goals?.length || 0})</h4>
                  {selectedSheet.goals?.length === 0 ? (
                    <div className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-lg">No goals have been added to this sheet yet.</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {selectedSheet.goals.map((goal: any) => (
                        <div key={goal.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                          <div className="flex justify-between items-start mb-2"><span className="font-semibold text-slate-800 text-sm pr-4">{goal.title}</span><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0">W: {goal.weightage}%</span></div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-2"><span>Target: {goal.target_value} {goal.uom_type}</span><span>{goal.progress || 0}% Complete</span></div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(goal.progress || 0)}`} style={{ width: `${Math.max(0, Math.min(100, goal.progress || 0))}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 bg-white"><button onClick={() => setSelectedSheet(null)} className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors">Close Details</button></div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}