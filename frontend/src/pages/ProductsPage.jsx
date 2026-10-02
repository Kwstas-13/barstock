import { useEffect, useState } from "react";
import api from "../api/client";
import ProductForm from "../components/ProductForm";
import { CATEGORIES } from "../constants";

const emptyForm = { name: "", category: "SPIRIT", bottle_size_ml: 700 };
function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    api.get("/products/")
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(newProduct) {
    setProducts((prev) => [...prev, newProduct]);
  }

  async function handleDelete(product) {
    const ok = window.confirm(`Διαγραφή του "${product.name}";`);
    if (!ok) return;

    try {
      await api.delete(`/products/${product.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(`Η διαγραφή απέτυχε: ${detail ?? err.message}`);
    }
  }

  function startEdit(product) {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      category: product.category,
      bottle_size_ml: product.bottle_size_ml,
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
      const res = await api.put(`/products/${id}`, {
        name: editForm.name.trim(),
        category: editForm.category,
        bottle_size_ml: Number(editForm.bottle_size_ml),
      });
      setProducts((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      setEditingId(null);
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(`Η αποθήκευση απέτυχε: ${detail ? JSON.stringify(detail) : err.message}`);
    }
  }

  if (loading) return <p>Φόρτωση...</p>;
  if (error) return <p>Σφάλμα: {error}</p>;

  return (
    <div>
      <h2>Προϊόντα</h2>
      <ProductForm onCreated={handleCreated} />

      {products.length === 0 ? (
        <p>Δεν υπάρχουν προϊόντα ακόμα.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Όνομα</th>
              <th>Κατηγορία</th>
              <th>Μέγεθος φιάλης</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) =>
              editingId === p.id ? (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    <input name="name" value={editForm.name} onChange={handleEditChange} />
                  </td>
                  <td>
                    <select name="category" value={editForm.category} onChange={handleEditChange}>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      name="bottle_size_ml"
                      type="number"
                      min="1"
                      value={editForm.bottle_size_ml}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td>
                    <button onClick={() => saveEdit(p.id)}>💾</button>
                    <button onClick={cancelEdit}>✖</button>
                  </td>
                </tr>
              ) : (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.bottle_size_ml} {p.unit}</td>
                  <td>
                    <button onClick={() => startEdit(p)}>✏️</button>
                    <button onClick={() => handleDelete(p)}>🗑</button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProductsPage;