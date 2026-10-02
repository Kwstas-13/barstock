import { useEffect, useState } from "react";
import api from "../api/client";

function RecipeIngredients({ recipe, products }) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/recipe-ingredients/", { params: { recipe_id: recipe.id } })
      .then((res) => setIngredients(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [recipe.id]);

  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));
  const totalMl = ingredients.reduce((sum, i) => sum + i.quantity_ml, 0);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await api.post("/recipe-ingredients/", {
        recipe_id: recipe.id,
        product_id: Number(productId),
        quantity_ml: Number(quantity),
      });
      setIngredients((prev) => [...prev, res.data]);
      setProductId("");
      setQuantity("");
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(`Η προσθήκη απέτυχε: ${detail ? JSON.stringify(detail) : err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const name = productsById[item.product_id]?.name ?? "το συστατικό";
    const ok = window.confirm(`Αφαίρεση "${name}" από ${recipe.name};`);
    if (!ok) return;

    try {
      await api.delete(`/recipe-ingredients/${item.id}`);
      setIngredients((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(`Η διαγραφή απέτυχε: ${detail ?? err.message}`);
    }
  }

  if (loading) return <p>Φόρτωση συστατικών...</p>;
  if (error) return <p>Σφάλμα: {error}</p>;

  return (
    <div>
      <h3>Συστατικά: {recipe.name}</h3>

      {ingredients.length === 0 ? (
        <p>Δεν έχει συστατικά ακόμα.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Προϊόν</th>
              <th>Ποσότητα</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((i) => (
              <tr key={i.id}>
                <td>{productsById[i.product_id]?.name ?? `#${i.product_id}`}</td>
                <td>{i.quantity_ml} ml</td>
                <td>
                  <button onClick={() => handleDelete(i)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Σύνολο</strong></td>
              <td><strong>{totalMl} ml</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}

      <form onSubmit={handleAdd}>
        <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
          <option value="">-- Προϊόν --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          placeholder="ml"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <button type="submit" disabled={saving}>
          {saving ? "..." : "Προσθήκη συστατικού"}
        </button>
      </form>
    </div>
  );
}

export default RecipeIngredients;