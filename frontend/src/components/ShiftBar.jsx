import { useState } from "react";
import { useShift } from "../context/ShiftContext";

function ShiftBar() {
  const { currentShift, loading, openShift, closeShift } = useShift();
  const [busy, setBusy] = useState(false);

  async function handleOpen() {
    setBusy(true);
    try {
      await openShift();
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(`Το άνοιγμα απέτυχε: ${detail ?? err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    const ok = window.confirm(`Κλείσιμο της βάρδιας #${currentShift.id};`);
    if (!ok) return;

    setBusy(true);
    try {
      await closeShift();
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(`Το κλείσιμο απέτυχε: ${detail ?? err.message}`);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>Φόρτωση βάρδιας...</p>;

  const barStyle = { padding: "0.5rem 1rem", margin: "0.75rem 0", borderRadius: "6px" };

  if (currentShift) {
    const since = new Date(currentShift.started_at).toLocaleString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div style={{ ...barStyle, backgroundColor: "#dcfce7" }}>
        🟢 <strong>Βάρδια #{currentShift.id}</strong> ανοιχτή από {since}{" "}
        <button onClick={handleClose} disabled={busy}>
          ⏹ ΚΛΕΙΣΙΜΟ ΒΑΡΔΙΑΣ
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...barStyle, backgroundColor: "#f3f4f6" }}>
      ⚪ Καμία ανοιχτή βάρδια{" "}
      <button onClick={handleOpen} disabled={busy}>
        ▶ ΞΕΚΙΝΗΜΑ ΒΑΡΔΙΑΣ
      </button>
    </div>
  );
}

export default ShiftBar;