import { useShift } from "../context/ShiftContext";

function LockNotice() {
  const { currentShift, isShiftOpen } = useShift();

  if (!isShiftOpen) return null;

  return (
    <div
      style={{
        backgroundColor: "#fee2e2",
        border: "1px solid #fca5a5",
        borderRadius: "6px",
        padding: "0.5rem 1rem",
        margin: "0.5rem 0",
      }}
    >
      🔒 Η βάρδια #{currentShift.id} είναι ανοιχτή. Πάτα <strong>⏸ ΠΑΥΣΗ</strong> για να
      κάνεις αλλαγές.
    </div>
  );
}

export default LockNotice;