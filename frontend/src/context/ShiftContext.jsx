import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import { MANAGER_USER_ID } from "../constants";

const ShiftContext = createContext(null);

export function ShiftProvider({ children }) {
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/shifts/")
      .then((res) => {
        const active = res.data.find((s) => s.status !== "CLOSED");
        setCurrentShift(active ?? null);
      })
      .catch((err) => alert(`Σφάλμα φόρτωσης βάρδιας: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  async function openShift() {
    const res = await api.post("/shifts/", { opened_by_user_id: MANAGER_USER_ID });
    setCurrentShift(res.data);
  }

  async function pauseShift() {
    const res = await api.post(`/shifts/${currentShift.id}/pause`);
    setCurrentShift(res.data);
  }

  async function resumeShift() {
    const res = await api.post(`/shifts/${currentShift.id}/resume`);
    setCurrentShift(res.data);
  }

  async function closeShift() {
    if (!currentShift) return;
    await api.post(`/shifts/${currentShift.id}/close`);
    setCurrentShift(null);
  }

  const value = {
    currentShift,
    isShiftOpen: currentShift?.status === "OPEN",
    isShiftPaused: currentShift?.status === "PAUSED",
    loading,
    openShift,
    pauseShift,
    resumeShift,
    closeShift,
  };

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useShift() {
  return useContext(ShiftContext);
}