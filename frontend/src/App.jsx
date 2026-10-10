import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import ProductsPage from "./pages/ProductsPage";
import ParLevelsPage from "./pages/ParLevelsPage";
import RecipesPage from "./pages/RecipesPage";
import TillPage from "./pages/TillPage";
import ShiftBar from "./components/ShiftBar";

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
        <NavLink to="/till" style={linkStyle}>🍸 Ταμείο</NavLink>
        <NavLink to="/products" style={linkStyle}>Προϊόντα</NavLink>
        <NavLink to="/par-levels" style={linkStyle}>Par Levels</NavLink>
        <NavLink to="/recipes" style={linkStyle}>Συνταγές</NavLink>
      </nav>

      <ShiftBar />

      <Routes>
        <Route path="/" element={<Navigate to="/till" replace />} />
        <Route path="/till" element={<TillPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/par-levels" element={<ParLevelsPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="*" element={<p>Η σελίδα δεν βρέθηκε.</p>} />
      </Routes>
    </div>
  );
}

export default App;