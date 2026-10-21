
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

function StoreSetup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingStore, setCheckingStore] = useState(true);
  const [error, setError] = useState("");

  // Check whether this merchant already has a store.
  useEffect(() => {
    let active = true;

    async function checkExistingStore() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/stores/mine",
          { credentials: "include" }
        );

        if (response.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        if (response.ok) {
          const data = await response.json();

          if (active && data.store) {
            navigate("/dashboard", { replace: true });
          }
        }
      } catch {
        if (active) {
          setError("Unable to connect to StoreForge. Please try again.");
        }
      } finally {
        if (active) {
          setCheckingStore(false);
        }
      }
    }

    checkExistingStore();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 3) {
      setError("Store name must contain at least 3 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/stores",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to create your store.");
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please try again."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingStore) {
    return (
      <main className="auth-page">
        <p>Checking your account...</p>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card store-setup-card">
        <Link to="/" className="brand">
          <span className="brand-icon">S</span>
          StoreForge<span className="brand-dot">.</span>
        </Link>

        <p className="section-label">YOUR BUSINESS STARTS HERE</p>
        <h1>Create your store</h1>
        <p className="auth-description">
          Give your store a name and tell customers what you sell.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="storeName">Store name</label>
          <input
            id="storeName"
            type="text"
            placeholder="e.g. Rahul Fashion"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={3}
            maxLength={100}
            required
          />

          <label htmlFor="storeDescription">Description</label>
          <textarea
            id="storeDescription"
            placeholder="Describe your business (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            rows={4}
          />

          <p className="field-hint">
            You can use up to 500 characters.
          </p>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="primary-btn auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating store..." : "Create my store →"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default StoreSetup;
