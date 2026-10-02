import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import ProductsPage from "./pages/ProductsPage";
import ParLevelsPage from "./pages/ParLevelsPage";

function App() {
  const linkStyle = ({ isActive }) => ({
    marginRight: "1rem",
    fontWeight: isActive ? "bold" : "normal",
    textDecoration: isActive ? "underline" : "none",
  });

  return (
    <div>
      <h1>BarStock</h1>

      <nav>
        <NavLink to="/products" style={linkStyle}>Προϊόντα</NavLink>
        <NavLink to="/par-levels" style={linkStyle}>Par Levels</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/par-levels" element={<ParLevelsPage />} />
        <Route path="*" element={<p>Η σελίδα δεν βρέθηκε.</p>} />
      </Routes>
    </div>
  );
}

export default App;