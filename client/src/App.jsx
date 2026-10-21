
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import StoreSetup from "./pages/StoreSetup";
import ProductManagement from "./pages/ProductManagement";
import PublicStore from "./pages/PublicStore";
import Orders from "./pages/Orders";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/store-setup" element={<StoreSetup />} />
        <Route path="/products" element={<ProductManagement />} />
        <Route path="/store/:slug" element={<PublicStore />} />
        <Route path="/orders" element={<Orders />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
