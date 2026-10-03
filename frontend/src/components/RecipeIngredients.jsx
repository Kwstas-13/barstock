import { useEffect, useState } from "react";
import api from "../api/client";
import { POUR_COST_TARGET } from "../constants";
import { costPerMl, formatEuro, toNumberOrNull } from "../utils/format";

function RecipeIngredients({ recipe, products, onRecipeUpdated }) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  const [priceInput, setPriceInput] = useState(recipe.sell_price ?? "");

  useEffect(() => {
    api.get("/recipe-ingredients/", { params: { recipe_id: recipe.id } })
      .then((res) => setIngredients(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [recipe.id]);

  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  function ingredientCost(item) {
    const product = productsById[item.product_id];
    if (!product) return null;
    const perMl = costPerMl(product.bottle_cost, product.bottle_size_ml);
    return perMl === null ? null : perMl * item.quantity_ml;
  }

  const totalMl = ingredients.reduce((sum, i) => sum + i.quantity_ml, 0);
  const costs = ingredients.map(ingredientCost);
  const missingCost = costs.some((c) => c === null);
  const totalCost = costs.reduce((sum, c) => sum + (c ?? 0), 0);

  const sellPrice = recipe.sell_price;
  const pourCost =
    sellPrice > 0 && ingredients.length > 0 && !missingCost
      ? (totalCost / sellPrice) * 100
      : null;
  const onTarget = pourCost !== null && pourCost <= POUR_COST_TARGET;

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

  async function handleSavePrice() {
    try {
      const res = await api.put(`/recipes/${recipe.id}`, {
        sell_price: toNumberOrNull(priceInput),
      });
      onRecipeUpdated(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(`Η αποθήκευση απέτυχε: ${detail ? JSON.stringify(detail) : err.message}`);
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
              <th>Κόστος</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((i, index) => (
              <tr key={i.id}>
                <td>{productsById[i.product_id]?.name ?? `#${i.product_id}`}</td>
                <td>{i.quantity_ml} ml</td>
                <td>{formatEuro(costs[index])}</td>
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
              <td><strong>{formatEuro(totalCost)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}

      {missingCost && (
        <p style={{ color: "#b45309" }}>
          ⚠️ Κάποια προϊόντα δεν έχουν κόστος φιάλης. Συμπλήρωσέ το στη σελίδα Προϊόντα.
        </p>
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

      <h4>Τιμή & Pour cost</h4>

      <div>
        Τιμή πώλησης:{" "}
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="€"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
        />
        <button onClick={handleSavePrice}>💾</button>
      </div>

      <p>
        Pour cost:{" "}
        {pourCost === null ? (
          "—"
        ) : (
          <strong style={{ color: onTarget ? "green" : "red" }}>
            {pourCost.toFixed(1)}% {onTarget ? "✅" : "⚠️"} (στόχος ≤ {POUR_COST_TARGET}%)
          </strong>
        )}
      </p>
    </div>
  );
}

export default RecipeIngredients;