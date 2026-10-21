
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_URL from "../api";



function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  return Number.isNaN(parsedDate.getTime())
    ? "Date unavailable"
    : parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const userResponse = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (userResponse.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        const userData = await userResponse.json();

        if (!userResponse.ok) {
          throw new Error(
            userData.message || "Failed to load account details."
          );
        }

        if (controller.signal.aborted) return;

        setUser(userData.user || userData);

        const storeResponse = await fetch(`${API_URL}/api/stores/mine`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (storeResponse.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        const storeData = await storeResponse.json();

        if (!storeResponse.ok) {
          throw new Error(
            storeData.message || "Failed to load store details."
          );
        }

        if (controller.signal.aborted) return;

        const currentStore = storeData.store || storeData;
        setStore(currentStore);

        const analyticsResponse = await fetch(
          `${API_URL}/api/merchant/analytics`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (analyticsResponse.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        const analyticsData = await analyticsResponse.json();

        if (!analyticsResponse.ok) {
          throw new Error(
            analyticsData.message || "Failed to load analytics."
          );
        }

        if (!controller.signal.aborted) {
          setAnalytics(analyticsData.analytics);
        }
      } catch (err) {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          setError(err.message || "Unable to load dashboard.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      controller.abort();
    };
  }, [navigate]);

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      navigate("/login", { replace: true });
    }
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-container">
          <p>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-container">
          <h1>Unable to load dashboard</h1>
          <p>{error}</p>
          <button
            type="button"
            className="dashboard-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const recentOrders = analytics?.recentOrders || [];
  const lowStockProducts = analytics?.lowStockProducts || [];

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">STOREFORGE MERCHANT</p>
            <h1>Dashboard</h1>
            <p>Manage your store, products, and customer orders.</p>
          </div>

          <button
            type="button"
            className="dashboard-logout-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </header>

        <section className="dashboard-welcome">
          <div>
            <h2>
              Welcome{user?.name ? `, ${user.name}` : ""}!
            </h2>
            <p>Here is an overview of your store's performance.</p>
          </div>
        </section>

        {analytics && (
          <section className="analytics-section">
            <h2>Store overview</h2>

            <div className="analytics-grid">
              <article className="analytics-card">
                <span>Total orders</span>
                <strong>{analytics.totalOrders ?? 0}</strong>
              </article>

              <article className="analytics-card">
                <span>Pending orders</span>
                <strong>{analytics.pendingOrders ?? 0}</strong>
              </article>

              <article className="analytics-card">
                <span>Delivered orders</span>
                <strong>{analytics.deliveredOrders ?? 0}</strong>
              </article>

              <article className="analytics-card">
                <span>Delivered revenue</span>
                <strong>
                  {formatCurrency(analytics.totalRevenue)}
                </strong>
              </article>
            </div>
          </section>
        )}

        <section className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Account details</h2>

            <div className="dashboard-detail">
              <span>Name</span>
              <strong>{user?.name || "Not available"}</strong>
            </div>

            <div className="dashboard-detail">
              <span>Email</span>
              <strong>{user?.email || "Not available"}</strong>
            </div>

            <div className="dashboard-detail">
              <span>Role</span>
              <strong>{user?.role || "merchant"}</strong>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Your store</h2>

            {store ? (
              <>
                <div className="dashboard-detail">
                  <span>Store name</span>
                  <strong>{store.name || "Unnamed store"}</strong>
                </div>

                <div className="dashboard-detail">
                  <span>Store URL</span>
                  <strong>
                    {store.slug ? `/store/${store.slug}` : "Not available"}
                  </strong>
                </div>

                {store.description && <p>{store.description}</p>}

                {store.slug && (
                  <Link
                    to={`/store/${store.slug}`}
                    className="dashboard-action-link"
                  >
                    View Public Store →
                  </Link>
                )}
              </>
            ) : (
              <Link to="/store-setup" className="dashboard-action-link">
                Create Your Store →
              </Link>
            )}
          </div>

          <div className="dashboard-card">
            <h2>Product management</h2>
            <p>Manage product details, prices, and available stock.</p>
            <Link to="/products" className="dashboard-action-link">
              Manage Products →
            </Link>
          </div>

          <div className="dashboard-card">
            <h2>Order management</h2>
            <p>Review purchases and update order statuses.</p>
            <Link to="/orders" className="dashboard-action-link">
              Manage Orders →
            </Link>
          </div>
        </section>

        <section className="analytics-details-grid">
          <div className="dashboard-card">
            <div className="analytics-section-header">
              <h2>Recent orders</h2>
              <Link to="/orders">View all</Link>
            </div>

            {recentOrders.length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              <div className="analytics-table-wrapper">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.orderNumber || "Order"}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>
                          <span
                            className={`order-status-badge status-${order.status}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>{formatCurrency(order.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="dashboard-card">
            <div className="analytics-section-header">
              <h2>Low-stock alerts</h2>
              <Link to="/products">Manage products</Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <p>No low-stock products. Your inventory looks good.</p>
            ) : (
              <div className="low-stock-list">
                {lowStockProducts.map((product) => (
                  <div
                    className="low-stock-item"
                    key={product._id}
                  >
                    <div>
                      <strong>{product.name}</strong>
                      <span>
                        {formatCurrency(product.price)}
                      </span>
                    </div>

                    <span className="low-stock-quantity">
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
