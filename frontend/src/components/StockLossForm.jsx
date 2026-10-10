import { useState } from "react";
import api from "../api/client";
import { LOSS_TYPE_OPTIONS, MANAGER_USER_ID, STANDARD_POUR_ML } from "../constants";
import { useShift } from "../context/ShiftContext";
import { errorMessage } from "../utils/format";

const emptyForm = {
  product_id: "",
  quantity: "",
  mode: "pour",
  loss_type: "STAFF_DRINK",
  note: "",
};

// Τρόποι μέτρησης ανάλογα με τη μονάδα του προϊόντος
function modesFor(product) {
  if (!product) return [];
  if (product.unit === "ml") {
    return [
      { value: "pour", label: `ποτά (${STANDARD_POUR_ML} ml)` },
      { value: "package", label: `φιάλες (${product.bottle_size_ml} ml)` },
      { value: "raw", label: "ml" },
    ];
  }
  return [
    { value: "raw", label: product.unit },
    { value: "package", label: `συσκευασίες (${product.bottle_size_ml} ${product.unit})` },
  ];
}

// Μετατροπή σε μονάδες βάσης (ml ή τεμ), όπως τις αποθηκεύει το backend
function toBaseUnits(quantity, mode, product) {
  const q = Number(quantity);
  if (!product || !(q > 0)) return 0;
  if (mode === "pour") return Math.round(q * STANDARD_POUR_ML);
  if (mode === "package") return Math.round(q * product.bottle_size_ml);
  return Math.round(q);
}

function StockLossForm({ products, onCreated }) {
  const { currentShift, isShiftOpen } = useShift();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const selectedProduct = products.find((p) => p.id === Number(form.product_id));
  const modes = modesFor(selectedProduct);
  const baseAmount = toBaseUnits(form.quantity, form.mode, selectedProduct);
  const noteRequired = form.loss_type === "OTHER";

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "product_id") {
      // Νέο προϊόν → προεπιλογή: "ποτά" για ml, "τεμ" για γαρνιτούρες
      const product = products.find((p) => p.id === Number(value));
      const defaultMode = product?.unit === "ml" ? "pour" : "raw";
      setForm({ ...form, product_id: value, mode: defaultMode });
      return;
    }

    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (baseAmount <= 0) {
      setError("Η ποσότητα πρέπει να είναι μεγαλύτερη από 0.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/stock-losses/", {
        product_id: Number(form.product_id),
        shift_id: currentShift.id,
        user_id: MANAGER_USER_ID,
        quantity_ml: baseAmount,
        loss_type: form.loss_type,
        note: form.note.trim() || null,
      });
      onCreated(res.data);
      setForm(emptyForm);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={!isShiftOpen} style={{ border: "none", padding: 0, margin: 0 }}>
        <select name="product_id" value={form.product_id} onChange={handleChange} required>
          <option value="">-- Προϊόν --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <input
          name="quantity"
          type="number"
          min="0.5"
          step="0.5"
          placeholder="Ποσότητα"
          value={form.quantity}
          onChange={handleChange}
          required
        />

        <select name="mode" value={form.mode} onChange={handleChange} disabled={!selectedProduct}>
          {modes.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {baseAmount > 0 && (
          <span style={{ color: "#6b7280" }}> = {baseAmount} {selectedProduct.unit} </span>
        )}

        <select name="loss_type" value={form.loss_type} onChange={handleChange}>
          {LOSS_TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <input
          name="note"
          placeholder={noteRequired ? "Σχόλιο (υποχρεωτικό)" : "Σχόλιο (προαιρετικό)"}
          value={form.note}
          onChange={handleChange}
          required={noteRequired}
        />

        <button type="submit" disabled={saving}>
          {saving ? "..." : "Καταχώρηση"}
        </button>
      </fieldset>

      {error && <p style={{ color: "red" }}>Σφάλμα: {error}</p>}
    </form>
  );
}

export default StockLossForm;