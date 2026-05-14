"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

const COLLAPSED_KEY = "procurehub_sidebar_collapsed";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[var(--surface-subtle)] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={mounted ? collapsed : false}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main content area */}
      <div
        className={[
          "flex-1 flex flex-col min-w-0 transition-[margin] duration-200",
          mounted && collapsed ? "lg:ml-16" : "lg:ml-60",
        ].join(" ")}
      >
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={mounted ? collapsed : false}
        />
        <main className="flex-1 p-5 sm:p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
