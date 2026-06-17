"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ListChecks,
  CalendarCheck,
  BarChart2,
  Settings,
  Bell,
  Menu,
  X,
  Target,
  CheckCircle2,
  MessageSquare,
  CalendarClock,
  CheckCheck,
  MoreVertical,
  Trash2,
} from "lucide-react";

import { getCurrentUserProfile } from "@/services/sharedgoalservice";
import { getNotifications } from "@/services/notificationservice";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// --- INTERFACES ---
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string; // e.g., "approval", "reminder", "message", "system"
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mobile, setMobile] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Fetch user profile and real notifications concurrently
      const [user, notifRes] = await Promise.all([
        getCurrentUserProfile(),
        getNotifications()
      ]);

      if (user) setProfile(user);
      
      // Set actual notifications from the database
      setNotifications(notifRes?.data || []);
      
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkAllRead = async () => {
    // 1. Optimistic UI update
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
    
    // 2. TODO: Call your service to update the database
    // await markAllNotificationsRead(); 
  };

  const handleMarkAsRead = async (id: string) => {
    // 1. Optimistic UI update
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
    
    // 2. TODO: Call your service to update the database
    // await markNotificationRead(id); 
  };

  const filteredNotifications = notifications.filter((n) => 
    filter === "unread" ? !n.isRead : true
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Helper to pick icons based on notification type
  const getIconForType = (type: string) => {
    switch (type?.toLowerCase()) {
      case "approval": return <CheckCircle2 className="size-5 text-emerald-600" />;
      case "reminder": return <CalendarClock className="size-5 text-amber-600" />;
      case "message": return <MessageSquare className="size-5 text-blue-600" />;
      default: return <Bell className="size-5 text-neutral-600" />;
    }
  };

  const getBackgroundForType = (type: string) => {
    switch (type?.toLowerCase()) {
      case "approval": return "bg-emerald-100";
      case "reminder": return "bg-amber-100";
      case "message": return "bg-blue-100";
      default: return "bg-neutral-100";
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FC]">
        Loading Notifications...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition-transform ${
          mobile ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-5">
          <h1 className="text-white font-bold text-xl flex items-center gap-2">
            <Target className="size-5 text-indigo-500" /> GoalTrack
          </h1>
        </div>
        <nav className="space-y-2 px-3">
          <Item icon={LayoutDashboard} href="/employee/dashboard" label="Dashboard" />
          <Item icon={ListChecks} href="/employee/goals" label="Goals" />
          <Item icon={CalendarCheck} href="/employee/checkins" label="Check-ins" />
          <Item icon={BarChart2} href="/employee/reports" label="Reports" />
          <Item icon={Bell} href="/notifications" label="Notifications" active />
          <Item icon={Settings} href="/settings" label="Settings" />
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
            <div className="font-medium text-neutral-800">Notifications</div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="flex flex-col items-end">
                <span className="leading-none font-semibold text-sm">
                  {profile?.full_name || "Employee"}
                </span>
                <span className="text-neutral-500 text-xs">
                  {profile?.department || "Operations"}
                </span>
              </div>
              <div className="size-8 font-semibold rounded-full bg-indigo-100 text-indigo-700 text-xs flex justify-center items-center">
                {profile?.full_name?.substring(0, 2).toUpperCase() || "ME"}
              </div>
            </div>
          </div>
        </header>

        {/* NOTIFICATIONS CONTENT */}
        <main className="p-4 md:p-8 overflow-auto flex-1">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h1 className="font-bold text-3xl tracking-tight text-neutral-900">
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <Badge className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 border-0">
                      {unreadCount} New
                    </Badge>
                  )}
                </div>
                <p className="text-neutral-500 text-sm">
                  Stay updated on your goals, check-ins, and manager feedback.
                </p>
              </div>
              
              <Button 
                onClick={handleMarkAllRead}
                variant="outline"
                className="text-neutral-700 border-neutral-200 gap-2 rounded-xl"
                disabled={unreadCount === 0}
              >
                <CheckCheck className="size-4" />
                Mark all as read
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-px">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  filter === "all" 
                    ? "border-indigo-600 text-indigo-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  filter === "unread" 
                    ? "border-indigo-600 text-indigo-600" 
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Unread
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex flex-col gap-3 pb-8">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50">
                  <Bell className="size-10 text-neutral-300 mx-auto mb-3" />
                  <h3 className="font-medium text-neutral-900">You're all caught up!</h3>
                  <p className="text-neutral-500 text-sm mt-1">No new notifications to show right now.</p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <Card 
                    key={notif.id} 
                    className={`shadow-sm rounded-2xl border transition-all ${
                      notif.isRead ? "border-neutral-200/60 bg-white" : "border-indigo-100 bg-indigo-50/30"
                    }`}
                  >
                    <CardContent className="p-4 md:p-5 flex gap-4 items-start">
                      {/* Icon */}
                      <div className={`size-10 rounded-full flex justify-center items-center shrink-0 ${getBackgroundForType(notif.type)}`}>
                        {getIconForType(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`text-sm md:text-base font-semibold ${notif.isRead ? "text-neutral-700" : "text-neutral-900"}`}>
                            {notif.title}
                          </h4>
                          <span className="text-xs font-medium text-neutral-400 whitespace-nowrap">
                            {/* Format date properly depending on your backend response */}
                            {new Date(notif.createdAt).toLocaleDateString()} 
                          </span>
                        </div>
                        <p className={`text-sm ${notif.isRead ? "text-neutral-500" : "text-neutral-700"}`}>
                          {notif.message}
                        </p>
                      </div>

                      {/* Actions */}
                      {!notif.isRead && (
                        <div className="flex items-center shrink-0 ml-2">
                          <button 
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="size-8 rounded-full bg-indigo-100 text-indigo-600 flex justify-center items-center hover:bg-indigo-200 transition-colors"
                            title="Mark as read"
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

// Re-usable Sidebar Item Component
function Item({ icon: Icon, href, label, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active
          ? "bg-indigo-600 text-white font-medium"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}