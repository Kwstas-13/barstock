import { useEffect, useState } from "react";
import api from "../api/client";
import { POUR_COST_TARGET } from "../constants";
import { useShift } from "../context/ShiftContext";
import { costPerMl, errorMessage, formatEuro, toNumberOrNull } from "../utils/format";

const LOCKED_TITLE = "Κλειδωμένο όσο η βάρδια είναι ανοιχτή";
const fieldsetStyle = { border: "none", padding: 0, margin: 0 };

function RecipeIngredients({ recipe, products, onRecipeUpdated }) {
  const { isShiftOpen } = useShift();
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

  function unitOf(id) {
    return productsById[id]?.unit ?? "ml";
  }

  function ingredientCost(item) {
    const product = productsById[item.product_id];
    if (!product) return null;
    const perUnit = costPerMl(product.bottle_cost, product.bottle_size_ml);
    return perUnit === null ? null : perUnit * item.quantity_ml;
  }

  const totalLiquidMl = ingredients
    .filter((i) => unitOf(i.product_id) === "ml")
    .reduce((sum, i) => sum + i.quantity_ml, 0);

  const costs = ingredients.map(ingredientCost);
  const missingCost = costs.some((c) => c === null);
  const totalCost = costs.reduce((sum, c) => sum + (c ?? 0), 0);

  const sellPrice = recipe.sell_price;
  const pourCost =
    sellPrice > 0 && ingredients.length > 0 && !missingCost
      ? (totalCost / sellPrice) * 100
      : null;
  const onTarget = pourCost !== null && pourCost <= POUR_COST_TARGET;

  const selectedUnit = productId ? unitOf(productId) : "";

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
      alert(`Η προσθήκη απέτυχε: ${errorMessage(err)}`);
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
      alert(`Η διαγραφή απέτυχε: ${errorMessage(err)}`);
    }
  }

  async function handleSavePrice() {
    try {
      const res = await api.put(`/recipes/${recipe.id}`, {
        sell_price: toNumberOrNull(priceInput),
      });
      onRecipeUpdated(res.data);
    } catch (err) {
      alert(`Η αποθήκευση απέτυχε: ${errorMessage(err)}`);
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
                <td>{i.quantity_ml} {unitOf(i.product_id)}</td>
                <td>{formatEuro(costs[index])}</td>
                <td>
                  <button
                    onClick={() => handleDelete(i)}
                    disabled={isShiftOpen}
                    title={isShiftOpen ? LOCKED_TITLE : "Αφαίρεση"}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Σύνολο</strong></td>
              <td><strong>{totalLiquidMl} ml υγρά</strong></td>
              <td><strong>{formatEuro(totalCost)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}

      {missingCost && (
        <p style={{ color: "#b45309" }}>
          ⚠️ Κάποια προϊόντα δεν έχουν κόστος. Συμπλήρωσέ το στη σελίδα Προϊόντα.
        </p>
      )}

      <form onSubmit={handleAdd}>
        <fieldset disabled={isShiftOpen} style={fieldsetStyle}>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
            <option value="">-- Προϊόν --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Ποσότητα"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          <span> {selectedUnit} </span>

          <button type="submit" disabled={saving}>
            {saving ? "..." : "Προσθήκη συστατικού"}
          </button>
        </fieldset>
      </form>

      <h4>Τιμή & Pour cost</h4>

      <fieldset disabled={isShiftOpen} style={fieldsetStyle}>
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
      </fieldset>

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