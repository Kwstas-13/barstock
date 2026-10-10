import { useEffect, useState } from "react";
import api from "../api/client";
import StockLossForm from "../components/StockLossForm";
import { LOSS_TYPE_LABELS, MANAGER_USER_ID } from "../constants";
import { useShift } from "../context/ShiftContext";
import { errorMessage, formatEuro } from "../utils/format";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("el-GR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function TillPage() {
  const { currentShift, isShiftOpen, isShiftPaused } = useShift();
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [losses, setLosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Συνταγές και προϊόντα φορτώνονται μία φορά
  useEffect(() => {
    Promise.all([api.get("/recipes/"), api.get("/products/")])
      .then(([recRes, prodRes]) => {
        setRecipes(recRes.data);
        setProducts(prodRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Παραγγελίες και φύρα της τρέχουσας βάρδιας
  useEffect(() => {
    if (!currentShift) {
      setOrders([]);
      setLosses([]);
      return;
    }
    const params = { params: { shift_id: currentShift.id } };
    Promise.all([api.get("/orders/", params), api.get("/stock-losses/", params)])
      .then(([ordRes, lossRes]) => {
        setOrders(ordRes.data);
        setLosses(lossRes.data);
      })
      .catch((err) => setError(err.message));
  }, [currentShift?.id]);

  // Η ειδοποίηση εξαφανίζεται μόνη της μετά από 2,5 δευτερόλεπτα
  useEffect(() => {
    if (!toast) return;
    const timerId = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timerId);
  }, [toast]);

  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

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

  function handleLossCreated(newLoss) {
    setLosses((prev) => [...prev, newLoss]);
    const name = productsById[newLoss.product_id]?.name ?? "Προϊόν";
    setToast({ ok: true, text: `💔 Φύρα ${name} καταχωρήθηκε` });
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

      {/* ΝΕΟ: Φύρα βάρδιας */}
      {currentShift && (
        <section style={{ marginTop: "2rem" }}>
          <h3>💔 Φύρα βάρδιας</h3>
          <StockLossForm products={products} onCreated={handleLossCreated} />

          {losses.length === 0 ? (
            <p>Δεν έχει καταχωρηθεί φύρα σε αυτή τη βάρδια.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ώρα</th>
                  <th>Προϊόν</th>
                  <th>Ποσότητα</th>
                  <th>Τύπος</th>
                  <th>Σχόλιο</th>
                </tr>
              </thead>
              <tbody>
                {losses.map((l) => {
                  const product = productsById[l.product_id];
                  return (
                    <tr key={l.id}>
                      <td>{formatTime(l.recorded_at)}</td>
                      <td>{product?.name ?? `#${l.product_id}`}</td>
                      <td>{l.quantity_ml} {product?.unit ?? "ml"}</td>
                      <td>{LOSS_TYPE_LABELS[l.loss_type] ?? l.loss_type}</td>
                      <td>{l.note ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

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