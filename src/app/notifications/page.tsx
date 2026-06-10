"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getNotifications,
  markRead,
} from "@/services/notificationservice";

export default function NotificationsPage() {
  const [
    notifications,
    setNotifications,
  ] =
    useState<any[]>(
      []
    );

  const [loading,
    setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      const response =
        await getNotifications();

      setNotifications(
        response.data ||
          []
      );

      setLoading(
        false
      );
    }

    load();
  }, []);

  async function read(
    id: string
  ) {
    await markRead(
      id
    );

    setNotifications(
      (
        prev
      ) =>
        prev.map(
          (
            n
          ) =>
            n.id ===
            id
              ? {
                  ...n,
                  is_read:
                    true,
                }
              : n
        )
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Notifications
      </h1>

      {notifications.length ===
      0 ? (
        <div className="rounded border p-5">
          No notifications
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(
            (
              item
            ) => (
              <div
                key={
                  item.id
                }
                className={`rounded border p-5 ${
                  item.is_read
                    ? ""
                    : "bg-blue-50"
                }`}
              >
                <h2 className="font-semibold">
                  {
                    item.title
                  }
                </h2>

                <p className="mt-2 text-gray-600">
                  {
                    item.message
                  }
                </p>

                {!item.is_read && (
                  <button
                    onClick={() =>
                      read(
                        item.id
                      )
                    }
                    className="mt-4 rounded bg-black px-3 py-1 text-white"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}