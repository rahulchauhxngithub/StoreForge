
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function PublicStore() {
  const { slug } = useParams();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(`storeforge-cart-${slug}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [shippingAddress, setShippingAddress] = useState({
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Fetch store and products.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchStore() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/stores/public/${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load store.");
        }

        setStore(data.store);
        setProducts(data.products || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to connect to the server.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchStore();

    return () => controller.abort();
  }, [slug]);

  // Persist the cart in this browser.
  useEffect(() => {
    try {
      localStorage.setItem(
        `storeforge-cart-${slug}`,
        JSON.stringify(cart)
      );
    } catch (err) {
      console.error("Unable to save cart:", err);
    }
  }, [cart, slug]);

  function addToCart(product) {
    if (product.stock <= 0) return;

    setOrderSuccess(null);
    setCheckoutError("");

    setCart((previous) => {
      const existing = previous.find(
        (item) => item._id === product._id
      );

      if (existing) {
        if (existing.quantity >= product.stock) {
          return previous;
        }

        return previous.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...previous, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(productId, quantity) {
    const product = products.find(
      (item) => item._id === productId
    );

    if (!product) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setOrderSuccess(null);
    setCheckoutError("");

    setCart((previous) =>
      previous.map((item) =>
        item._id === productId
          ? {
              ...item,
              quantity: Math.min(
                Math.floor(quantity),
                product.stock
              ),
            }
          : item
      )
    );
  }

  function removeFromCart(productId) {
    setOrderSuccess(null);
    setCheckoutError("");

    setCart((previous) =>
      previous.filter((item) => item._id !== productId)
    );
  }

  function handleCustomerChange(event) {
    const { name, value } = event.target;

    setCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleAddressChange(event) {
    const { name, value } = event.target;

    setShippingAddress((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Submit an order to the backend.
  async function handleCheckout(event) {
    event.preventDefault();

    if (cart.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");
    setOrderSuccess(null);

    try {
      const response = await fetch(
        `${API_URL}/orders/${encodeURIComponent(slug)}/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cart.map((item) => ({
              productId: item._id,
              quantity: item.quantity,
            })),
            customer,
            shippingAddress,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to place your order.");
      }

      // Only clear the cart after the server confirms success.
      setOrderSuccess(data.order);
      setCart([]);

      setCustomer({
        name: "",
        email: "",
        phone: "",
      });

      setShippingAddress({
        addressLine: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setCheckoutError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // This is only a display estimate. The backend calculates the actual total.
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <main className="public-store">
        <p className="store-loading">Loading store...</p>
      </main>
    );
  }

  if (error || !store) {
    return (
      <main className="public-store">
        <div className="store-message">
          <h1>Store unavailable</h1>
          <p>{error || "This store could not be found."}</p>
          <Link to="/">Return home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="public-store">
      <header className="public-store-header">
        <Link to="/" className="store-brand">
          StoreForge
        </Link>

        <div className="store-header-actions">
          <span className="store-status">Online store</span>
          <a className="store-cart-link" href="#shopping-cart">
            Cart ({cartCount})
          </a>
        </div>
      </header>

      {/* Order confirmation */}
      {orderSuccess && (
        <section className="order-success">
          <h2>Order placed successfully!</h2>
          <p>
            Thank you for your order from {store.name}.
          </p>
          <p>
            Order number: <strong>{orderSuccess.orderNumber}</strong>
          </p>
          <p>
            Order total:{" "}
            <strong>
              ₹{Number(orderSuccess.subtotal).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </p>
          <p>Payment method: Cash on delivery</p>
          <p>Order status: {orderSuccess.status}</p>
        </section>
      )}

      <section className="store-hero">
        <p className="store-eyebrow">WELCOME TO</p>
        <h1>{store.name}</h1>
        <p className="store-description">
          {store.description || "Discover products in our store."}
        </p>
        <div className="store-product-count">
          {products.length}{" "}
          {products.length === 1 ? "product" : "products"}
        </div>
      </section>

      {/* Product collection */}
      <section className="public-products">
        <div className="public-products-heading">
          <div>
            <p className="store-eyebrow">THE COLLECTION</p>
            <h2>Explore our products</h2>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="store-empty">
            <h3>Coming soon</h3>
            <p>This store hasn't listed any products yet.</p>
          </div>
        ) : (
          <div className="public-product-grid">
            {products.map((product) => (
              <article
                className="public-product-card"
                key={product._id}
              >
                <div className="public-product-image">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      <span>
                        {product.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="public-product-info">
                  <h3>{product.name}</h3>

                  {product.description && (
                    <p className="public-product-description">
                      {product.description}
                    </p>
                  )}

                  <div className="public-product-bottom">
                    <strong className="public-product-price">
                      ₹{Number(product.price).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>

                    <span
                      className={
                        product.stock > 0
                          ? "public-stock in-stock"
                          : "public-stock out-of-stock"
                      }
                    >
                      {product.stock > 0 ? "In stock" : "Out of stock"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="add-to-cart-button"
                    disabled={product.stock <= 0}
                    onClick={() => addToCart(product)}
                  >
                    {product.stock <= 0 ? "Out of stock" : "Add to Cart"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Shopping cart */}
      <section className="shopping-cart" id="shopping-cart">
        <div className="shopping-cart-heading">
          <p className="store-eyebrow">YOUR SELECTION</p>
          <h2>Shopping Cart ({cartCount})</h2>
        </div>

        {cart.length === 0 ? (
          <p className="shopping-cart-empty">
            Your cart is empty. Add a product to get started.
          </p>
        ) : (
          <>
            <div className="shopping-cart-items">
              {cart.map((item) => (
                <div className="shopping-cart-item" key={item._id}>
                  <div className="shopping-cart-item-info">
                    <strong>{item.name}</strong>
                    <span>
                      ₹{Number(item.price).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      each
                    </span>
                  </div>

                  <label className="cart-quantity-label">
                    Qty
                    <input
                      type="number"
                      min="0"
                      max={item.stock}
                      step="1"
                      value={item.quantity}
                      onChange={(event) => {
                        const value = event.target.value;

                        if (value === "") {
                          updateQuantity(item._id, 0);
                        } else {
                          updateQuantity(item._id, Number(value));
                        }
                      }}
                    />
                  </label>

                  <strong className="cart-item-subtotal">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>

                  <button
                    type="button"
                    className="remove-cart-item"
                    onClick={() => removeFromCart(item._id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="shopping-cart-total">
              <span>Estimated subtotal</span>
              <strong>
                ₹{cartTotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>

            <p className="cart-checkout-note">
              The final subtotal is calculated by the server when you
              place your order.
            </p>

            {/* Checkout form */}
            <div className="checkout-section">
              <h2>Checkout</h2>
              <p>Enter your contact and delivery details.</p>

              {checkoutError && (
                <p className="checkout-error" role="alert">
                  {checkoutError}
                </p>
              )}

              <form onSubmit={handleCheckout} className="checkout-form">
                <h3>Contact information</h3>

                <label>
                  Full name
                  <input
                    type="text"
                    name="name"
                    value={customer.name}
                    onChange={handleCustomerChange}
                    minLength="2"
                    maxLength="100"
                    autoComplete="name"
                    required
                  />
                </label>

                <label>
                  Email address
                  <input
                    type="email"
                    name="email"
                    value={customer.email}
                    onChange={handleCustomerChange}
                    maxLength="254"
                    autoComplete="email"
                    required
                  />
                </label>

                <label>
                  Phone number (optional)
                  <input
                    type="tel"
                    name="phone"
                    value={customer.phone}
                    onChange={handleCustomerChange}
                    maxLength="20"
                    autoComplete="tel"
                  />
                </label>

                <h3>Delivery address</h3>

                <label>
                  Address
                  <input
                    type="text"
                    name="addressLine"
                    value={shippingAddress.addressLine}
                    onChange={handleAddressChange}
                    maxLength="200"
                    autoComplete="street-address"
                    required
                  />
                </label>

                <div className="checkout-two-columns">
                  <label>
                    City
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      maxLength="100"
                      autoComplete="address-level2"
                      required
                    />
                  </label>

                  <label>
                    State
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleAddressChange}
                      maxLength="100"
                      autoComplete="address-level1"
                      required
                    />
                  </label>

                  <label>
                    Postal code
                    <input
                      type="text"
                      name="postalCode"
                      value={shippingAddress.postalCode}
                      onChange={handleAddressChange}
                      maxLength="20"
                      autoComplete="postal-code"
                      required
                    />
                  </label>

                  <label>
                    Country
                    <input
                      type="text"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleAddressChange}
                      maxLength="100"
                      autoComplete="country-name"
                      required
                    />
                  </label>
                </div>

                <div className="checkout-payment-info">
                  <strong>Payment method</strong>
                  <p>Cash on delivery (COD)</p>
                </div>

                <button
                  type="submit"
                  className="place-order-button"
                  disabled={checkoutLoading || cart.length === 0}
                >
                  {checkoutLoading
                    ? "Placing order..."
                    : `Place Order — ₹${cartTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                </button>
              </form>
            </div>
          </>
        )}
      </section>

      <footer className="public-store-footer">
        <p>Powered by StoreForge</p>
      </footer>
    </main>
  );
}

export default PublicStore;
