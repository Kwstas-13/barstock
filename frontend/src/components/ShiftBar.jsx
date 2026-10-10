import { useEffect, useState } from "react";
import { useShift } from "../context/ShiftContext";

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatFullDate(isoString) {
  return new Date(isoString).toLocaleString("el-GR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ShiftBar() {
  const { currentShift, loading, openShift, pauseShift, resumeShift, closeShift } = useShift();
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timerId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timerId);
  }, []);

  async function run(action, errorLabel) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(`${errorLabel}: ${detail ?? err.message}`);
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    const ok = window.confirm(`Οριστικό κλείσιμο της βάρδιας #${currentShift.id};`);
    if (ok) run(closeShift, "Το κλείσιμο απέτυχε");
  }

  if (loading) return <p>Φόρτωση βάρδιας...</p>;

  const barStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    flexWrap: "wrap",
    padding: "0.6rem 1rem",
    margin: "0.75rem 0",
    borderRadius: "6px",
  };
  const bigButton = { fontSize: "1.1rem", fontWeight: "bold", padding: "0.5rem 1.5rem" };
  const smallButton = { fontSize: "0.8rem", padding: "0.25rem 0.6rem" };

  if (!currentShift) {
    return (
      <div style={{ ...barStyle, backgroundColor: "#f3f4f6" }}>
        <span>⚪ Καμία ανοιχτή βάρδια</span>
        <button style={bigButton} onClick={() => run(openShift, "Το άνοιγμα απέτυχε")} disabled={busy}>
          ▶ ΞΕΚΙΝΗΜΑ ΒΑΡΔΙΑΣ
        </button>
      </div>
    );
  }

  const isPaused = currentShift.status === "PAUSED";
  const elapsed = formatElapsed(now - new Date(currentShift.started_at).getTime());

  return (
    <div style={{ ...barStyle, backgroundColor: isPaused ? "#fef9c3" : "#dcfce7" }}>
      <span>
        {isPaused ? "🟡" : "🟢"} <strong>Βάρδια #{currentShift.id}</strong> ·{" "}
        {formatFullDate(currentShift.started_at)}
      </span>

      <span style={{ fontFamily: "monospace", fontSize: "1.1rem" }}>
        {isPaused ? "⏸ σε παύση" : `⏱ ${elapsed}`}
      </span>

      {isPaused ? (
        <button style={bigButton} onClick={() => run(resumeShift, "Η συνέχεια απέτυχε")} disabled={busy}>
          ▶ ΣΥΝΕΧΕΙΑ
        </button>
      ) : (
        <button style={bigButton} onClick={() => run(pauseShift, "Η παύση απέτυχε")} disabled={busy}>
          ⏸ ΠΑΥΣΗ
        </button>
      )}

      <button style={smallButton} onClick={handleClose} disabled={busy}>
        ⏹ Κλείσιμο βάρδιας
      </button>
    </div>
  );
}

export default ShiftBar;