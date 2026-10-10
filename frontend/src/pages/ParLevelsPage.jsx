import { useEffect, useState } from "react";
import api from "../api/client";
import ParLevelForm from "../components/ParLevelForm";
import { SHIFT_STATUS_LABELS } from "../constants";
import { useShift } from "../context/ShiftContext";
import { errorMessage, formatDateTime } from "../utils/format";

function calcPercent(ideal, current) {
  const i = Number(ideal);
  const c = Number(current);
  return i > 0 ? Math.round((c / i) * 100) : 0;
}

function ParLevelsPage() {
  const { currentShift } = useShift();
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
  }, [currentShift?.id, currentShift?.status]);

  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  // Ομάδες: μία ανά βάρδια, η νεότερη πρώτη, μόνο όσες έχουν par levels
  const groups = [...shifts]
    .sort((a, b) => b.id - a.id)
    .map((shift) => ({
      shift,
      rows: parLevels
  .filter((pl) => pl.shift_id === shift.id)
  .sort((a, b) =>
    (productsById[a.product_id]?.name ?? "").localeCompare(productsById[b.product_id]?.name ?? "", "el")
  ),
    }))
    .filter((group) => group.rows.length > 0);

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
      alert(`Η διαγραφή απέτυχε: ${errorMessage(err)}`);
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
      alert(`Η αποθήκευση απέτυχε: ${errorMessage(err)}`);
    }
  }

  function renderRow(pl) {
    const unit = productsById[pl.product_id]?.unit ?? "ml";
    const isEditing = editingId === pl.id;
    const values = isEditing ? editForm : pl;

    const percent = calcPercent(values.ideal_quantity_ml, values.current_quantity_ml);
    const isLow = percent < Number(values.threshold_percent);

    return (
      <tr key={pl.id} style={isLow ? { backgroundColor: "#ffe5e5" } : undefined}>
        <td>{productsById[pl.product_id]?.name ?? `#${pl.product_id}`}</td>

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
              <span> {unit}</span>
            </td>
            <td>
              <input
                name="current_quantity_ml"
                type="number"
                min="0"
                value={editForm.current_quantity_ml}
                onChange={handleEditChange}
              />
              <span> {unit}</span>
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
            <td>{pl.ideal_quantity_ml} {unit}</td>
            <td>{pl.current_quantity_ml} {unit}</td>
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
  }

  function renderTable(rows) {
    return (
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Προϊόν</th>
            <th>Ιδανικό</th>
            <th>Τρέχον</th>
            <th>Όριο</th>
            <th>%</th>
            <th>Κατάσταση</th>
            <th></th>
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    );
  }

  if (loading) return <p>Φόρτωση...</p>;
  if (error) return <p>Σφάλμα: {error}</p>;

  return (
    <div>
      <h2>Par Levels</h2>
      <ParLevelForm products={products} shifts={shifts} onCreated={handleCreated} />

      {groups.length === 0 && <p>Δεν υπάρχουν par levels ακόμα.</p>}

      {groups.map(({ shift, rows }) => {
        const title = (
          <>
            <strong>Βάρδια #{shift.id}</strong> · {formatDateTime(shift.started_at)} ·{" "}
            {SHIFT_STATUS_LABELS[shift.status] ?? shift.status}
          </>
        );

        if (shift.status !== "CLOSED") {
          return (
            <div
              key={shift.id}
              style={{
                border: "3px solid #1f2937",
                borderRadius: "8px",
                padding: "0.75rem",
                margin: "1rem 0",
              }}
            >
              <div style={{ marginBottom: "0.5rem" }}>{title}</div>
              {renderTable(rows)}
            </div>
          );
        }

        return (
          <details
            key={shift.id}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "0.5rem 0.75rem",
              margin: "0.5rem 0",
            }}
          >
            <summary style={{ cursor: "pointer" }}>{title}</summary>
            {renderTable(rows)}
          </details>
        );
      })}
    </div>
  );
}

export default ParLevelsPage;