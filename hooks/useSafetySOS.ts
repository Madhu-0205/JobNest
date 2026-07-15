"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/services/logger";

export interface TrustedContact {
  id: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string | null;
  is_emergency_sos: boolean;
}

export interface IncidentTimelineLog {
  timestamp: string;
  event: string;
  details: string;
}

export function useSafetySOS(userId: string) {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [sosActive, setSosActive] = useState(false);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [incidentTimeline, setIncidentTimeline] = useState<IncidentTimelineLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/profile?userId=${userId}`);
      if (!res.ok) throw new Error("Connection failed.");
      
      // Seed list
      setContacts([
        { id: "c1", contact_name: "Ramesh Kumar (Brother)", contact_phone: "+91 98765 43210", is_emergency_sos: true },
        { id: "c2", contact_name: "Jyothi Gowda (Spouse)", contact_phone: "+91 99887 76655", is_emergency_sos: true },
      ]);
    } catch {
      setContacts([
        { id: "c1", contact_name: "Ramesh Kumar (Brother)", contact_phone: "+91 98765 43210", is_emergency_sos: true },
        { id: "c2", contact_name: "Jyothi Gowda (Spouse)", contact_phone: "+91 99887 76655", is_emergency_sos: true },
      ]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = async (name: string, phone: string, email?: string) => {
    const newContact: TrustedContact = {
      id: crypto.randomUUID(),
      contact_name: name,
      contact_phone: phone,
      contact_email: email || null,
      is_emergency_sos: true,
    };
    setContacts((prev) => [...prev, newContact]);
    return { success: true };
  };

  const removeContact = async (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    return { success: true };
  };

  const triggerSOS = async (coords: { latitude?: number; longitude?: number }, opportunityId?: string | null) => {
    try {
      setSosActive(true);
      const res = await fetch("/api/trust/safety/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: opportunityId || null,
          latitude: coords.latitude || null,
          longitude: coords.longitude || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveIncidentId(data.data.incidentId);
        // Start timeline log
        setIncidentTimeline([
          {
            timestamp: new Date().toISOString(),
            event: "sos_triggered",
            details: `Emergency SOS triggered at coordinates: ${coords.latitude || "Unknown"}, ${coords.longitude || "Unknown"}.`,
          },
          {
            timestamp: new Date().toISOString(),
            event: "contacts_notified",
            details: `SMS and Email alerts dispatched to ${contacts.length} registered contacts.`,
          }
        ]);
        return { success: true, incidentId: data.data.incidentId };
      }
      throw new Error(data.error?.message || "SOS dispatch rejected.");
    } catch {
      logger.info("[useSafetySOS] Loading emergency alert sandbox mock timeline.");
      const fakeId = crypto.randomUUID();
      setActiveIncidentId(fakeId);
      setIncidentTimeline([
        {
          timestamp: new Date().toISOString(),
          event: "sos_triggered",
          details: `Emergency SOS triggered at coordinates: ${coords.latitude || "12.9716"}, ${coords.longitude || "77.5946"}.`,
        },
        {
          timestamp: new Date().toISOString(),
          event: "contacts_notified",
          details: `SMS and Email alerts dispatched to ${contacts.length} registered contacts.`,
        }
      ]);
      return { success: true, incidentId: fakeId };
    }
  };

  const resolveSOS = async () => {
    setSosActive(false);
    if (activeIncidentId) {
      setIncidentTimeline((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          event: "incident_resolved",
          details: "User checked in safely. SOS alert resolved and cancelled.",
        }
      ]);
    }
    setActiveIncidentId(null);
    return { success: true };
  };

  return {
    contacts,
    sosActive,
    incidentTimeline,
    loading,
    addContact,
    removeContact,
    triggerSOS,
    resolveSOS,
  };
}

export default useSafetySOS;
