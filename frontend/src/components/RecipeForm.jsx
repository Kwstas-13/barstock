import { useState } from "react";
import api from "../api/client";
import { toNumberOrNull } from "../utils/format";

const emptyForm = { name: "", is_cocktail: true, sell_price: "" };

function RecipeForm({ onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await api.post("/recipes/", {
        name: form.name.trim(),
        is_cocktail: form.is_cocktail,
        sell_price: toNumberOrNull(form.sell_price),
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
      <h3>Νέα συνταγή</h3>

      <input
        name="name"
        placeholder="Όνομα (π.χ. Mojito)"
        value={form.name}
        onChange={handleChange}
        required
      />

      <label>
        <input
          name="is_cocktail"
          type="checkbox"
          checked={form.is_cocktail}
          onChange={handleChange}
        />
        Κοκτέιλ
      </label>

      <input
        name="sell_price"
        type="number"
        min="0"
        step="0.01"
        placeholder="Τιμή πώλησης (€)"
        value={form.sell_price}
        onChange={handleChange}
      />

      <button type="submit" disabled={saving}>
        {saving ? "Αποθήκευση..." : "Προσθήκη"}
      </button>

      {error && <p style={{ color: "red" }}>Σφάλμα: {error}</p>}
    </form>
  );
}

export default RecipeForm;