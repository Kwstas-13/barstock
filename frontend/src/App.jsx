import { useEffect, useState } from "react";
import api from "./api/client";

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p>Σφάλμα: {error}</p>;

  return (
    <div>
      <h1>BarStock</h1>
      <p>Προϊόντα: {products.length}</p>
      <pre>{JSON.stringify(products, null, 2)}</pre>
    </div>
  );
}

export default App;