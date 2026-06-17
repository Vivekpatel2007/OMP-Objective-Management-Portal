"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  ChevronDown,
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
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { getCurrentUserProfile } from "@/services/sharedgoalservice";
import { getAdminReportData } from "@/services/reportservice";

const getInitials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
};

const getDeptStyles = (dept: string) => {
  const normalized = (dept || "").toLowerCase();
  if (normalized.includes("engineering")) return "bg-blue-50 text-blue-600 border-blue-100";
  if (normalized.includes("sales")) return "bg-orange-50 text-orange-600 border-orange-100";
  if (normalized.includes("hr") || normalized.includes("human")) return "bg-pink-50 text-pink-600 border-pink-100";
  if (normalized.includes("finance")) return "bg-yellow-50 text-yellow-700 border-yellow-100";
  return "bg-slate-50 text-slate-600 border-slate-200";
};

const getStatusStyles = (status: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "submitted" || normalized === "approved") return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (normalized === "draft" || normalized === "rejected") return "bg-amber-50 text-amber-600 border-amber-100";
  return "bg-slate-50 text-slate-500 border-slate-200";
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

export default function EmployeeManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

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
        
        const employeeList = allProfiles.filter((p: any) => p.role === "employee");
        const managersList = allProfiles.filter((p: any) => p.role === "manager");

        const augmentedData = employeeList.map((emp: any) => {
          const sheet = sheets.find((s: any) => s.employee_id === emp.id);
          const empGoals = sheet ? goals.filter((g: any) => g.goal_sheet_id === sheet.id) : [];
          
          let totalProgress = 0;
          empGoals.forEach((g: any) => { totalProgress += (g.progress || 0); });
          const avgProgress = empGoals.length > 0 ? Math.round(totalProgress / empGoals.length) : 0;

          const lastCheckin = empGoals.reduce((latest: any, g: any) => {
            if (!g.updated_at) return latest;
            return !latest || new Date(g.updated_at) > new Date(latest) ? g.updated_at : latest;
          }, sheet?.updated_at || null);

          const manager = managersList.find((m: any) => m.id === emp.manager_id);

          return {
            ...emp,
            sheet_status: sheet?.submission_status || "Not Started",
            progress: avgProgress,
            last_checkin: lastCheckin,
            manager_name: manager ? manager.full_name : "Unassigned",
          };
        });

        setEmployees(augmentedData);
        setFilteredEmployees(augmentedData);
      }
    } catch (err) {
      console.error("Failed to load employee data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let result = employees;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        (e.full_name && e.full_name.toLowerCase().includes(q)) || 
        (e.email && e.email.toLowerCase().includes(q))
      );
    }
    if (deptFilter !== "All Departments") {
      result = result.filter(e => e.department === deptFilter);
    }
    if (statusFilter !== "All Statuses") {
      if (statusFilter === "Submitted") result = result.filter(e => e.sheet_status === "submitted");
      if (statusFilter === "Draft") result = result.filter(e => e.sheet_status === "draft");
      if (statusFilter === "Not Started") result = result.filter(e => e.sheet_status === "Not Started");
    }
    setFilteredEmployees(result);
  }, [searchQuery, deptFilter, statusFilter, employees]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const totalEmployees = employees.length;
  const activeCount = employees.filter(e => e.is_active !== false).length; 
  const inactiveCount = totalEmployees - activeCount;
  const departments = ["All Departments", ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];

  if (loading) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7fb] text-slate-500">Loading Employee Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 flex w-full font-sans">
      <aside className={`shrink-0 min-h-screen bg-[#111115] text-white p-6 flex-col gap-8 w-64 fixed md:sticky top-0 z-50 transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full md:translate-x-0 md:flex hidden"}`}>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-blue-600 text-white flex justify-center items-center">
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
          <Link href="/admin/emp-management" className="rounded-lg bg-blue-600 text-white text-sm font-medium flex px-4 py-3 items-center gap-3 shadow-lg shadow-blue-600/20"><Users className="size-4" /> Employee Management</Link>
          <Link href="/admin/manager-management" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><UserCog className="size-4" /> Manager Management</Link>
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

      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      <main className="flex flex-col flex-1 min-w-0 overflow-auto">
        <div className="p-6 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-500"><Menu className="size-6" /></button>
              <div className="flex flex-col gap-1">
                <h1 className="font-bold text-2xl text-slate-900 font-serif">Employee Management</h1>
                <p className="text-slate-500 text-sm">View and manage all employees in the organization</p>
              </div>
            </div>
          </header>

          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input type="text" placeholder="Search by name or email" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow" />
            </div>
            <div className="relative w-full md:w-48">
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow">
                {departments.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative w-full md:w-48">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow">
                <option value="All Statuses">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Draft">Draft</option>
                <option value="Not Started">Not Started</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Users className="size-6" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-sm font-medium">Total Employees</span><span className="text-3xl font-bold font-serif text-slate-900">{totalEmployees}</span></div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="size-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><UserCog className="size-6" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-sm font-medium">Active</span><span className="text-3xl font-bold font-serif text-emerald-600">{activeCount}</span></div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="size-12 rounded-full bg-red-50 flex items-center justify-center text-red-500"><LogOut className="size-6" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-sm font-medium">Inactive</span><span className="text-3xl font-bold font-serif text-red-500">{inactiveCount}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-bold text-slate-800">All Employees</h2>
              <span className="text-sm text-slate-500">Showing 1–{Math.min(8, filteredEmployees.length)} of {filteredEmployees.length}</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80">
                  <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Employee Name</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Reporting Manager</th>
                    <th className="px-6 py-4">Goal Sheet Status</th>
                    <th className="px-6 py-4">Goal Progress</th>
                    <th className="px-6 py-4">Last Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No employees match your filters.</td></tr>
                  ) : (
                    filteredEmployees.slice(0, 8).map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">{getInitials(emp.full_name)}</div>
                            <div className="flex flex-col"><span className="text-sm font-semibold text-slate-900">{emp.full_name || "Unknown"}</span><span className="text-xs text-slate-500">{emp.email}</span></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getDeptStyles(emp.department)}`}>{emp.department || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-slate-700">{emp.manager_name}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusStyles(emp.sheet_status)}`}>{emp.sheet_status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${emp.progress > 70 ? 'bg-emerald-500' : emp.progress > 30 ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${Math.max(0, Math.min(100, emp.progress))}%` }} />
                            </div>
                            <span className="text-sm font-medium text-slate-700 w-8">{emp.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col text-sm text-slate-600"><span>{formatDate(emp.last_checkin)}</span></div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-sm text-slate-500 hidden sm:block">Showing 1–{Math.min(8, filteredEmployees.length)} of {filteredEmployees.length} employees</span>
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