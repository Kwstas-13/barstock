import { useEffect, useState } from "react";
import api from "../api/client";
import RecipeForm from "../components/RecipeForm";
import RecipeIngredients from "../components/RecipeIngredients";

function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/recipes/"), api.get("/products/")])
      .then(([recRes, prodRes]) => {
        setRecipes(recRes.data);
        setProducts(prodRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedRecipe = recipes.find((r) => r.id === selectedId);

  function handleCreated(newRecipe) {
    setRecipes((prev) => [...prev, newRecipe]);
  }

  async function handleDelete(recipe) {
    const ok = window.confirm(`Διαγραφή της συνταγής "${recipe.name}";`);
    if (!ok) return;

    try {
      await api.delete(`/recipes/${recipe.id}`);
      setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
      if (selectedId === recipe.id) setSelectedId(null);
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(`Η διαγραφή απέτυχε: ${detail ?? err.message}`);
    }
  }

  if (loading) return <p>Φόρτωση...</p>;
  if (error) return <p>Σφάλμα: {error}</p>;

  return (
    <div>
      <h2>Συνταγές</h2>
      <RecipeForm onCreated={handleCreated} />

      {recipes.length === 0 ? (
        <p>Δεν υπάρχουν συνταγές ακόμα.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Όνομα</th>
              <th>Τύπος</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => (
              <tr
                key={r.id}
                style={r.id === selectedId ? { backgroundColor: "#e5f0ff" } : undefined}
              >
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>{r.is_cocktail ? "🍸 Κοκτέιλ" : "🥃 Απλό"}</td>
                <td>
                  <button onClick={() => setSelectedId(r.id)}>🧾</button>
                  <button onClick={() => handleDelete(r)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedRecipe && (
        <RecipeIngredients
          key={selectedRecipe.id}
          recipe={selectedRecipe}
          products={products}
        />
      )}
    </div>
  );
}

export default RecipesPage;