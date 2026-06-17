"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  ChevronDown,
  Clock,
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
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { getCurrentUserProfile } from "@/services/sharedgoalservice";
import { getAdminReportData } from "@/services/reportservice";

const getInitials = (name: string) => {
  if (!name) return "M";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
};

const getDeptStyles = (dept: string) => {
  const normalized = (dept || "").toLowerCase();
  if (normalized.includes("engineering")) return "bg-blue-50 text-blue-600 border-blue-100";
  if (normalized.includes("sales")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (normalized.includes("hr") || normalized.includes("human")) return "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100";
  if (normalized.includes("finance")) return "bg-orange-50 text-orange-600 border-orange-100";
  if (normalized.includes("operations")) return "bg-teal-50 text-teal-600 border-teal-100";
  return "bg-slate-50 text-slate-600 border-slate-200";
};

const getProgressColor = (progress: number) => {
  if (progress >= 80) return "bg-emerald-500";
  if (progress >= 50) return "bg-amber-400";
  return "bg-slate-300";
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

export default function ManagerManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [managers, setManagers] = useState<any[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");

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
        
        const managersList = allProfiles.filter((p: any) => p.role === "manager");
        const employeesList = allProfiles.filter((p: any) => p.role === "employee");

        const augmentedData = managersList.map((mgr: any) => {
          const team = employeesList.filter((emp: any) => emp.manager_id === mgr.id);
          const teamIds = team.map(e => e.id);
          const teamSheets = sheets.filter((s: any) => teamIds.includes(s.employee_id));
          const pendingApprovals = teamSheets.filter((s: any) => s.submission_status === "submitted").length;
          const teamSheetIds = teamSheets.map(s => s.id);
          const teamGoals = goals.filter((g: any) => teamSheetIds.includes(g.goal_sheet_id));
          
          let totalProgress = 0;
          teamGoals.forEach((g: any) => { totalProgress += (g.progress || 0); });
          const avgProgress = teamGoals.length > 0 ? Math.round(totalProgress / teamGoals.length) : 0;

          const lastCheckin = teamGoals.reduce((latest: any, g: any) => {
            if (!g.updated_at) return latest;
            return !latest || new Date(g.updated_at) > new Date(latest) ? g.updated_at : latest;
          }, teamSheets.reduce((latest: any, s: any) => {
             if (!s.updated_at) return latest;
             return !latest || new Date(s.updated_at) > new Date(latest) ? s.updated_at : latest;
          }, null));

          return {
            ...mgr,
            teamSize: team.length,
            teamList: team,
            pendingApprovals,
            last_checkin: lastCheckin,
            avgProgress,
          };
        });

        augmentedData.sort((a, b) => b.teamSize - a.teamSize);
        setManagers(augmentedData);
        setFilteredManagers(augmentedData);
      }
    } catch (err) {
      console.error("Failed to load manager data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let result = managers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => (m.full_name && m.full_name.toLowerCase().includes(q)) || (m.email && m.email.toLowerCase().includes(q)));
    }
    if (deptFilter !== "All Departments") {
      result = result.filter(m => m.department === deptFilter);
    }
    setFilteredManagers(result);
  }, [searchQuery, deptFilter, managers]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const totalManagers = filteredManagers.length;
  const totalPendingApprovals = filteredManagers.reduce((sum, m) => sum + m.pendingApprovals, 0);
  const avgTeamSize = totalManagers > 0 ? (filteredManagers.reduce((sum, m) => sum + m.teamSize, 0) / totalManagers).toFixed(1) : "0";
  const departments = ["All Departments", ...Array.from(new Set(managers.map(m => m.department).filter(Boolean)))];

  if (loading) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7fb] text-slate-500">Loading Manager Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 flex w-full font-sans relative">
      <aside className={`shrink-0 min-h-screen bg-[#111115] text-white p-6 flex-col gap-8 w-64 fixed md:sticky top-0 z-40 transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full md:translate-x-0 md:flex hidden"}`}>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-blue-600 text-white flex justify-center items-center"><Target className="size-4" /></div>
          <div className="flex flex-col"><span className="font-bold text-sm tracking-wide">GoalPortal</span><span className="text-white/50 text-[10px] uppercase tracking-wider">Admin Console</span></div>
        </div>
        
        <nav className="flex flex-col gap-1.5 mt-4">
          <Link href="/admin/dashboard" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><LayoutDashboard className="size-4" /> Dashboard</Link>
          <Link href="/admin/cycles" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><CalendarClock className="size-4" /> Goal Cycles</Link>
          <Link href="/admin/emp-management" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><Users className="size-4" /> Employee Management</Link>
          <Link href="/admin/manager-management" className="rounded-lg bg-blue-600 text-white text-sm font-medium flex px-4 py-3 items-center gap-3 shadow-lg shadow-blue-600/20"><UserCog className="size-4" /> Manager Management</Link>
          <Link href="/admin/shared-goals" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><Share2 className="size-4" /> Shared Goals</Link>
          <Link href="/admin/goal-sheets" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><Settings2 className="size-4" /> Goal Sheets</Link>
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

      {selectedManager && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedManager.full_name}&apos;s Team</h3>
                <p className="text-sm text-slate-500">{selectedManager.teamList?.length} members</p>
              </div>
              <button onClick={() => setSelectedManager(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-lg transition-colors"><X className="size-5" /></button>
            </div>
            <div className="overflow-y-auto p-5 flex flex-col gap-3">
              {selectedManager.teamList?.length === 0 ? (
                <div className="text-center text-slate-500 py-8">No team members assigned to this manager.</div>
              ) : (
                selectedManager.teamList?.map((emp: any) => (
                  <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors">
                    <div className="size-10 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm flex items-center justify-center shrink-0">{getInitials(emp.full_name)}</div>
                    <div className="flex flex-col flex-1 min-w-0"><span className="text-sm font-semibold text-slate-900 truncate">{emp.full_name}</span><span className="text-xs text-slate-500 truncate">{emp.email}</span></div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium border ${getDeptStyles(emp.department)}`}>{emp.department || "N/A"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex flex-col flex-1 min-w-0 overflow-auto">
        <div className="p-6 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-500"><Menu className="size-6" /></button>
              <div className="flex flex-col gap-1">
                <h1 className="font-bold text-2xl text-slate-900 font-serif">Manager Management</h1>
                <p className="text-slate-500 text-sm">Manage managers, their teams, and approval responsibilities</p>
              </div>
            </div>
          </header>

          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input type="text" placeholder="Search by manager name or email" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow" />
            </div>
            <div className="relative w-full md:w-48">
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow">
                {departments.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><UserCog className="size-6" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-sm font-medium">Total Managers</span><span className="text-3xl font-bold font-serif text-slate-900">{totalManagers}</span></div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="size-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><Clock className="size-6" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-sm font-medium">Pending Approvals</span><span className="text-3xl font-bold font-serif text-amber-500">{totalPendingApprovals}</span></div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="size-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><Users className="size-6" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-sm font-medium">Avg Team Size</span><span className="text-3xl font-bold font-serif text-emerald-500">{avgTeamSize}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-bold text-slate-800">All Managers</h2>
              <span className="text-sm text-slate-500">Showing 1–{Math.min(8, filteredManagers.length)} of {filteredManagers.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80">
                  <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Manager Name</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 text-center">Team Size</th>
                    <th className="px-6 py-4 text-center">Pending Approvals</th>
                    <th className="px-6 py-4">Avg Team Progress</th>
                    <th className="px-6 py-4">Last Check-in</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredManagers.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No managers match your filters.</td></tr>
                  ) : (
                    filteredManagers.slice(0, 8).map((mgr) => (
                      <tr key={mgr.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">{getInitials(mgr.full_name)}</div>
                            <div className="flex flex-col"><span className="text-sm font-semibold text-slate-900">{mgr.full_name || "Unknown"}</span><span className="text-xs text-slate-500">{mgr.email}</span></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getDeptStyles(mgr.department)}`}>{mgr.department || "N/A"}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5 text-slate-600 font-medium text-sm"><Users className="size-3.5 text-slate-400" />{mgr.teamSize}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center justify-center size-6 rounded-full text-xs font-bold ${mgr.pendingApprovals > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{mgr.pendingApprovals}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(mgr.avgProgress)}`} style={{ width: `${Math.max(0, Math.min(100, mgr.avgProgress))}%` }} />
                            </div>
                            <span className="text-sm font-medium text-slate-700 w-8">{mgr.avgProgress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col text-sm text-slate-600"><span>{formatDate(mgr.last_checkin)}</span></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button onClick={() => setSelectedManager(mgr)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors">View Team</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-sm text-slate-500 hidden sm:block">Showing 1–{Math.min(8, filteredManagers.length)} of {filteredManagers.length} managers</span>
              <div className="flex items-center gap-1 ml-auto sm:ml-0">
                <button className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">Previous</button>
                <button className="size-8 rounded-md bg-blue-600 text-white text-sm font-medium shadow-sm">1</button>
                <button className="size-8 rounded-md hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors">2</button>
                <button className="size-8 rounded-md hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors">3</button>
                <span className="px-2 text-slate-400">...</span>
                <button className="size-8 rounded-md hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors">19</button>
                <button className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}