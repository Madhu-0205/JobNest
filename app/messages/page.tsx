"use client";

import React, { useState } from "react";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  MessageSquare,
  Send,
  Loader2,
  PhoneCall,
  Clock
} from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuth();
  
  // Chat Room and Message States
  const chatRooms = [
    { id: "room-1", name: "Suresh (Plumbing Gig)", lastMsg: "Please send your location", unread: 2 },
    { id: "room-2", name: "Deepak (Farming Help)", lastMsg: "Let's meet near mandal Taluk", unread: 0 },
    { id: "room-3", name: "JobNest Support Team", lastMsg: "SLA response time is under 1 hr", unread: 0 }
  ];
  const [activeRoomId, setActiveRoomId] = useState("room-1");
  const [messages, setMessages] = useState([
    { sender: "Suresh", text: "Hello! Are you available to fix a water leakage in Guntur?", time: "10:30 AM" },
    { sender: "You", text: "Yes, I can start today. What's the location?", time: "10:32 AM" },
    { sender: "Suresh", text: "Near the Main Bazaar Road, around 3 km from center.", time: "10:35 AM" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!user) return null;

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMsg = {
      sender: "You",
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsTyping(true);
    
    // Simulate automated agent responder
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: "Suresh",
          text: "Got it. I will accept the work parameters. Proceeding with payment lock.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2000);
  };

  const activeRoom = chatRooms.find(r => r.id === activeRoomId) || chatRooms[0];

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
        <div>
          <Typography variant="h2" className="font-bold gold-gradient-text">Realtime Telemetry Chat</Typography>
          <Typography variant="muted" className="text-xs">
            Direct secure communication with escrow-locked counterparties.
          </Typography>
        </div>

        <div className="flex-1 flex bg-card/40 border border-border/40 rounded-2xl overflow-hidden backdrop-blur-xl">
          {/* Left panel: chat rooms */}
          <div className="w-full md:w-80 border-r border-border/40 flex flex-col shrink-0">
            <div className="p-4 border-b border-border/20 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-bold text-foreground">Recent Active Channels</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
              {chatRooms.map((room) => (
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
                    <span className="text-xs font-bold block text-foreground truncate">{room.name}</span>
                    <span className="text-[10px] text-muted-foreground block truncate mt-0.5">{room.lastMsg}</span>
                  </div>
                  {room.unread > 0 && (
                    <Badge variant="primary" className="text-[9px] px-1.5 py-0 h-4 flex items-center border-none">
                      {room.unread}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: chat message log */}
          <div className="hidden md:flex flex-1 flex-col h-full bg-muted/10">
            {/* Thread Header */}
            <div className="h-14 border-b border-border/20 px-4 flex items-center justify-between shrink-0 bg-card/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                  {activeRoom.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block leading-tight">{activeRoom.name}</span>
                  <span className="text-[9px] text-emerald-400 block font-mono">Sync active</span>
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
              {messages.map((msg, i) => {
                const isMe = msg.sender === "You";
                return (
                  <div key={i} className={`flex flex-col max-w-[70%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                    <span className="text-[9px] text-muted-foreground mb-0.5 px-1">{msg.sender}</span>
                    <div className={`p-3 rounded-2xl text-xs leading-normal ${
                      isMe 
                        ? "bg-primary text-background font-semibold rounded-tr-none" 
                        : "bg-card border border-border/50 text-foreground rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-muted mt-1 px-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {msg.time}
                    </span>
                  </div>
                );
              })}

              {isTyping && (
                <div className="self-start flex items-center gap-2 text-[10px] text-muted-foreground bg-card/65 px-3 py-2 rounded-xl border border-border/40">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Suresh is typing work parameters...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-border/20 flex gap-2 items-center bg-card/25 shrink-0">
              <input
                type="text"
                placeholder="Type your message details here..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full bg-muted border border-border text-foreground px-3 py-2 rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <Button variant="primary" type="submit" className="shrink-0 rounded-xl px-4 h-9">
                <Send className="w-4 h-4" />
              </Button>
            </form>
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
