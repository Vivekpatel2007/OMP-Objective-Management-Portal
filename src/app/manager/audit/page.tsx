"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarRange,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileText,
  LayoutDashboard,
  Table2,
  Target,
  Menu,
  X,
  ScrollText,
  Users,
  ClipboardCheck,
  Loader2,
  Filter,
  ClipboardList
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Real Services
import { getCurrentUserProfile } from "@/services/sharedgoalservice";
//import { getAuditLogs } from "@/services/auditservice";

export default function AuditLogPage() {
  const [mobile, setMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // --- FILTER STATES ---
  const [timeFilter, setTimeFilter] = useState("30"); 
  const [memberFilter, setMemberFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch both the current user profile and the REAL audit logs
      const [userRes, logsRes] = await Promise.all([
        getCurrentUserProfile(),
        getAuditLogs()
      ]);

      setProfile(userRes);

      const dbLogs = logsRes?.data || [];
      
      // Map the raw DB columns to our UI format
      const mappedLogs = dbLogs.map((log: any) => {
        const actionType = log.action || "SYSTEM_EVENT";
        const targetEntity = log.entity || "System";
        
        // Safely determine payload data from new or old values
        const payloadData = log.new_value || log.old_value || null;
        
        // Generate a preview string of the JSON payload
        let detailsPreview = "No additional details";
        if (payloadData && typeof payloadData === "object" && Object.keys(payloadData).length > 0) {
           const keys = Object.keys(payloadData).slice(0, 2);
           detailsPreview = `Updated fields: ${keys.join(", ")}...`;
        }

        return {
          id: log.id,
          timestamp: log.created_at || new Date().toISOString(),
          actor: log.profiles?.full_name || "Unknown User",
          role: log.role || "user",
          action: actionType.replace(/_/g, " "), // Format "UPDATE_GOAL" to "UPDATE GOAL"
          target: `${targetEntity.toUpperCase()} ${log.entity_id ? `(#${log.entity_id.substring(0,6)})` : ""}`,
          details: detailsPreview,
          ip: "Logged by Server", 
          rawPayload: payloadData
        };
      });

      setLogs(mappedLogs);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toISOString().replace('T', ' ').substring(0, 16);
  };

  // --- FILTER LOGIC ---
  const uniqueMembers = Array.from(new Set(logs.map((l) => l.actor))).sort();
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action))).sort();

  const filteredLogs = logs.filter((log) => {
    // 1. Time Filter
    if (timeFilter !== "all") {
      const logDate = new Date(log.timestamp).getTime();
      const now = new Date().getTime();
      const diffDays = (now - logDate) / (1000 * 3600 * 24);
      if (diffDays > parseInt(timeFilter)) return false;
    }

    // 2. Member Filter
    if (memberFilter !== "all" && log.actor !== memberFilter) return false;

    // 3. Action Filter
    if (actionFilter !== "all" && log.action !== actionFilter) return false;

    return true;
  });

  // --- EXPORT LOGIC ---
  const handleExportCSV = (isExcel = false) => {
    if (filteredLogs.length === 0) {
      alert("No logs to export based on current filters.");
      return;
    }

    const headers = ["Timestamp", "Actor", "Role", "Action", "Target", "Details", "Payload"];
    
    const escapeCSV = (str: any) => {
      const s = String(str || "");
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = filteredLogs.map(log => [
      escapeCSV(formatDate(log.timestamp)),
      escapeCSV(log.actor),
      escapeCSV(log.role),
      escapeCSV(log.action),
      escapeCSV(log.target),
      escapeCSV(log.details),
      escapeCSV(JSON.stringify(log.rawPayload)) 
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const dateStr = new Date().toISOString().split('T')[0];
    const extension = isExcel ? "csv" : "csv"; 
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Audit_Log_Filtered_${dateStr}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FC]">
        <div className="flex flex-col items-center gap-2 text-indigo-600">
          <Loader2 className="size-8 animate-spin" />
          <span className="text-sm font-medium">Loading Real Audit Trail...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      {/* SIDEBAR */}
      <aside
        className={`print-hidden fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition-transform ${
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
          <Item icon={CheckCircle} href="/manager/approvals" label="Approvals" />
          <Item icon={ClipboardCheck} href="/manager/checkins" label="Check-ins" />
          <Item icon={Users} href="/manager/shared-goals" label="Shared Goals" />
          <Item icon={BarChart3} href="/manager/reports" label="Team Reports" />
          <Item icon={ScrollText} href="/manager/audit" label="Audit Log" active />
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden print-wrapper">
        
        {/* HEADER */}
        <header className="print-hidden bg-white px-5 py-4 border-b flex justify-between items-center z-10">
          <div className="flex gap-3 items-center">
            <button onClick={() => setMobile(!mobile)} className="md:hidden text-neutral-600">
              {mobile ? <X /> : <Menu />}
            </button>
            <div className="flex flex-col">
              <h1 className="font-semibold text-neutral-950 text-base">Security & Audit</h1>
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
        <main className="p-4 md:p-8 overflow-auto flex-1 print-p-0">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            
            {/* Page Headers */}
            <div className="flex flex-col gap-1.5 print-header">
              <h2 className="font-bold text-2xl text-neutral-900 tracking-tight">
                System Audit Log
              </h2>
              <p className="text-neutral-500 text-sm">
                Track all goal-related actions performed by you and your team members across the platform.
              </p>
            </div>

            {/* FILTERS ROW */}
            <div className="print-hidden rounded-2xl bg-white border border-neutral-200/60 shadow-sm flex p-4 flex-wrap items-center gap-3">
              
              {/* Date Filter */}
              <div className="relative">
                <CalendarRange className="size-4 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="h-10 pl-9 pr-8 rounded-xl border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50 appearance-none bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="all">All Time</option>
                </select>
                <ChevronDown className="size-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Member Filter */}
              <div className="relative">
                <Users className="size-4 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  className="h-10 pl-9 pr-8 rounded-xl border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50 appearance-none bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Team Members</option>
                  {uniqueMembers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="size-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Action Filter */}
              <div className="relative">
                <Filter className="size-4 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="h-10 pl-9 pr-8 rounded-xl border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50 appearance-none bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Actions</option>
                  {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="size-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="flex-1"></div>
              
              <Button 
                onClick={() => {
                  setTimeFilter("all");
                  setMemberFilter("all");
                  setActionFilter("all");
                }}
                variant="ghost" 
                className="rounded-xl text-neutral-500 hover:text-neutral-900 h-10 px-4"
              >
                Clear Filters
              </Button>
            </div>

            {/* Main Table */}
            <div className="rounded-2xl bg-white border border-neutral-200/60 shadow-sm overflow-hidden print-border-none print-shadow-none">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="border-collapse text-left w-full whitespace-nowrap">
                  <thead className="bg-neutral-50/80 text-neutral-500 text-xs uppercase tracking-wider font-medium border-b border-neutral-200">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Actor</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Target Table</th>
                      <th className="p-4">Details</th>
                      <th className="p-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-neutral-100">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center flex flex-col items-center justify-center bg-neutral-50/50">
                          <ClipboardList className="size-8 text-neutral-300 mb-2" />
                          <span className="font-medium text-neutral-900">No logs found</span>
                          <span className="text-neutral-500 mt-1">
                            {logs.length === 0 ? "Your audit_logs table is currently empty. Try updating a goal to generate an event!" : "No logs match your current filters."}
                          </span>
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="bg-white hover:bg-neutral-50/50 transition-colors">
                          <td className="font-mono text-neutral-500 text-xs p-4">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-neutral-900">{log.actor}</span>
                              <span className="text-[10px] text-neutral-500 capitalize">{log.role}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 font-medium rounded-md border-none uppercase text-[10px]">
                              {log.action}
                            </Badge>
                          </td>
                          <td className="p-4 text-neutral-600 max-w-[200px] truncate" title={log.target}>
                            {log.target}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-neutral-600 text-xs">{log.details}</span>
                              {log.rawPayload && (
                                <button 
                                  onClick={() => alert(JSON.stringify(log.rawPayload, null, 2))}
                                  className="print-hidden text-[10px] font-medium text-indigo-600 text-left hover:underline w-fit"
                                >
                                  View Payload
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="font-mono text-neutral-400 text-xs p-4">
                            {log.ip}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination & Export Buttons */}
            <div className="print-hidden flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Button className="size-9 rounded-xl border-neutral-200 text-neutral-600" size="icon" variant="outline" disabled>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button className="size-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                  1
                </Button>
                <Button className="size-9 rounded-xl border-neutral-200 text-neutral-600" size="icon" variant="outline" disabled>
                  <ChevronRight className="size-4" />
                </Button>
                <span className="text-neutral-500 text-sm ml-2">
                  Showing {filteredLogs.length} entries
                </span>
              </div>
              
              <div className="flex flex-wrap justify-end gap-3 w-full md:w-auto">
                <Button 
                  onClick={() => handleExportCSV(false)}
                  className="rounded-xl px-4 gap-2 h-10 border-neutral-200 text-neutral-700 hover:bg-neutral-50 flex-1 md:flex-none" 
                  variant="outline"
                >
                  <FileText className="size-4 text-indigo-600" /> Export CSV
                </Button>
                <Button 
                  onClick={() => handleExportCSV(true)}
                  className="rounded-xl px-4 gap-2 h-10 border-neutral-200 text-neutral-700 hover:bg-neutral-50 flex-1 md:flex-none" 
                  variant="outline"
                >
                  <Table2 className="size-4 text-emerald-600" /> Export Excel
                </Button>
                <Button 
                  onClick={handleExportPDF}
                  className="rounded-xl px-4 gap-2 h-10 border-neutral-200 text-neutral-700 hover:bg-neutral-50 flex-1 md:flex-none" 
                  variant="outline"
                >
                  <FileDown className="size-4 text-rose-600" /> Export PDF
                </Button>
              </div>
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
        @media print {
          @page {
            size: landscape;
            margin: 1cm;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
          }
          .print-hidden {
            display: none !important;
          }
          .print-wrapper {
            height: auto !important;
            overflow: visible !important;
          }
          .print-p-0 {
            padding: 0 !important;
          }
          .print-border-none {
            border: none !important;
          }
          .print-shadow-none {
            box-shadow: none !important;
          }
          .print-header {
            margin-bottom: 20px;
          }
          table {
            border: 1px solid #e5e7eb;
          }
          th {
            background-color: #f9fafb !important;
            color: #374151 !important;
            border-bottom: 1px solid #e5e7eb;
          }
          td {
            border-bottom: 1px solid #e5e7eb;
          }
        }
      `}} />
    </div>
  );
}

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