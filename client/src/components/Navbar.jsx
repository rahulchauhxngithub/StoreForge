import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <span className="brand-icon">S</span>
        StoreForge<span className="brand-dot">.</span>
      </Link>

      <div className="nav-links">
        <a href="/#features">Features</a>
        <a href="/#how-it-works">How it works</a>
      </div>

      <div className="nav-actions">
        <Link to="/login" className="login-btn">
          Log in
        </Link>

        <Link to="/register" className="primary-btn nav-cta">
          Start selling ↗
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;