import { useEffect, useState } from "react";
import api from "../api/client";
import ParLevelForm from "../components/ParLevelForm";
import { formatShift } from "../utils/format";

function ParLevelsPage() {
  const [parLevels, setParLevels] = useState([]);
  const [products, setProducts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/par-levels/"),
      api.get("/products/"),
      api.get("/shifts/"),
    ])
      .then(([parRes, prodRes, shiftRes]) => {
        setParLevels(parRes.data);
        setProducts(prodRes.data);
        setShifts(shiftRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));
  const shiftsById = Object.fromEntries(shifts.map((s) => [s.id, s]));

  function handleCreated(newParLevel) {
    setParLevels((prev) => [...prev, newParLevel]);
  }

  async function handleDelete(parLevel) {
    const name = productsById[parLevel.product_id]?.name ?? "αυτό το par level";
    const ok = window.confirm(`Διαγραφή par level για "${name}";`);
    if (!ok) return;

    try {
      await api.delete(`/par-levels/${parLevel.id}`);
      setParLevels((prev) => prev.filter((pl) => pl.id !== parLevel.id));
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(`Η διαγραφή απέτυχε: ${detail ?? err.message}`);
    }
  }

  if (loading) return <p>Φόρτωση...</p>;
  if (error) return <p>Σφάλμα: {error}</p>;

  return (
    <div>
      <h2>Par Levels</h2>
      <ParLevelForm products={products} shifts={shifts} onCreated={handleCreated} />

      {parLevels.length === 0 ? (
        <p>Δεν υπάρχουν par levels ακόμα.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Προϊόν</th>
              <th>Βάρδια</th>
              <th>Ιδανικό</th>
              <th>Τρέχον</th>
              <th>%</th>
              <th>Κατάσταση</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {parLevels.map((pl) => {
              const percent =
                pl.ideal_quantity_ml > 0
                  ? Math.round((pl.current_quantity_ml / pl.ideal_quantity_ml) * 100)
                  : 0;
              const isLow = percent < pl.threshold_percent;

              return (
                <tr key={pl.id} style={isLow ? { backgroundColor: "#ffe5e5" } : undefined}>
                  <td>{productsById[pl.product_id]?.name ?? `#${pl.product_id}`}</td>
                  <td>{formatShift(shiftsById[pl.shift_id])}</td>
                  <td>{pl.ideal_quantity_ml} ml</td>
                  <td>{pl.current_quantity_ml} ml</td>
                  <td>{percent}%</td>
                  <td>{isLow ? "⚠️ Χαμηλό" : "✅ OK"}</td>
                  <td>
                    <button onClick={() => handleDelete(pl)}>🗑</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ParLevelsPage;