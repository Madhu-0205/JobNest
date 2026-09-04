"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import {
  MessageSquare,
  Send,
  Loader2,
  PhoneCall,
  Clock,
  ArrowLeft,
  Lock,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { getChatRoomsAction } from "@/features/realtime/actions";
import { useChat } from "@/hooks/useChat";
import { EmptyState } from "@/components/ui/EmptyState";

type ChatRoom = {
  id: string;
  employer_id: string;
  worker_id: string;
  opportunity_id?: string;
  metadata?: { jobTitle?: string };
};

export default function MessagesPage() {
  const { t: i18nT } = useI18n();
  const { user } = useAuth();

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadRooms() {
      if (!user) return;
      try {
        const res = await getChatRoomsAction();
        if (res.success && res.data) {
          setChatRooms(res.data as unknown as ChatRoom[]);
          if (res.data.length > 0) {
            setActiveRoomId((res.data[0] as unknown as ChatRoom).id);
          }
        }
      } catch (err) {
        console.error("Failed to load chat rooms", err);
      } finally {
        setLoadingRooms(false);
      }
    }
    loadRooms();
  }, [user]);

  const activeRoom = chatRooms.find((r) => r.id === activeRoomId) || null;
  const otherUserId = activeRoom ? (activeRoom.employer_id === user?.id ? activeRoom.worker_id : activeRoom.employer_id) : "";

  const { messages, otherUserTyping, isE2EEReady, notifyTyping, sendMessage } = useChat(
    activeRoomId || "",
    user?.id || "",
    otherUserId
  );

  if (!user) return null;

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeRoomId) return;

    const content = chatInput;
    setChatInput("");
    await sendMessage(content, "text");
  };

  const getRoomName = (room: ChatRoom) => {
    if (room.metadata?.jobTitle) {
      return room.metadata.jobTitle;
    }
    return `Chat with ${room.employer_id === user.id ? room.worker_id.substring(0,6) : room.employer_id.substring(0,6)}...`;
  };

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] max-w-6xl mx-auto">
        <div>
          <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("app.realtimeTelemetryChat")}</Typography>
          <Typography variant="muted" className="text-xs">
            {i18nT("app.directSecureCommunicationWithEscrowlockedCounterparties")}
          </Typography>
        </div>

        <div className="flex-1 flex bg-card/40 border border-border/40 rounded-2xl overflow-hidden backdrop-blur-xl">
          {/* Left panel: chat rooms */}
          <div className={`${activeRoomId ? "hidden md:flex" : "flex"} w-full md:w-80 border-r border-border/40 flex-col shrink-0`}>
            <div className="p-4 border-b border-border/20 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-bold text-foreground">{i18nT("app.recentActiveChannels")}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
              {loadingRooms ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              ) : chatRooms.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="w-6 h-6 text-muted-foreground" />}
                  title="No Active Chats"
                  description="Your conversations with clients, workers, and employers will appear here."
                  className="py-8 px-3 border-none bg-transparent"
                />
              ) : (
                chatRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                      activeRoomId === room.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-secondary/40 border border-transparent"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold block text-foreground truncate">{getRoomName(room)}</span>
                      <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                        {room.id.substring(0, 8)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right panel: chat message log */}
          <div className={`${activeRoomId ? "flex" : "hidden md:flex"} flex-1 flex-col h-full bg-muted/10`}>
            {activeRoomId && activeRoom ? (
              <>
                {/* Thread Header */}
                <div className="h-14 border-b border-border/20 px-4 flex items-center justify-between shrink-0 bg-card/20">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveRoomId(null)}
                      className="md:hidden p-1.5 -ml-1 mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                      aria-label="Back to channels"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                      {getRoomName(activeRoom).substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block leading-tight">{getRoomName(activeRoom)}</span>
                      <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                        {isE2EEReady ? (
                          <>
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 inline" />
                            <span>E2EE Active</span>
                          </>
                        ) : (
                          <span>{i18nT("app.syncActive")}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActionSuccess("🚨 Distress Beacon activated! Telemetry coordinates sent to trust dispatchers.");
                        setTimeout(() => setActionSuccess(null), 3000);
                      }}
                      className="h-8 px-2 border-border/40 hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Message log */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {messages.length === 0 && (
                    <EmptyState
                      icon={<MessageSquare className="w-8 h-8 text-muted-foreground" />}
                      title="No Messages Yet"
                      description="Send a message below to start coordinating."
                      className="my-auto border-none bg-transparent"
                    />
                  )}
                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={msg.id || i} className={`flex flex-col max-w-[70%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                        <div className={`p-3 rounded-2xl text-xs leading-normal ${
                          msg.decryption_error
                            ? "bg-rose-950/80 border border-rose-500/50 text-rose-200"
                            : isMe
                            ? "bg-primary text-background font-semibold rounded-tr-none"
                            : "bg-card border border-border/50 text-foreground rounded-tl-none"
                        }`}>
                          {msg.is_encrypted && !msg.decryption_error && (
                            <Lock className="w-2.5 h-2.5 inline mr-1 opacity-75" />
                          )}
                          {msg.decryption_error && (
                            <AlertCircle className="w-3 h-3 inline mr-1 text-rose-400" />
                          )}
                          {msg.content}
                          {msg.message_type === "location" && "📍 Shared a location"}
                        </div>
                        <span className="text-[8px] text-muted mt-1 px-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && msg.delivery_status === "read" && " ✓✓"}
                          {isMe && msg.delivery_status === "sent" && " ✓"}
                          {isMe && msg.delivery_status === "failed" && " ⚠️ Not sent"}
                        </span>
                      </div>
                    );
                  })}

                  {otherUserTyping && (
                    <div className="self-start flex items-center gap-2 text-[10px] text-muted-foreground bg-card/65 px-3 py-2 rounded-xl border border-border/40">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Other user is typing...</span>
                    </div>
                  )}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendChatMessage} className="p-3 border-t border-border/20 flex gap-2 items-center bg-card/25 shrink-0">
                  <input
                    type="text"
                    placeholder={i18nT("app.typeYourMessageDetailsHere")}
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      notifyTyping();
                    }}
                    className="w-full bg-muted border border-border text-foreground px-3 py-2 rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <Button variant="primary" type="submit" className="shrink-0 rounded-xl px-4 h-9">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <EmptyState
                icon={<MessageSquare className="w-10 h-10 text-muted-foreground/60" />}
                title="No Chat Selected"
                description="Select a channel from the left sidebar to start messaging."
                className="my-auto border-none bg-transparent"
              />
            )}
          </div>
        </div>
      </div>
      
      {actionSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-rose-950 border border-rose-500/35 text-rose-300 px-4 py-3 rounded-xl shadow-luxury text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200">
          {actionSuccess}
        </div>
      )}
    </ProductShell>
  );
}