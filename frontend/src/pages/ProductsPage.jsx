import { useEffect, useState } from "react";
import api from "../api/client";
import ProductForm from "../components/ProductForm";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.bottle_size_ml} {p.unit}</td>
                <td>
                  <button onClick={() => handleDelete(p)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProductsPage;