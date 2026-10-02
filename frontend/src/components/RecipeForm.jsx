import { useState } from "react";
import api from "../api/client";

const emptyForm = { name: "", is_cocktail: true };

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

      <button type="submit" disabled={saving}>
        {saving ? "Αποθήκευση..." : "Προσθήκη"}
      </button>

      {error && <p style={{ color: "red" }}>Σφάλμα: {error}</p>}
    </form>
  );
}

export default RecipeForm;