import { useState } from "react";
import api from "../api/client";
import { CATEGORIES } from "../constants";
import { toNumberOrNull } from "../utils/format";

const emptyForm = { name: "", category: "SPIRIT", bottle_size_ml: 700, bottle_cost: "" };

function ProductForm({ onCreated }) {
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
      const res = await api.post("/products/", {
        name: form.name.trim(),
        category: form.category,
        bottle_size_ml: Number(form.bottle_size_ml),
        bottle_cost: toNumberOrNull(form.bottle_cost),
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
      <h3>Νέο προϊόν</h3>

      <input
        name="name"
        placeholder="Όνομα"
        value={form.name}
        onChange={handleChange}
        required
      />

      <select name="category" value={form.category} onChange={handleChange}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <input
        name="bottle_size_ml"
        type="number"
        min="1"
        value={form.bottle_size_ml}
        onChange={handleChange}
        required
      />
      <span> ml </span>

      <input
        name="bottle_cost"
        type="number"
        min="0"
        step="0.01"
        placeholder="Κόστος (€)"
        value={form.bottle_cost}
        onChange={handleChange}
      />

      <button type="submit" disabled={saving}>
        {saving ? "Αποθήκευση..." : "Προσθήκη"}
      </button>

      {error && <p style={{ color: "red" }}>Σφάλμα: {error}</p>}
    </form>
  );
}

export default ProductForm;