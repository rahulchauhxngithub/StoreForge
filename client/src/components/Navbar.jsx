
function Navbar() {
  return (
    <nav className="navbar">
      <a href="#" className="brand">
        <span className="brand-icon">S</span>
        StoreForge<span className="brand-dot">.</span>
      </a>

      <div className="nav-links">
        <a href="#features">Features</a>
        <a href="#how-it-works">How it works</a>
      </div>

      <div className="nav-actions">
        <button
          className="login-btn"
          onClick={() => alert("Login coming soon!")}
        >
          Log in
        </button>

        <button
          className="primary-btn nav-cta"
          onClick={() => alert("Store registration coming soon!")}
        >
          Start selling ↗
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
