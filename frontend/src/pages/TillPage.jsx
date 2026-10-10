import { useEffect, useState } from "react";
import api from "../api/client";
import { MANAGER_USER_ID } from "../constants";
import { useShift } from "../context/ShiftContext";
import { errorMessage, formatEuro } from "../utils/format";

function TillPage() {
  const { currentShift, isShiftOpen, isShiftPaused } = useShift();
  const [recipes, setRecipes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Οι συνταγές φορτώνονται μία φορά
  useEffect(() => {
    api.get("/recipes/")
      .then((res) => setRecipes(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Οι παραγγελίες της τρέχουσας βάρδιας, ξανά όποτε αλλάζει βάρδια
  useEffect(() => {
    if (!currentShift) {
      setOrders([]);
      return;
    }
    api.get("/orders/", { params: { shift_id: currentShift.id } })
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.message));
  }, [currentShift?.id]);

  // Η ειδοποίηση εξαφανίζεται μόνη της μετά από 2,5 δευτερόλεπτα
  useEffect(() => {
    if (!toast) return;
    const timerId = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timerId);
  }, [toast]);

  const countByRecipe = {};
  for (const o of orders) {
    countByRecipe[o.recipe_id] = (countByRecipe[o.recipe_id] ?? 0) + o.quantity;
  }
  const totalDrinks = orders.reduce((sum, o) => sum + o.quantity, 0);
  const revenue = orders.reduce((sum, o) => sum + (o.unit_price ?? 0) * o.quantity, 0);

  async function ringUp(recipe) {
    try {
      const res = await api.post("/orders/", {
        recipe_id: recipe.id,
        shift_id: currentShift.id,
        user_id: MANAGER_USER_ID,
        quantity: 1,
      });
      setOrders((prev) => [...prev, res.data]);
      setToast({ ok: true, text: `✅ ${recipe.name} χτυπήθηκε` });
    } catch (err) {
      setToast({ ok: false, text: `❌ ${recipe.name}: ${errorMessage(err)}` });
    }
  }

  if (loading) return <p>Φόρτωση...</p>;
  if (error) return <p>Σφάλμα: {error}</p>;

  const noticeStyle = {
    backgroundColor: "#fef9c3",
    border: "1px solid #fde047",
    borderRadius: "6px",
    padding: "0.75rem 1rem",
    margin: "0.5rem 0 1rem",
  };

  return (
    <div>
      <h2>🍸 Ταμείο</h2>

      {!currentShift && (
        <div style={noticeStyle}>⚪ Δεν υπάρχει ανοιχτή βάρδια. Πάτα <strong>▶ ΞΕΚΙΝΗΜΑ ΒΑΡΔΙΑΣ</strong>.</div>
      )}
      {isShiftPaused && (
        <div style={noticeStyle}>⏸ Η βάρδια είναι σε παύση. Πάτα <strong>▶ ΣΥΝΕΧΕΙΑ</strong> για να χτυπήσεις ποτά.</div>
      )}

      {currentShift && (
        <p style={{ fontSize: "1.1rem" }}>
          Βάρδια #{currentShift.id} · <strong>{totalDrinks}</strong> ποτά ·{" "}
          <strong>{formatEuro(revenue)}</strong>
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "12px",
        }}
      >
        {recipes.map((r) => {
          const count = countByRecipe[r.id] ?? 0;
          return (
            <button
              key={r.id}
              onClick={() => ringUp(r)}
              disabled={!isShiftOpen}
              style={{
                position: "relative",
                minHeight: "100px",
                fontSize: "1.1rem",
                borderRadius: "10px",
                padding: "0.75rem",
                cursor: isShiftOpen ? "pointer" : "not-allowed",
              }}
            >
              <div style={{ fontWeight: "bold" }}>
                {r.is_cocktail ? "🍸" : "🥃"} {r.name}
              </div>
              <div>{formatEuro(r.sell_price)}</div>

              {count > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "8px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    borderRadius: "999px",
                    padding: "0 0.5rem",
                    fontSize: "0.85rem",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: toast.ok ? "#16a34a" : "#dc2626",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            fontSize: "1.1rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

export default TillPage;