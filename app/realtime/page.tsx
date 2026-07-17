"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ProductShell } from "@/components/ProductShell";
import { usePresence } from "@/hooks/usePresence";
import { useChat } from "@/hooks/useChat";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { MaplibreMap, MapMarker, MapGeofence } from "@/components/MaplibreMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Typography } from "@/components/ui/Typography";

export default function RealtimeDashboard() {
  // Simulator Active User Profiles
  const [activeProfile, setActiveProfile] = useState<"worker" | "employer">("worker");
  const currentUserId = activeProfile === "worker" ? "worker-profile-id" : "employer-profile-id";
  const otherUserId = activeProfile === "worker" ? "employer-profile-id" : "worker-profile-id";

  // Event Bus Live Audit Stream logs
  const [eventLogs, setEventLogs] = useState<string[]>([]);

  const logEventBus = useCallback((eventType: string, payload: Record<string, unknown>) => {
    setEventLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] EVENT: ${eventType} -> ${JSON.stringify(payload)}`,
      ...prev
    ].slice(0, 50));
  }, []);

  // Offline Synchronizer Hook
  const offlineSync = useOfflineSync(currentUserId);

  // Geofencing Definitions for Map
  const demoGeofences: MapGeofence[] = [
    {
      id: "agricultural-center",
      name: "Hosur Road Agriculture Fields Zone",
      type: "work_zone",
      latitude: 12.9850,
      longitude: 77.6050,
      radius: 500, // 500 meters circular zone
    }
  ];

  // Map Coordinates Center & Markers
  const [centerLat, setCenterLat] = useState(12.9716);
  const [centerLon, setCenterLon] = useState(77.5946);
  const destinationCoords = { latitude: 12.9850, longitude: 77.6050 };

  const routeCoordinates: [number, number][] = [
    [77.5946, 12.9716],
    [77.5960, 12.9750],
    [77.5990, 12.9780],
    [77.6010, 12.9810],
    [77.6050, 12.9850],
  ];

  // Live Location Tracking Hook
  const liveTrack = useLiveTracking(currentUserId, destinationCoords);

  // Direct Chat Hook
  const chat = useChat(
    "c5c64b54-9462-4b2a-874f-66df98ea5a8d",
    currentUserId,
    otherUserId,
    (offlineEvent) => {
      // Buffer event in offline sync hook
      offlineSync.queueEvent(offlineEvent);
      logEventBus("chat.message.sent", { roomId: offlineEvent.payload["roomId"], buffered: true });
    }
  );

  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat logs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, chat.otherUserTyping]);

  // Sync offline queue syncLogs into Event Bus ticker log
  useEffect(() => {
    if (offlineSync.syncLogs.length > 0) {
      logEventBus("offline.sync.engine", { message: offlineSync.syncLogs[0] });
    }
  }, [offlineSync.syncLogs, logEventBus]);

  // Synchronize presence change notifications in Event Bus ticker log
  const presence = usePresence(currentUserId);
  useEffect(() => {
    logEventBus("identity.user.updated", { userId: currentUserId, status: presence.status });
  }, [presence.status, currentUserId, logEventBus]);



  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    chat.sendMessage(inputText, "text");
    logEventBus("chat.message.sent", {
      roomId: "c5c64b54-9462-4b2a-874f-66df98ea5a8d",
      messageType: "text",
      content: inputText,
      recipientId: otherUserId,
    });
    
    setInputText("");
  };

  const handleSendAttachment = (type: "image" | "voice" | "location") => {
    if (type === "image") {
      chat.sendMessage(undefined, "image", "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=400");
      logEventBus("chat.message.sent", { messageType: "image", attachmentUrl: "image_url" });
    } else if (type === "voice") {
      chat.sendMessage(undefined, "voice", "https://audio.example.com/recordings/voice-ping.mp3");
      logEventBus("chat.message.sent", { messageType: "voice", attachmentUrl: "voice_url" });
    } else if (type === "location") {
      chat.sendMessage(undefined, "location", undefined, { lat: 12.9716, lon: 77.5946 });
      logEventBus("chat.message.sent", { messageType: "location", coords: "12.9716, 77.5946" });
    }
  };

  const handleStartTransit = () => {
    logEventBus("job.started", { workerId: currentUserId });
    
    const cleanup = liveTrack.simulateTransit(routeCoordinates, (coord, heading, speed) => {
      // Log location coordinates ping updates directly to audit log ticker
      logEventBus("worker.location.updated", {
        latitude: coord[1],
        longitude: coord[0],
        speedMps: speed.toFixed(1),
        headingDegrees: heading,
      });

      // Recalculate center
      setCenterLat(coord[1]);
      setCenterLon(coord[0]);
    });

    // Cleanup simulation on end/unmount
    setTimeout(() => {
      if (cleanup) cleanup();
      logEventBus("worker.arrived", { workerId: currentUserId });
      logEventBus("job.completed", { workerId: currentUserId });
    }, 12000);
  };

  // Compile active markers
  const mapMarkers: MapMarker[] = [
    {
      latitude: destinationCoords.latitude,
      longitude: destinationCoords.longitude,
      label: "Farming Job Destination",
      color: "#fbbf24",
    },
    {
      latitude: liveTrack.currentLocation?.latitude || centerLat,
      longitude: liveTrack.currentLocation?.longitude || centerLon,
      label: activeProfile === "worker" ? "You (Arun)" : "Arun (Worker)",
      color: "#f59e0b",
    }
  ];

  return (
    <ProductShell>
      <div className="flex justify-between items-center gap-4 mb-4">
        <div>
          <Typography variant="h2" className="font-bold gold-gradient-text">Live Operations Cockpit</Typography>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Simulation Profile:</label>
          <select
            value={activeProfile}
            onChange={(e) => setActiveProfile(e.target.value as "worker" | "employer")}
            className="bg-muted text-foreground text-xs font-semibold px-2 py-1 rounded-lg border border-border outline-none cursor-pointer"
            aria-label="Select active profile simulation context"
          >
            <option value="worker">Arun (Worker)</option>
            <option value="employer">Nisha (Employer)</option>
          </select>
          <Badge variant={offlineSync.isOffline ? "danger" : "success"} className="text-xs">
            {offlineSync.isOffline ? "⚠️ Offline Mode" : "🟢 Live Sync Active"}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Presence & Chat Window */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Presence Controls & Grid */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base gold-gradient-text">Live User Presence Status</CardTitle>
              <CardDescription className="text-xs">
                Track worker availability and status updates in real time.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Typography variant="muted" className="text-xs">Your Status:</Typography>
                <select
                  value={presence.status}
                  onChange={(e) => presence.updateStatus(e.target.value)}
                  className="bg-muted text-foreground text-xs px-2.5 py-1.5 rounded-lg border border-border outline-none cursor-pointer w-[140px]"
                  aria-label="Update presence status"
                >
                  <option value="available">🟢 Available</option>
                  <option value="working">🚜 Working</option>
                  <option value="busy">🔴 Busy</option>
                  <option value="invisible">⚪ Invisible</option>
                </select>
              </div>

              <div className="border border-border/40 p-2.5 rounded-lg bg-black/25 flex flex-col gap-1.5">
                <Typography variant="muted" className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80 block mb-1">
                  Active Channel Participants
                </Typography>
                {Object.keys(presence.users).map((uid) => (
                  <div key={uid} className="flex items-center justify-between text-xs py-1 border-b border-border/10 last:border-0">
                    <span className="font-semibold text-muted-foreground">
                      {uid === "worker-profile-id" ? "Arun (Worker)" : uid === "employer-profile-id" ? "Nisha (Employer)" : uid}
                    </span>
                    <Badge
                      variant={
                        presence.users[uid] === "available"
                          ? "success"
                          : presence.users[uid] === "working"
                          ? "primary"
                          : presence.users[uid] === "busy"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[9px] uppercase tracking-wide px-1.5 py-0.5"
                    >
                      {presence.users[uid]}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Realtime Chat Console */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md flex-1 flex flex-col h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base gold-gradient-text flex items-center justify-between">
                <span>Direct Operations Chat</span>
                {chat.otherUserTyping && (
                  <span className="text-[10px] italic text-amber-500 animate-pulse">Typing...</span>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Direct chat with typing indicators and read receipts.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
              {/* Message History Scroller */}
              <div className="flex-1 overflow-y-auto bg-black/20 border border-border/40 rounded-xl p-3 flex flex-col gap-2.5 min-h-0">
                {chat.messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${isOwn ? "self-end items-end" : "self-start items-start"}`}
                    >
                      <div
                        className={`p-2.5 rounded-2xl text-xs ${
                          isOwn
                            ? "bg-amber-600 text-white rounded-tr-none"
                            : "bg-muted text-foreground rounded-tl-none border border-border"
                        }`}
                      >
                        {msg.message_type === "text" && msg.content}
                        
                        {msg.message_type === "image" && (
                          <div className="flex flex-col gap-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={msg.attachment_url} alt="Attachment" className="rounded-lg max-h-[120px] object-cover" />
                            <span className="text-[10px] italic opacity-80">Photo Attachment</span>
                          </div>
                        )}

                        {msg.message_type === "voice" && (
                          <div className="flex items-center gap-1.5 py-0.5">
                            <span>🎙️ Voice Memo</span>
                            <span className="w-16 h-2.5 bg-white/20 rounded-full overflow-hidden relative">
                              <span className="absolute left-0 top-0 bottom-0 bg-white w-1/2 rounded-full" />
                            </span>
                            <span className="text-[9px] opacity-75">0:04</span>
                          </div>
                        )}

                        {msg.message_type === "location" && (
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="font-semibold">📍 Coordinates Location:</span>
                            <span>{msg.location_lat}, {msg.location_lon}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground">
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isOwn && (
                          <span
                            className={
                              msg.delivery_status === "read"
                                ? "text-sky-500 font-bold"
                                : msg.delivery_status === "delivered"
                                ? "text-muted-foreground font-semibold"
                                : "text-muted-foreground/60"
                            }
                          >
                            {msg.delivery_status === "read" ? "✓✓" : msg.delivery_status === "delivered" ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {chat.otherUserTyping && (
                  <div className="self-start bg-muted p-2 rounded-2xl rounded-tl-none text-xs italic text-muted-foreground border border-border animate-pulse">
                    Typing status active...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message inputs */}
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                  <Input
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      chat.notifyTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                    placeholder={offlineSync.isOffline ? "Queueing message offline..." : "Type live message..."}
                    className="h-9 text-xs"
                  />
                  <Button size="sm" onClick={handleSendMessage} className="bg-amber-600 hover:bg-amber-700 h-9 px-3">
                    Send
                  </Button>
                </div>

                <div className="flex justify-between items-center bg-muted/40 border border-border/30 px-2 py-1 rounded-lg">
                  <span className="text-[10px] text-muted-foreground">Quick attach:</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleSendAttachment("image")} className="text-[9px] h-6 px-1.5 py-0">
                      🖼️ Image
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSendAttachment("voice")} className="text-[9px] h-6 px-1.5 py-0">
                      🎙️ Audio
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSendAttachment("location")} className="text-[9px] h-6 px-1.5 py-0">
                      📍 Coords
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center/Right Column: Live Transit Map and Tracking info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Vector Map Viewport */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Typography variant="h4" className="text-base font-bold">
                Live Operations Viewport
              </Typography>
              <div className="flex gap-2">
                {liveTrack.currentLocation?.speed && liveTrack.currentLocation.speed > 0.5 ? (
                  <Badge variant="primary" className="text-xs animate-pulse">🚜 Worker In Transit</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">🚜 Worker Stationary</Badge>
                )}
              </div>
            </div>

            <MaplibreMap
              latitude={liveTrack.currentLocation?.latitude || centerLat}
              longitude={liveTrack.currentLocation?.longitude || centerLon}
              markers={mapMarkers}
              routeCoordinates={routeCoordinates}
              geofences={demoGeofences}
              isOffline={offlineSync.isOffline}
            />
          </div>

          {/* Transit and Telemetry details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Live Transit Stats */}
            <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md col-span-1 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-500">Live Telemetry Details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-2.5 rounded-lg border border-border/40">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Speed (mps / kmh)</span>
                    <span className="font-mono text-sm font-bold">
                      {liveTrack.currentLocation?.speed ? `${liveTrack.currentLocation.speed.toFixed(1)} m/s (${(liveTrack.currentLocation.speed * 3.6).toFixed(0)} km/h)` : "0.0 m/s"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Heading direction</span>
                    <span className="font-mono text-sm font-bold">
                      {liveTrack.currentLocation?.heading ? `${liveTrack.currentLocation.heading}°` : "0° (North)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Distance Remaining</span>
                    <span className="font-mono text-sm font-bold text-sky-400">
                      {liveTrack.distanceRemaining ? `${(liveTrack.distanceRemaining / 1000).toFixed(2)} km` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">ETA Clock (seconds)</span>
                    <span className="font-mono text-sm font-bold text-amber-500">
                      {liveTrack.etaSeconds ? `${liveTrack.etaSeconds} seconds` : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 w-full" onClick={handleStartTransit}>
                    🏁 Start Simulated Transit Route
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Offline Sandbox and Sync Engine Queue */}
            <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-rose-500">Offline Queue Sync</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant={offlineSync.offlineSim ? "outline" : "primary"}
                  className={offlineSync.offlineSim ? "border-rose-500 text-rose-500" : "bg-rose-600 hover:bg-rose-700 text-white"}
                  onClick={offlineSync.toggleSimulateOffline}
                >
                  {offlineSync.offlineSim ? "🔌 Reconnect Live Network" : "🔌 Simulate Network Outage"}
                </Button>

                <div className="flex justify-between items-center text-xs p-1.5 border border-border/20 rounded bg-black/10">
                  <span className="text-muted-foreground">Queued events:</span>
                  <span className="font-mono font-bold text-amber-500">{offlineSync.queue.length} items</span>
                </div>

                <div className="bg-black/35 rounded border border-border/30 h-[50px] overflow-y-auto text-[9px] font-mono p-1 text-muted-foreground/75 flex flex-col gap-0.5">
                  {offlineSync.syncLogs.length === 0 ? (
                    <span className="italic text-[9px] text-muted-foreground/35">Sync logs ticker active.</span>
                  ) : (
                    offlineSync.syncLogs.map((log, idx) => <span key={idx}>{log}</span>)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Bus Monospace Audit Log Ticker */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-amber-500">Event Bus Live Audit Stream Ticker</CardTitle>
              <CardDescription className="text-xs">
                Real-time log tracing of global decoupled pub/sub Event Bus entries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black/40 border border-border/40 p-3 rounded-xl font-mono text-[10px] h-[120px] overflow-y-auto flex flex-col gap-1 text-muted-foreground">
                {eventLogs.length === 0 ? (
                  <span className="italic text-muted-foreground/40">Event Bus active. Run operations or simulator updates to stream events...</span>
                ) : (
                  eventLogs.map((log, idx) => (
                    <div key={idx} className="border-b border-border/10 pb-0.5 whitespace-nowrap">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </ProductShell>
  );
}
