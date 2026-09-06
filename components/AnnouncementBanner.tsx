"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Announcement {
  enabled: boolean;
  message: string;
  type: "info" | "warning" | "success" | "danger";
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "announcement")
        .single();

      if (data?.value) {
        setAnnouncement(data.value as Announcement);
      }
    };

    fetchAnnouncement();

    // Realtime update listening
    const channel = supabase
      .channel("settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings", filter: "key=eq.announcement" },
        (payload) => {
          if (payload.new && (payload.new as any).value) {
            setAnnouncement((payload.new as any).value as Announcement);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!announcement || !announcement.enabled || !announcement.message) {
    return null;
  }

  const styles = {
    info: "bg-blue-950/80 border-blue-800 text-blue-300",
    success: "bg-emerald-950/80 border-emerald-800 text-emerald-300",
    warning: "bg-amber-950/80 border-amber-800 text-amber-300",
    danger: "bg-rose-950/80 border-rose-800 text-rose-300",
  };

  return (
    <div className={`w-full border-b py-2.5 px-4 text-center text-xs font-mono font-medium backdrop-blur-md ${styles[announcement.type]}`}>
      {announcement.message}
    </div>
  );
}