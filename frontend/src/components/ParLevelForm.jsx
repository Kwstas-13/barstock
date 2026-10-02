import { useState } from "react";
import api from "../api/client";
import { formatShift } from "../utils/format";

function ParLevelForm({ products, shifts, onCreated }) {
  const openShift = shifts.find((s) => s.status === "OPEN");

  const emptyForm = {
    product_id: "",
    shift_id: openShift ? String(openShift.id) : "",
    ideal_quantity_ml: "",
    current_quantity_ml: "",
    threshold_percent: 30,
  };

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await api.post("/par-levels/", {
        product_id: Number(form.product_id),
        shift_id: Number(form.shift_id),
        ideal_quantity_ml: Number(form.ideal_quantity_ml),
        current_quantity_ml: Number(form.current_quantity_ml),
        threshold_percent: Number(form.threshold_percent),
      });
      onCreated(res.data);
      setForm(emptyForm);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail ? JSON.stringify(detail) : err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Νέο par level</h3>

      <select name="product_id" value={form.product_id} onChange={handleChange} required>
        <option value="">-- Προϊόν --</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <select name="shift_id" value={form.shift_id} onChange={handleChange} required>
        <option value="">-- Βάρδια --</option>
        {shifts.map((s) => (
          <option key={s.id} value={s.id}>{formatShift(s)}</option>
        ))}
      </select>

      <input
        name="ideal_quantity_ml"
        type="number"
        min="1"
        placeholder="Ιδανικό (ml)"
        value={form.ideal_quantity_ml}
        onChange={handleChange}
        required
      />

      <input
        name="current_quantity_ml"
        type="number"
        min="0"
        placeholder="Τρέχον (ml)"
        value={form.current_quantity_ml}
        onChange={handleChange}
        required
      />

      <input
        name="threshold_percent"
        type="number"
        min="1"
        max="100"
        value={form.threshold_percent}
        onChange={handleChange}
        required
      />
      <span> % όριο </span>

      <button type="submit" disabled={saving}>
        {saving ? "Αποθήκευση..." : "Προσθήκη"}
      </button>

      {error && <p style={{ color: "red" }}>Σφάλμα: {error}</p>}
    </form>
  );
}

export default ParLevelForm;