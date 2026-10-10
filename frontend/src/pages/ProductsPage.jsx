import { useEffect, useState } from "react";
import api from "../api/client";
import ProductForm from "../components/ProductForm";
import LockNotice from "../components/LockNotice";
import { CATEGORIES, UNITS } from "../constants";
import { useShift } from "../context/ShiftContext";
import { errorMessage, formatEuro, formatCostPerUnit, toNumberOrNull } from "../utils/format";

const LOCKED_TITLE = "Κλειδωμένο όσο η βάρδια είναι ανοιχτή";

function ProductsPage() {
  const { isShiftOpen } = useShift();
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

  useEffect(() => {
    if (isShiftOpen) setEditingId(null);
  }, [isShiftOpen]);

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
      alert(`Η διαγραφή απέτυχε: ${errorMessage(err)}`);
    }
  }

  function startEdit(product) {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      category: product.category,
      bottle_size_ml: product.bottle_size_ml,
      unit: product.unit,
      bottle_cost: product.bottle_cost ?? "",
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
        unit: editForm.unit,
        bottle_cost: toNumberOrNull(editForm.bottle_cost),
      });
      setProducts((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      setEditingId(null);
    } catch (err) {
      alert(`Η αποθήκευση απέτυχε: ${errorMessage(err)}`);
    }
  }

  if (loading) return <p>Φόρτωση...</p>;
  if (error) return <p>Σφάλμα: {error}</p>;

  return (
    <div>
      <h2>Προϊόντα</h2>
      <LockNotice />
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
              <th>Συσκευασία</th>
              <th>Κόστος</th>
              <th>Ανά μονάδα</th>
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
                    <select name="unit" value={editForm.unit} onChange={handleEditChange}>
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      name="bottle_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="€"
                      value={editForm.bottle_cost}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td>
                    {formatCostPerUnit(editForm.bottle_cost, editForm.bottle_size_ml, editForm.unit)}
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
                  <td>{formatEuro(p.bottle_cost)}</td>
                  <td>{formatCostPerUnit(p.bottle_cost, p.bottle_size_ml, p.unit)}</td>
                  <td>
                    <button
                      onClick={() => startEdit(p)}
                      disabled={isShiftOpen}
                      title={isShiftOpen ? LOCKED_TITLE : "Επεξεργασία"}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={isShiftOpen}
                      title={isShiftOpen ? LOCKED_TITLE : "Διαγραφή"}
                    >
                      🗑
                    </button>
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