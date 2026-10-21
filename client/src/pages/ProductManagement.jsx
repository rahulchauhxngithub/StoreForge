
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  imageUrl: "",
};

function ProductManagement() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadProducts() {
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/products/mine`, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not load products.");
      }

      setProducts(data.products || []);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialProducts() {
      try {
        const response = await fetch(`${API_URL}/api/products/mine`, {
          credentials: "include",
        });

        const data = await response.json();

        if (cancelled) return;

        if (response.status === 401) {
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Could not load products.");
        }

        setProducts(data.products || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not connect to the server.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchInitialProducts();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      };

      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `${API_URL}/api/products/${editingId}`
          : `${API_URL}/api/products`,
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not save product.");
      }

      setMessage(
        isEditing
          ? "Product updated successfully."
          : "Product added successfully."
      );

      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(product) {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl || "",
    });
    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/products/${product._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not delete product.");
      }

      setProducts((previous) =>
        previous.filter((item) => item._id !== product._id)
      );

      if (editingId === product._id) {
        resetForm();
      }

      setMessage("Product deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete product.");
    }
  }

  if (loading) {
    return <main className="product-page">Loading products...</main>;
  }

  return (
    <main className="product-page">
      <div className="product-page-header">
        <div>
          <p className="product-eyebrow">STORE MANAGEMENT</p>
          <h1>Products</h1>
          <p className="product-subtitle">
            Manage your store's inventory in one place.
          </p>
        </div>

        <button
          type="button"
          className="product-secondary-button"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {error && <p className="product-alert product-error">{error}</p>}
      {message && (
        <p className="product-alert product-success">{message}</p>
      )}

      <section className="product-form-card">
        <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>

        <form onSubmit={handleSubmit} className="product-form">
          <label>
            Product name *
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              minLength={2}
              maxLength={120}
              required
              placeholder="e.g. Classic T-Shirt"
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={2000}
              rows={3}
              placeholder="Describe your product"
            />
          </label>

          <div className="product-form-row">
            <label>
              Price (₹) *
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                placeholder="499"
              />
            </label>

            <label>
              Stock quantity *
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                min="0"
                step="1"
                required
                placeholder="25"
              />
            </label>
          </div>

          <label>
            Image URL (optional)
            <input
              name="imageUrl"
              type="url"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/product.jpg"
            />
          </label>

          <div className="product-form-actions">
            <button
              type="submit"
              className="product-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="product-secondary-button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="product-list-section">
        <div className="product-list-heading">
          <h2>Your Inventory</h2>
          <span>{products.length} products</span>
        </div>

        {products.length === 0 ? (
          <div className="product-empty-state">
            <h3>No products yet</h3>
            <p>Add your first product using the form above.</p>
          </div>
        ) : (
          <div className="product-table-wrapper">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-name-cell">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="product-thumbnail"
                          />
                        )}
                        <div>
                          <strong>{product.name}</strong>
                          {product.description && (
                            <p>{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>₹{Number(product.price).toFixed(2)}</td>

                    <td>
                      <span
                        className={
                          product.stock === 0
                            ? "stock-badge stock-out"
                            : product.stock <= 5
                              ? "stock-badge stock-low"
                              : "stock-badge stock-available"
                        }
                      >
                        {product.stock === 0
                          ? "Out of stock"
                          : product.stock <= 5
                            ? `${product.stock} left`
                            : product.stock}
                      </span>
                    </td>

                    <td>
                      <div className="product-action-buttons">
                        <button
                          type="button"
                          className="product-edit-button"
                          onClick={() => startEditing(product)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="product-delete-button"
                          onClick={() => handleDelete(product)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default ProductManagement;
