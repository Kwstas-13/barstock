import { useEffect, useState } from "react";
import api from "../api/client";
import ParLevelForm from "../components/ParLevelForm";
import { formatShift } from "../utils/format";

function calcPercent(ideal, current) {
  const i = Number(ideal);
  const c = Number(current);
  return i > 0 ? Math.round((c / i) * 100) : 0;
}

function ParLevelsPage() {
  const [parLevels, setParLevels] = useState([]);
  const [products, setProducts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  function startEdit(parLevel) {
    setEditingId(parLevel.id);
    setEditForm({
      ideal_quantity_ml: parLevel.ideal_quantity_ml,
      current_quantity_ml: parLevel.current_quantity_ml,
      threshold_percent: parLevel.threshold_percent,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  }

  async function saveEdit(id) {
    try {
      const res = await api.put(`/par-levels/${id}`, {
        ideal_quantity_ml: Number(editForm.ideal_quantity_ml),
        current_quantity_ml: Number(editForm.current_quantity_ml),
        threshold_percent: Number(editForm.threshold_percent),
      });
      setParLevels((prev) => prev.map((pl) => (pl.id === id ? res.data : pl)));
      setEditingId(null);
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(`Η αποθήκευση απέτυχε: ${detail ? JSON.stringify(detail) : err.message}`);
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
              <th>Όριο</th>
              <th>%</th>
              <th>Κατάσταση</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {parLevels.map((pl) => {
              const isEditing = editingId === pl.id;
              const values = isEditing ? editForm : pl;

              const percent = calcPercent(values.ideal_quantity_ml, values.current_quantity_ml);
              const isLow = percent < Number(values.threshold_percent);

              return (
                <tr key={pl.id} style={isLow ? { backgroundColor: "#ffe5e5" } : undefined}>
                  <td>{productsById[pl.product_id]?.name ?? `#${pl.product_id}`}</td>
                  <td>{formatShift(shiftsById[pl.shift_id])}</td>

                  {isEditing ? (
                    <>
                      <td>
                        <input
                          name="ideal_quantity_ml"
                          type="number"
                          min="1"
                          value={editForm.ideal_quantity_ml}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          name="current_quantity_ml"
                          type="number"
                          min="0"
                          value={editForm.current_quantity_ml}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          name="threshold_percent"
                          type="number"
                          min="1"
                          max="100"
                          value={editForm.threshold_percent}
                          onChange={handleEditChange}
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{pl.ideal_quantity_ml} ml</td>
                      <td>{pl.current_quantity_ml} ml</td>
                      <td>{pl.threshold_percent}%</td>
                    </>
                  )}

                  <td>{percent}%</td>
                  <td>{isLow ? "⚠️ Χαμηλό" : "✅ OK"}</td>
                  <td>
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(pl.id)}>💾</button>
                        <button onClick={cancelEdit}>✖</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(pl)}>✏️</button>
                        <button onClick={() => handleDelete(pl)}>🗑</button>
                      </>
                    )}
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