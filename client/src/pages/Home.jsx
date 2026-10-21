
import "../App.css";
import Navbar from "../components/Navbar";

const features = [
  {
    icon: "🏪",
    title: "Your own storefront",
    description:
      "Create a branded online store and give your products a home on the internet.",
  },
  {
    icon: "📦",
    title: "Product management",
    description:
      "Manage products, pricing, inventory and categories from one dashboard.",
  },
  {
    icon: "📊",
    title: "Sales analytics",
    description:
      "Understand your orders, revenue and business performance at a glance.",
  },
];

function App() {
  return (
    <div className="app">
      <Navbar/>

        

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot" />
              YOUR BUSINESS. YOUR RULES.
            </div>

            <h1>
              Your next big idea
              <br />
              deserves a <span>store.</span>
            </h1>

            <p className="hero-description">
              Launch your online store, manage your products and grow
              your business — all from one simple platform.
            </p>

            <div className="hero-actions">
              <button
                className="primary-btn hero-cta"
                onClick={() => alert("Store registration coming soon!")}
              >
                Create your store <span>→</span>
              </button>
              <a className="secondary-btn" href="#features">
                Explore features ↓
              </a>
            </div>

            <div className="hero-note">
              <span>✦</span> Built for ambitious independent businesses
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow" />

            <div className="store-card">
              <div className="store-card-top">
                <div className="mini-brand">
                  <span className="brand-icon small">S</span>
                  northstar.
                </div>
                <span className="live-label">
                  <span className="status-dot" /> LIVE PREVIEW
                </span>
              </div>

              <div className="store-banner">
                <span>THE EVERYDAY COLLECTION</span>
                <h2>Made for<br />your kind of life.</h2>
                <span className="banner-link">DISCOVER MORE ↗</span>
              </div>

              <div className="products-heading">
                <strong>Featured products</strong>
                <span>VIEW ALL →</span>
              </div>

              <div className="product-grid">
                <div className="product">
                  <div className="product-image product-one">
                    <span>01</span>
                  </div>
                  <strong>Everyday Tote</strong>
                  <span>₹899</span>
                </div>
                <div className="product">
                  <div className="product-image product-two">
                    <span>02</span>
                  </div>
                  <strong>Essential Bottle</strong>
                  <span>₹649</span>
                </div>
                <div className="product">
                  <div className="product-image product-three">
                    <span>03</span>
                  </div>
                  <strong>Daily Journal</strong>
                  <span>₹399</span>
                </div>
              </div>
            </div>

            <div className="floating-card">
              <span className="floating-icon">↗</span>
              <div>
                <span>YOUR NEXT CHAPTER</span>
                <strong>Starts here.</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <span>ONE PLATFORM.</span>
          <span>ENDLESS POSSIBILITIES.</span>
          <span>BUILT FOR YOUR BUSINESS.</span>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="section-label">EVERYTHING IN ONE PLACE</span>
            <h2>Less complexity. <span>More possibility.</span></h2>
            <p>
              Everything you need to take your business from an idea
              to an online store.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <a href="#how-it-works">Explore feature ↗</a>
              </article>
            ))}
          </div>
        </section>

        <section className="bottom-cta" id="how-it-works">
          <div>
            <span className="section-label">YOUR BUSINESS STARTS HERE</span>
            <h2>Ready to build something of your own?</h2>
            <p>We're building the tools to help your store grow.</p>
          </div>
          <button
            className="primary-btn"
            onClick={() => alert("Merchant onboarding coming soon!")}
          >
            Get started <span>→</span>
          </button>
        </section>
      </main>

      <footer className="footer">
        <a href="#" className="brand">
          <span className="brand-icon">S</span>
          StoreForge<span className="brand-dot">.</span>
        </a>
        <span>Built for the next generation of merchants.</span>
        <span>© 2026 StoreForge</span>
      </footer>
    </div>
  );
}

export default App;
