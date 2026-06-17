"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings2,
  Share2,
  Target,
  UserCog,
  Users,
  Plus,
  X,
  Target as TargetIcon,
  Briefcase,
  Users2,
  ShieldAlert,
  Check,
  Filter
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { 
  getCurrentUserProfile, 
  getEmployees, 
  getSharedGoals, 
  createSharedGoal 
} from "@/services/sharedgoalservice";
import { getAdminReportData } from "@/services/reportservice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const getInitials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
};

const getTypeStyles = (type: string) => {
  const normalized = (type || "").toLowerCase();
  if (normalized === "all") return "bg-purple-50 text-purple-700 border-purple-200";
  if (normalized === "department") return "bg-blue-50 text-blue-700 border-blue-200";
  if (normalized === "employee") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

export default function SharedGoalsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [sharedGoals, setSharedGoals] = useState<any[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [quarterFilter, setQuarterFilter] = useState("All Quarters");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalDeptFilter, setModalDeptFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target: "",
    uom: "",
    type: "all",
    department: "",
    quarter: "Q1",
    selectedEmployeeIds: [] as string[],
    weightage: 10
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [userProfile, goalsResponse, employeesRes, reportRes] = await Promise.all([
        getCurrentUserProfile(),
        getSharedGoals(),
        getEmployees(),
        getAdminReportData(),
      ]);

      if (userProfile) setProfile(userProfile);

      const allProfiles = reportRes?.employees || [];
      const { data: goalsData } = goalsResponse?.data ? goalsResponse : await goalsResponse; 
      
      if (goalsData) {
        const enrichedGoals = goalsData.map((g: any) => {
          const owner = allProfiles.find((p: any) => p.id === g.primary_owner);
          return {
            ...g,
            assigner_name: owner?.full_name || "System Admin",
            assigner_role: owner?.role || "admin",
          };
        });
        setSharedGoals(enrichedGoals);
        setFilteredGoals(enrichedGoals);
      }

      if (employeesRes?.data) setEmployees(employeesRes.data);
    } catch (err) {
      console.error("Failed to load shared goals data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let result = sharedGoals;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => 
        (g.title && g.title.toLowerCase().includes(q)) || 
        (g.description && g.description.toLowerCase().includes(q))
      );
    }
    
    if (typeFilter !== "All Types") {
      result = result.filter(g => g.assignment_type?.toLowerCase() === typeFilter.toLowerCase());
    }

    if (quarterFilter !== "All Quarters") {
      result = result.filter(g => g.quarter === quarterFilter);
    }
    
    setFilteredGoals(result);
  }, [searchQuery, typeFilter, quarterFilter, sharedGoals]);

  // --- APPROVAL LOGIC ---
  const handleApproveAssignment = async (assignmentId: string, goalId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("shared_goal_assignments")
        .update({ status: "approved" })
        .eq("id", assignmentId);
      
      if (error) throw error;

      setSharedGoals(prev => prev.map(g => {
        if (g.id === goalId) {
           return {
              ...g,
              shared_goal_assignments: (g.shared_goal_assignments || []).map((a: any) => 
                 a.id === assignmentId ? { ...a, status: 'approved' } : a
              )
           };
        }
        return g;
      }));
    } catch (err) {
      alert("Failed to approve assignment.");
    }
  };

  const handleRejectAssignment = async (assignmentId: string, goalId: string) => {
    if (!rejectComment.trim()) return alert("Please provide a reason for declining.");
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("shared_goal_assignments")
        .update({ status: "rejected", rejection_reason: rejectComment })
        .eq("id", assignmentId);
      
      if (error) throw error;

      setSharedGoals(prev => prev.map(g => {
        if (g.id === goalId) {
           return {
              ...g,
              shared_goal_assignments: (g.shared_goal_assignments || []).map((a: any) => 
                 a.id === assignmentId ? { ...a, status: 'rejected', rejection_reason: rejectComment } : a
              )
           };
        }
        return g;
      }));
      setRejectingId(null);
      setRejectComment("");
    } catch (err) {
      alert("Failed to reject assignment.");
    }
  };

  // --- CREATE LOGIC ---
  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        target: formData.target,
        uom: formData.uom,
        type: formData.type,
        quarter: formData.quarter,
        department: formData.type === "department" ? formData.department : undefined,
        employees: formData.type === "employee" 
          ? employees.filter(emp => formData.selectedEmployeeIds.includes(emp.id))
          : [],
        weightage: formData.weightage
      };
      
      const result = await createSharedGoal(payload);
      if (result.error) {
        alert("Failed to create shared goal: " + result.error);
      } else {
        setIsCreateModalOpen(false);
        setFormData({ title: "", description: "", target: "", uom: "", type: "all", quarter: "Q1", department: "", selectedEmployeeIds: [], weightage: 10 });
        setModalDeptFilter("");
        loadData();
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const totalGoals = sharedGoals.length;
  const allOrgGoals = sharedGoals.filter(g => g.assignment_type === "all").length;
  const deptGoals = sharedGoals.filter(g => g.assignment_type === "department").length;
  const availableDepartments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  if (loading) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7fb] text-slate-500">Loading Shared Goals...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 flex w-full font-sans relative">
      <aside className={`shrink-0 min-h-screen bg-[#111115] text-white p-6 flex-col gap-8 w-64 fixed md:sticky top-0 z-40 transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full md:translate-x-0 md:flex hidden"}`}>
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
          <Link href="/admin/emp-management" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><Users className="size-4" /> Employee Management</Link>
          <Link href="/admin/manager-management" className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-sm font-medium flex px-4 py-3 items-center gap-3 transition-colors"><UserCog className="size-4" /> Manager Management</Link>
          <Link href="/admin/shared-goals" className="rounded-lg bg-blue-600 text-white text-sm font-medium flex px-4 py-3 items-center gap-3 shadow-lg shadow-blue-600/20"><Share2 className="size-4" /> Shared Goals</Link>
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

      {/* CREATE GOAL MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Create Shared Goal</h3>
                <p className="text-sm text-slate-500">Distribute a unified goal across the organization, department, or specific team members.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-lg transition-colors"><X className="size-5" /></button>
            </div>
            
            <form onSubmit={handleCreateGoal} className="overflow-y-auto p-6 flex flex-col gap-5">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Goal Details</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Goal Title *</label>
                  <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g., Increase Q3 Revenue" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Briefly describe the objective..." />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Quarter *</label>
                    <select required value={formData.quarter} onChange={(e) => setFormData({...formData, quarter: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      <option value="Q1">Q1</option>
                      <option value="Q2">Q2</option>
                      <option value="Q3">Q3</option>
                      <option value="Q4">Q4</option>
                      <option value="All Quarters">All Quarters</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Value *</label>
                    <input required type="number" value={formData.target} onChange={(e) => setFormData({...formData, target: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g., 1000000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">UOM *</label>
                    <input required type="text" value={formData.uom} onChange={(e) => setFormData({...formData, uom: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g., USD, %" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Weightage (%) *</label>
                  <input required type="number" min="10" max="100" value={formData.weightage} onChange={(e) => setFormData({...formData, weightage: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>
              
              <hr className="border-slate-100" />
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Assignment Scope</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To *</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value, department: "", selectedEmployeeIds: []})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                    <option value="all">Entire Organization</option>
                    <option value="department">Specific Department</option>
                    <option value="employee">Specific Employees</option>
                  </select>
                </div>
                
                {formData.type === "department" && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Department *</label>
                    <select required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      <option value="">Choose a department...</option>
                      {availableDepartments.map((dept: any, idx) => (<option key={`dept-${idx}`} value={dept}>{dept}</option>))}
                    </select>
                  </div>
                )}
                
                {formData.type === "employee" && (
                  <div className="animate-in fade-in slide-in-from-top-2 border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Filter Employees by Dept</label>
                      <select value={modalDeptFilter} onChange={(e) => setModalDeptFilter(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                        <option value="">All Departments</option>
                        {availableDepartments.map((dept: any, idx) => (<option key={`filter-dept-${idx}`} value={dept}>{dept}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Select Employees *</label>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 bg-white border border-slate-200 rounded-lg p-2">
                        {employees.filter(emp => !modalDeptFilter || emp.department === modalDeptFilter).map((emp, idx) => (
                            <label key={`emp-${emp.id || idx}`} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer border border-transparent hover:border-slate-100 transition-colors">
                              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" checked={formData.selectedEmployeeIds.includes(emp.id)} onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFormData(prev => ({...prev, selectedEmployeeIds: checked ? [...prev.selectedEmployeeIds, emp.id] : prev.selectedEmployeeIds.filter(id => id !== emp.id)}))
                                }}
                              />
                              <div className="flex flex-col"><span className="text-sm font-medium text-slate-900">{emp.full_name}</span><span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">{emp.department}</span></div>
                            </label>
                          ))}
                        {employees.filter(emp => !modalDeptFilter || emp.department === modalDeptFilter).length === 0 && (
                           <div className="p-4 text-center text-sm text-slate-400">No employees found in this department.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-auto">Cancel</button>
                <button type="submit" disabled={submitting || (formData.type === 'department' && !formData.department) || (formData.type === 'employee' && formData.selectedEmployeeIds.length === 0)} className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                  {submitting ? "Creating..." : "Deploy Shared Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="flex flex-col flex-1 min-w-0 overflow-auto">
        <div className="p-6 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-500"><Menu className="size-6" /></button>
              <div className="flex flex-col gap-1">
                <h1 className="font-bold text-2xl text-slate-900 font-serif">Shared Goals</h1>
                <p className="text-slate-500 text-sm">Create and monitor overarching goals distributed across teams</p>
              </div>
            </div>
            <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 w-full md:w-auto justify-center">
              <Plus className="size-4" /> Create Shared Goal
            </button>
          </header>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input type="text" placeholder="Search goals by title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow" />
            </div>
            <div className="relative w-full md:w-48">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow">
                <option value="All Types">All Scopes</option>
                <option value="all">Organization Wide</option>
                <option value="department">Department Level</option>
                <option value="employee">Specific Employees</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative w-full md:w-40">
              <select value={quarterFilter} onChange={(e) => setQuarterFilter(e.target.value)} className="w-full appearance-none pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow">
                <option value="All Quarters">All Quarters</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><TargetIcon className="size-6" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-sm font-medium">Total Shared Goals</span><span className="text-3xl font-bold font-serif text-slate-900">{totalGoals}</span></div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="size-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><Briefcase className="size-6" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-sm font-medium">Org-Wide Goals</span><span className="text-3xl font-bold font-serif text-purple-600">{allOrgGoals}</span></div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="size-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Users2 className="size-6" /></div>
              <div className="flex flex-col"><span className="text-slate-500 text-sm font-medium">Department Goals</span><span className="text-3xl font-bold font-serif text-emerald-600">{deptGoals}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-bold text-slate-800">Active Shared Goals</h2>
              <span className="text-sm text-slate-500">Showing 1–{Math.min(10, filteredGoals.length)} of {filteredGoals.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80">
                  <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Goal Title</th>
                    <th className="px-6 py-4">Assignment Scope</th>
                    <th className="px-6 py-4">Assigned By</th>
                    <th className="px-6 py-4 text-right">Target Value</th>
                    <th className="px-6 py-4">Status Summary</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGoals.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No shared goals found matching the filters.</td></tr>
                  ) : (
                    filteredGoals.map((goal, idx) => {
                      const assignments = goal.shared_goal_assignments || [];
                      const totalCount = assignments.length;
                      const submittedCount = assignments.filter((a: any) => a.status === 'submitted').length;
                      const approvedCount = assignments.filter((a: any) => a.status === 'approved').length;
                      const rejectedCount = assignments.filter((a: any) => a.status === 'rejected').length;

                      // Admin logic: Can only expand and act on goals assigned by admins, and only if there's a submission.
                      const isAdminAssigned = goal.primary_owner === profile?.id || goal.assigner_role === 'admin';
                      const canReview = isAdminAssigned && submittedCount > 0;
                      const isExpanded = expandedGoalId === goal.id;
                      
                      return (
                        <React.Fragment key={`goal-row-${goal.id || idx}`}>
                          <tr className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900">{goal.title}</span>
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[9px]">{goal.quarter || "N/A"}</Badge>
                                </div>
                                <span className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{goal.description || "No description provided"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTypeStyles(goal.assignment_type)}`}>
                                {goal.assignment_type === "all" ? "Organization" : goal.assignment_type}
                                {goal.assignment_type === "department" && goal.department && ` : ${goal.department}`}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {goal.assigner_role === "admin" ? (
                                  <><ShieldAlert className="size-4 text-blue-600" /><span className="text-sm font-semibold text-slate-900">System Admin</span></>
                                ) : (
                                  <div className="flex flex-col"><span className="text-sm font-semibold text-slate-900">{goal.assigner_name}</span><span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{goal.assigner_role}</span></div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex flex-col items-end">
                                 <span className="text-sm font-bold text-slate-700">{Number(goal.target_value).toLocaleString()}</span>
                                 <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{goal.uom_type}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] font-semibold">{totalCount} Assigned</Badge>
                                {submittedCount > 0 && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">{submittedCount} Submitted</Badge>}
                                {approvedCount > 0 && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">{approvedCount} Approved</Badge>}
                                {rejectedCount > 0 && <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold">{rejectedCount} Rejected</Badge>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {canReview ? (
                                <button 
                                  onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                                  className="text-sm font-semibold flex items-center justify-end gap-1 ml-auto text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  {isExpanded ? "Close" : "Review Submissions"} 
                                  <ChevronDown className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                </button>
                              ) : isAdminAssigned ? (
                                <span className="text-sm font-medium text-slate-400">No Submissions</span>
                              ) : (
                                <span className="text-sm font-medium text-slate-400">Manager Assigned</span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Assignments Area */}
                          {isExpanded && canReview && (
                            <tr className="bg-slate-50/50 border-b border-slate-200 shadow-inner">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-3xl ml-auto">
                                  <h4 className="font-semibold text-slate-800 text-sm mb-4">Pending Submissions Review</h4>
                                  <div className="flex flex-col gap-3">
                                    {assignments.filter((a:any) => a.status === 'submitted').length === 0 ? (
                                      <div className="text-sm text-slate-500 py-2">No pending submissions found.</div>
                                    ) : (
                                      assignments.filter((a:any) => a.status === 'submitted').map((a: any, aIdx: number) => (
                                        <div key={`assignment-${a.id || aIdx}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border border-slate-100 rounded-lg bg-slate-50/80">
                                          <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-sm text-slate-900">{a.employee?.full_name || 'Unknown Employee'}</span>
                                            <span className="text-xs text-slate-500">Progress achieved: <strong className="text-indigo-600 font-bold">{a.progress || 0}%</strong></span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                             {rejectingId === a.id ? (
                                                <div className="flex items-center gap-2">
                                                  <input 
                                                    type="text" 
                                                    value={rejectComment} 
                                                    onChange={e => setRejectComment(e.target.value)} 
                                                    placeholder="Reason..." 
                                                    className="text-xs px-2 py-1.5 border border-slate-200 rounded outline-none w-40 focus:border-blue-500"
                                                  />
                                                  <Button size="sm" onClick={() => handleRejectAssignment(a.id, goal.id)} className="bg-rose-600 hover:bg-rose-700 h-7 text-xs text-white px-3">Confirm</Button>
                                                  <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectComment("")}} className="h-7 text-xs">Cancel</Button>
                                                </div>
                                             ) : (
                                                <>
                                                  <Button size="sm" variant="outline" onClick={() => setRejectingId(a.id)} className="text-rose-600 border-rose-200 h-7 text-xs hover:bg-rose-50 px-3">Decline</Button>
                                                  <Button size="sm" onClick={() => handleApproveAssignment(a.id, goal.id)} className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs text-white px-3">
                                                    <Check className="size-3 mr-1"/> Approve
                                                  </Button>
                                                </>
                                             )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-sm text-slate-500 hidden sm:block">Showing 1–{Math.min(10, filteredGoals.length)} of {filteredGoals.length} goals</span>
              <div className="flex items-center gap-1 ml-auto sm:ml-0">
                <button className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">Previous</button>
                <button className="size-8 rounded-md bg-blue-600 text-white text-sm font-medium shadow-sm">1</button>
                <button className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}