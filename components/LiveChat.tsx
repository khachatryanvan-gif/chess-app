"use client";

import { useState, useEffect, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface LiveChatProps {
  gameId: string;
  username: string;
  isSpectator?: boolean;
}

export default function LiveChat({
  gameId,
  username,
  isSpectator = false,
}: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch History & Subscribe to Realtime
  useEffect(() => {
    if (!gameId) return;

    const fetchChatHistory = async () => {
      const { data, error } = await supabase
        .from("game_messages")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Chat Fetch Error (Check Table & RLS):", error.message);
        return;
      }

      if (data) {
        const formattedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          sender: msg.username,
          text: msg.message,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(formattedMessages);
      }
    };

    fetchChatHistory();

    const channel = supabase.channel(`chat_${gameId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on("broadcast", { event: "chat_message" }, (payload) => {
        const incomingMsg = payload.payload as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [gameId]);

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !username || !gameId) return;

    const textToSend = newMessage.trim();
    const msgId = Math.random().toString(36).substring(2, 9);
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const messageData: Message = {
      id: msgId,
      sender: username,
      text: textToSend,
      timestamp: timeStr,
    };

    setNewMessage("");

    // Broadcast Realtime (Ակնթարթային)
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "chat_message",
        payload: messageData,
      });
    }

    // Save to DB (F5-ի համար)
    const { error } = await supabase.from("game_messages").insert([
      {
        game_id: gameId,
        username: username,
        message: textToSend,
      },
    ]);

    if (error) {
      console.error("Chat Insert Error:", error.message);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-[380px] shadow-xl overflow-hidden backdrop-blur-md">
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Match Chat
          </h3>
        </div>
        {isSpectator && (
          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
            Spectator
          </span>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs scrollbar-thin scrollbar-thumb-slate-800">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
            No messages yet. Say hello! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === username;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`font-bold text-[11px] ${
                      isMe ? "text-emerald-400" : "text-teal-300"
                    }`}
                  >
                    {msg.sender}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {msg.timestamp}
                  </span>
                </div>
                <div
                  className={`px-3 py-2 rounded-xl max-w-[85%] break-words ${
                    isMe
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-slate-100 rounded-tr-none"
                      : "bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-slate-950/80 border-t border-slate-800 flex gap-2"
      >
        <input
          type="text"
          placeholder={
            username ? "Type a message..." : "Log in to chat..."
          }
          disabled={!username}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!username || !newMessage.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
        >
          Send
        </button>
      </form>
    </div>
  );
}