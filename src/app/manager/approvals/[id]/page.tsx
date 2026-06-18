"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  CheckCircle,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  MessageSquareX,
  Target,
  Users,
  X,
  Check,
  Clock,
  History,
  LogOut,
  Layers,
  Eye
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Import real services
import { getCurrentUserProfile } from "@/services/sharedgoalservice";
import { 
  getSubmittedGoalSheets, 
  approveGoalSheet, 
  rejectGoalSheet,
  getSubmittedSharedGoals,
  approveSharedGoal,
  rejectSharedGoal,
  getGoalSheetDetails // Make sure this is imported
} from "@/services/managerservice";

export default function ManagerApprovals() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mobile, setMobile] = useState(false);
  
  const [viewCategory, setViewCategory] = useState<"sheets" | "shared">("sheets");
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending");
  
  const [allSheets, setAllSheets] = useState<any[]>([]);
  const [allShared, setAllShared] = useState<any[]>([]);
  
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  // Modal State
  const [viewingSheetId, setViewingSheetId] = useState<string | null>(null);
  const [sheetDetails, setSheetDetails] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [userRes, sheetsRes, sharedRes] = await Promise.all([
        getCurrentUserProfile(),
        getSubmittedGoalSheets().catch(() => ({ data: [] })),
        getSubmittedSharedGoals().catch(() => ({ data: [] }))
      ]);

      setProfile(userRes || null);
      setAllSheets(sheetsRes?.data || []);
      setAllShared(sharedRes?.data || []);
    } catch (err) {
      console.error("Failed to load approvals:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const handleApproveSheet = async (sheetId: string) => {
    const res = await approveGoalSheet(sheetId);
    if (!res?.error) {
      setAllSheets(prev => prev.map(s => s.id === sheetId ? { ...s, submission_status: "approved" } : s));
    } else alert("Failed to approve goal sheet.");
  };

  const handleRejectSheet = async (sheetId: string) => {
    if (!rejectComment.trim()) return alert("Please provide a reason for declining.");
    const res = await rejectGoalSheet(sheetId, rejectComment);
    if (!res?.error) {
      setAllSheets(prev => prev.map(s => s.id === sheetId ? { ...s, submission_status: "rejected", rejection_reason: rejectComment } : s));
      setRejectingId(null);
      setRejectComment("");
    } else alert("Failed to decline goal sheet.");
  };

  const handleApproveShared = async (assignmentId: string) => {
    const res = await approveSharedGoal(assignmentId);
    if (!res?.error) {
      setAllShared(prev => prev.map(s => s.id === assignmentId ? { ...s, status: "approved" } : s));
    } else alert("Failed to approve shared goal.");
  };

  const handleRejectShared = async (assignmentId: string) => {
    if (!rejectComment.trim()) return alert("Please provide a reason for declining.");
    const res = await rejectSharedGoal(assignmentId, rejectComment);
    if (!res?.error) {
      setAllShared(prev => prev.map(s => s.id === assignmentId ? { ...s, status: "rejected", rejection_reason: rejectComment } : s));
      setRejectingId(null);
      setRejectComment("");
    } else alert("Failed to decline shared goal.");
  };

  const handleViewDetails = async (sheetId: string) => {
    setViewingSheetId(sheetId);
    const res = await getGoalSheetDetails(sheetId);
    if (!res.error) {
      setSheetDetails(res);
    }
  };

  const closeDetailsModal = () => {
    setViewingSheetId(null);
    setSheetDetails(null);
  };

  const pendingSheets = allSheets.filter(s => s.submission_status === "submitted");
  const reviewedSheets = allSheets.filter(s => s.submission_status === "approved" || s.submission_status === "rejected");
  const displayedSheets = activeTab === "pending" ? pendingSheets : reviewedSheets;

  const pendingShared = allShared.filter(s => s.status === "submitted");
  const reviewedShared = allShared.filter(s => s.status === "approved" || s.status === "rejected");
  const displayedShared = activeTab === "pending" ? pendingShared : reviewedShared;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FC] text-neutral-500 font-medium">
        Loading Approvals...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FC] w-full overflow-hidden relative">
      <aside className={`fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition-transform duration-200 shrink-0 ${mobile ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 flex flex-col`}>
        <div className="p-5 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-indigo-600 text-white flex justify-center items-center shrink-0"><Target className="size-5" /></div>
          <div className="flex flex-col text-white"><span className="leading-tight font-bold text-sm">GoalTrack</span><span className="leading-tight text-white/50 text-xs">Manager Portal</span></div>
        </div>
        <nav className="space-y-2 px-3 flex-1 mt-4">
          <Item icon={LayoutDashboard} href="/manager/dashboard" label="Dashboard" />
          <Item icon={CheckCircle} href="/manager/approvals" label="Approvals" active badge={(pendingSheets.length + pendingShared.length) > 0 ? (pendingSheets.length + pendingShared.length) : undefined} />
          <Item icon={ClipboardCheck} href="/manager/checkins" label="Check-ins" />
          <Item icon={Users} href="/manager/shared-goals" label="Shared Goals" />
          <div className="pt-4 mt-4 border-t border-white/10">
            <button onClick={handleSignOut} className="flex w-full gap-3 px-4 py-3 rounded-xl transition text-white/70 hover:bg-rose-500/10 hover:text-rose-500 text-left items-center text-sm">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 w-full">
        <header className="bg-white px-4 md:px-5 py-4 border-b flex justify-between items-center z-10 shrink-0">
          <div className="flex gap-3 items-center">
            <button onClick={() => setMobile(!mobile)} className="md:hidden text-neutral-600 hover:text-neutral-900"><Menu size={24} /></button>
            <h1 className="font-semibold text-neutral-950 text-base md:text-lg truncate">Approvals Center</h1>
          </div>
          <div className="flex gap-4 items-center shrink-0">
            <Link href="/notifications" className="relative text-neutral-500 hover:text-neutral-900 transition-colors"><Bell size={20} /></Link>
            <div className="flex items-center gap-3 border-l pl-4 hidden sm:flex">
              <div className="flex flex-col items-end">
                <span className="leading-none font-semibold text-sm truncate max-w-[120px]">{profile?.full_name || "Manager"}</span>
                <span className="text-neutral-500 text-xs truncate max-w-[120px]">{profile?.department || "Department"}</span>
              </div>
              <div className="size-8 font-semibold rounded-full bg-indigo-100 text-indigo-700 text-xs flex justify-center items-center shrink-0">
                {profile?.full_name?.substring(0, 2).toUpperCase() || "MG"}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 overflow-y-auto flex-1 w-full custom-scrollbar">
          <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-1 min-w-0">
              <h2 className="font-semibold text-xl leading-7 tracking-tight text-neutral-900 truncate">Pending Approvals — {profile?.department || "Your Team"}</h2>
              <p className="text-neutral-500 text-sm leading-5 truncate">Review, approve, or decline employee goals and progress check-ins.</p>
            </div>

            <div className="flex bg-neutral-100/80 p-1 rounded-xl w-fit border border-neutral-200/60">
              <button onClick={() => setViewCategory("sheets")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${viewCategory === "sheets" ? "bg-white text-indigo-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                <Layers size={16} /> Goal Sheets
                {pendingSheets.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingSheets.length}</span>}
              </button>
              <button onClick={() => setViewCategory("shared")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${viewCategory === "shared" ? "bg-white text-indigo-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                <Users size={16} /> Shared Goals
                {pendingShared.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingShared.length}</span>}
              </button>
            </div>

            <div className="border-neutral-200 border-b flex items-center gap-6 overflow-x-auto no-scrollbar w-full mt-2">
              <button onClick={() => setActiveTab("pending")} className={`text-sm leading-5 pb-3 px-1 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === "pending" ? "text-indigo-600 font-medium border-b-2 border-indigo-600" : "text-neutral-500 hover:text-neutral-900"}`}><Clock className="size-4" /> Pending Review</button>
              <button onClick={() => setActiveTab("reviewed")} className={`text-sm leading-5 pb-3 px-1 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === "reviewed" ? "text-indigo-600 font-medium border-b-2 border-indigo-600" : "text-neutral-500 hover:text-neutral-900"}`}><History className="size-4" /> Past Reviews</button>
            </div>

            <Card className="w-full overflow-hidden shadow-sm rounded-2xl border-neutral-200/60 p-0">
              <div className="w-full overflow-x-auto no-scrollbar">
                <table className="text-sm leading-5 w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200/60 text-neutral-500">
                      <th className="font-medium text-left px-5 py-3 whitespace-nowrap">Employee</th>
                      {viewCategory === "shared" && <th className="font-medium text-left px-5 py-3 whitespace-nowrap">Goal Detail</th>}
                      <th className="font-medium text-left px-5 py-3 whitespace-nowrap">{viewCategory === "shared" ? "Progress" : "Submitted Date"}</th>
                      <th className="font-medium text-left px-5 py-3 whitespace-nowrap">Status</th>
                      <th className="font-medium text-right px-5 py-3">Actions / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewCategory === "sheets" && (
                      displayedSheets.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-12 text-neutral-500"><CheckCircle className="size-8 text-neutral-300 mx-auto mb-3" /> {activeTab === "pending" ? "No pending goal sheets." : "No reviewed goal sheets found."}</td></tr>
                      ) : (
                        displayedSheets.map((sheet, idx) => (
                          <tr key={sheet.id} className={`border-b border-neutral-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                            <td className="px-5 py-4 font-medium text-neutral-900 whitespace-nowrap">{sheet.employee?.full_name || "Employee ID: " + sheet.employee_id}</td>
                            <td className="px-5 py-4 text-neutral-500 whitespace-nowrap">{new Date(sheet.updated_at || sheet.created_at).toLocaleDateString()}</td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              {sheet.submission_status === "submitted" && <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending Review</Badge>}
                              {sheet.submission_status === "approved" && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approved</Badge>}
                              {sheet.submission_status === "rejected" && <Badge className="bg-rose-100 text-rose-700 border-rose-200">Declined</Badge>}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-3">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewDetails(sheet.id)}
                                  className="h-8 text-xs bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                  <Eye className="size-3.5 mr-1.5" />
                                  View Goals
                                </Button>
                                
                                {activeTab === "pending" ? (
                                  <>
                                    {rejectingId === sheet.id ? (
                                      <div className="flex flex-col gap-2 w-full max-w-sm ml-auto">
                                        <textarea className="flex min-h-[60px] w-full rounded-md border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="Reason for declining..." value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} />
                                        <div className="flex justify-end gap-2">
                                          <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectComment(""); }} className="h-7 text-xs">Cancel</Button>
                                          <Button size="sm" onClick={() => handleRejectSheet(sheet.id)} className="h-7 text-xs bg-rose-600 hover:bg-rose-700">Decline</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <Button onClick={() => setRejectingId(sheet.id)} variant="outline" size="sm" className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50 bg-white"><MessageSquareX className="size-3.5 mr-1" /> Decline</Button>
                                        <Button onClick={() => handleApproveSheet(sheet.id)} size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="size-3.5 mr-1" /> Approve</Button>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex justify-end">{sheet.submission_status === "rejected" && sheet.rejection_reason ? <span className="text-xs text-neutral-500 italic max-w-xs text-right truncate">Note: {sheet.rejection_reason}</span> : <span className="text-xs text-neutral-400">No notes</span>}</div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )
                    )}

                    {viewCategory === "shared" && (
                      displayedShared.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-12 text-neutral-500"><CheckCircle className="size-8 text-neutral-300 mx-auto mb-3" />{activeTab === "pending" ? "No pending shared goal submissions." : "No reviewed shared goals found."}</td></tr>
                      ) : (
                        displayedShared.map((sg, idx) => (
                          <tr key={sg.id} className={`border-b border-neutral-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                            <td className="px-5 py-4 font-medium text-neutral-900 whitespace-nowrap">{sg.employee?.full_name || "Employee ID: " + sg.employee_id}</td>
                            <td className="px-5 py-4 whitespace-nowrap"><div className="font-semibold text-neutral-900 max-w-[200px] truncate">{sg.shared_goals?.title}</div><div className="text-xs text-neutral-500">Target: {sg.shared_goals?.target_value}</div></td>
                            <td className="px-5 py-4 whitespace-nowrap font-semibold text-indigo-600">{sg.progress || 0}%</td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              {sg.status === "submitted" && <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending Review</Badge>}
                              {sg.status === "approved" && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approved</Badge>}
                              {sg.status === "rejected" && <Badge className="bg-rose-100 text-rose-700 border-rose-200">Declined</Badge>}
                            </td>
                            <td className="px-5 py-4">
                              {activeTab === "pending" ? (
                                <div className="flex items-center justify-end gap-3">
                                  {rejectingId === sg.id ? (
                                    <div className="flex flex-col gap-2 w-full max-w-sm ml-auto">
                                      <textarea className="flex min-h-[60px] w-full rounded-md border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="Reason for declining..." value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectComment(""); }} className="h-7 text-xs">Cancel</Button>
                                        <Button size="sm" onClick={() => handleRejectShared(sg.id)} className="h-7 text-xs bg-rose-600 hover:bg-rose-700">Decline</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <><Button onClick={() => setRejectingId(sg.id)} variant="outline" size="sm" className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50"><MessageSquareX className="size-3.5 mr-1" /> Decline</Button>
                                    <Button onClick={() => handleApproveShared(sg.id)} size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="size-3.5 mr-1" /> Approve</Button></>
                                  )}
                                </div>
                              ) : (
                                <div className="flex justify-end">{sg.status === "rejected" && sg.rejection_reason ? <span className="text-xs text-neutral-500 italic max-w-xs text-right truncate">Note: {sg.rejection_reason}</span> : <span className="text-xs text-neutral-400">No notes</span>}</div>
                              )}
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Goal Sheet Details Modal overlay */}
      {viewingSheetId && sheetDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-neutral-100 bg-neutral-50/50">
              <div>
                <h3 className="font-semibold text-lg text-neutral-900">
                  Goal Sheet Summary
                </h3>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Employee: <span className="font-medium text-neutral-900">{sheetDetails.profile?.full_name}</span> 
                  {sheetDetails.profile?.department ? ` • ${sheetDetails.profile.department}` : ''}
                </p>
              </div>
              <button 
                onClick={closeDetailsModal} 
                className="text-neutral-400 hover:text-neutral-900 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="overflow-y-auto p-5 space-y-4 custom-scrollbar bg-white">
              {sheetDetails.goals?.map((goal: any, index: number) => (
                <div key={goal.id} className="p-4 border border-neutral-200/80 rounded-xl bg-white shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-semibold text-neutral-900 text-[15px]">{index + 1}. {goal.title}</p>
                    <Badge variant="outline" className="text-neutral-500 border-neutral-200 shrink-0 font-medium bg-neutral-50">
                      {goal.thrust_area}
                    </Badge>
                  </div>
                  
                  <p className="text-[13px] text-neutral-600 mt-2 leading-relaxed">{goal.description}</p>
                  
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-neutral-100 text-[13px] font-medium text-neutral-700">
                    <div className="flex flex-col bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100 min-w-[100px]">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-0.5">Weightage</span>
                      <span>{goal.weightage}%</span>
                    </div>
                    <div className="flex flex-col bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100 min-w-[100px]">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-0.5">Target</span>
                      <span>{goal.target_value} {goal.uom_type}</span>
                    </div>
                    <div className="flex flex-col bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100 min-w-[100px]">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-0.5">Quarter</span>
                      <span>{goal.quarter || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}

              {(!sheetDetails.goals || sheetDetails.goals.length === 0) && (
                <div className="text-center py-12 flex flex-col items-center justify-center text-neutral-500">
                  <Target className="size-10 text-neutral-300 mb-3" />
                  <p>No goals found in this submission.</p>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-5 border-t border-neutral-100 bg-neutral-50/50 flex justify-end">
              <Button onClick={closeDetailsModal} className="bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50">
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Item({ icon: Icon, href, label, active, badge }: any) {
  return (
    <Link href={href} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${active ? "bg-indigo-600 text-white font-medium" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
      <div className="flex items-center gap-3 text-sm"><Icon size={18} />{label}</div>
      {badge && <span className="min-w-[20px] font-semibold rounded-full bg-red-500 text-white text-[10px] flex px-1.5 justify-center items-center h-5">{badge}</span>}
    </Link>
  );
}