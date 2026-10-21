
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import API_URL from "../api";

const STATUS_OPTIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const FILTER_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function getStatusClass(status) {
  return `status-${String(status || "pending").toLowerCase()}`;
}

function getOrderId(order) {
  return order._id || order.id;
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const navigate = useNavigate();

  const loadOrders = useCallback(async (signal) => {
    const response = await fetch(`${API_URL}/api/merchant/orders`, {
      method: "GET",
      credentials: "include",
      signal,
    });

    if (response.status === 401) {
      navigate("/login", { replace: true });
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load orders.");
    }

    const receivedOrders = Array.isArray(data)
      ? data
      : data.orders || [];

    setOrders(receivedOrders);
    setError("");
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();

    const startLoading = async () => {
      try {
        await loadOrders(controller.signal);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load orders.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    startLoading();

    return () => {
      controller.abort();
    };
  }, [loadOrders]);

  async function handleRefresh() {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to refresh orders.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId, newStatus) {
    if (!orderId || !newStatus) return;

    setUpdatingOrderId(orderId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/merchant/orders/${orderId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update order status.");
      }

      await loadOrders();

      setNotice(`Order status updated to ${newStatus}.`);
    } catch (err) {
      setError(err.message || "Unable to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const visibleOrders = orders.filter((order) => {
    return filter === "all" || order.status === filter;
  });

  const pendingCount = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const activeCount = orders.filter((order) =>
    ["confirmed", "processing", "shipped"].includes(order.status)
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "delivered"
  ).length;

  if (loading && orders.length === 0) {
    return (
      <main className="orders-page">
        <div className="orders-container">
          <p className="orders-message">Loading your orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <div className="orders-container">
        <header className="orders-header">
          <div>
            <p className="orders-eyebrow">MERCHANT WORKSPACE</p>
            <h1>Manage Orders</h1>
            <p>
              Review customer purchases and manage order fulfillment.
            </p>
          </div>

          <Link to="/dashboard" className="orders-back-link">
            ← Dashboard
          </Link>
        </header>

        {error && (
          <div className="orders-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={handleRefresh}>
              Try Again
            </button>
          </div>
        )}

        {notice && (
          <div className="orders-notice" role="status">
            {notice}
          </div>
        )}

        <section className="orders-stats">
          <div className="orders-stat-card">
            <span>Total orders</span>
            <strong>{orders.length}</strong>
          </div>

          <div className="orders-stat-card">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="orders-stat-card">
            <span>In progress</span>
            <strong>{activeCount}</strong>
          </div>

          <div className="orders-stat-card">
            <span>Delivered</span>
            <strong>{completedCount}</strong>
          </div>
        </section>

        <section className="orders-list-section">
          <div className="orders-list-heading">
            <div>
              <h2>Customer orders</h2>
              <p>
                {visibleOrders.length}{" "}
                {visibleOrders.length === 1 ? "order" : "orders"} shown
              </p>
            </div>

            <button
              type="button"
              className="orders-refresh-button"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="orders-filter">
            <label htmlFor="order-status-filter">Filter by status</label>

            <select
              id="order-status-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              {FILTER_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "all"
                    ? "All orders"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {visibleOrders.length === 0 ? (
            <div className="orders-empty">
              <h3>
                {orders.length === 0
                  ? "No orders yet"
                  : "No orders match this filter"}
              </h3>
              <p>
                {orders.length === 0
                  ? "Customer checkout orders will appear here."
                  : "Choose another status to view more orders."}
              </p>
            </div>
          ) : (
            <div className="orders-list">
              {visibleOrders.map((order, index) => {
                const orderId = getOrderId(order);
                const allowedStatuses =
                  STATUS_OPTIONS[order.status] || [];

                const customer = order.customer || {};
                const address = order.shippingAddress || {};
                const items = Array.isArray(order.items) ? order.items : [];

                const customerName =
                  customer.name || order.customerName || "Customer";

                const customerEmail =
                  customer.email || order.customerEmail || "";

                const customerPhone =
                  customer.phone || order.customerPhone || "";

                const addressParts = [
                  address.addressLine,
                  address.city,
                  address.state,
                  address.postalCode,
                  address.country,
                ].filter(Boolean);

                return (
                  <article
                    className="merchant-order-card"
                    key={orderId || order.orderNumber || index}
                  >
                    <div className="merchant-order-top">
                      <div>
                        <span className="order-number-label">
                          ORDER NUMBER
                        </span>
                        <h3>
                          {order.orderNumber || orderId || "Order"}
                        </h3>
                        <p className="order-date">
                          Placed {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <span
                        className={`order-status-badge ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status || "pending"}
                      </span>
                    </div>

                    <div className="merchant-order-details">
                      <section>
                        <h4>Customer</h4>
                        <p>{customerName}</p>

                        {customerEmail && <p>{customerEmail}</p>}
                        {customerPhone && <p>{customerPhone}</p>}
                      </section>

                      <section>
                        <h4>Shipping address</h4>
                        {addressParts.length > 0 ? (
                          <p>{addressParts.join(", ")}</p>
                        ) : (
                          <p>Address unavailable</p>
                        )}
                      </section>
                    </div>

                    <div className="merchant-order-items">
                      <h4>Items ordered</h4>

                      {items.length === 0 ? (
                        <p>No item details available.</p>
                      ) : (
                        items.map((item, itemIndex) => (
                          <div
                            className="merchant-order-item"
                            key={`${item.product || item.productId || item.name || "item"}-${itemIndex}`}
                          >
                            <span>
                              {item.name || "Product"} ×{" "}
                              {item.quantity || 1}
                            </span>

                            <strong>
                              {formatCurrency(
                                (Number(item.price) || 0) *
                                  (Number(item.quantity) || 1)
                              )}
                            </strong>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="merchant-order-bottom">
                      <div className="order-payment-details">
                        <p>
                          Payment:{" "}
                          <strong>
                            {order.paymentMethod || "cash_on_delivery"}
                          </strong>
                        </p>
                        <p>
                          Payment status:{" "}
                          <strong>
                            {order.paymentStatus || "pending"}
                          </strong>
                        </p>
                      </div>

                      <div className="order-total">
                        <span>Order total</span>
                        <strong>
                          {formatCurrency(order.subtotal)}
                        </strong>
                      </div>
                    </div>

                    <div className="order-status-control">
                      <label htmlFor={`status-${orderId}`}>
                        Update status
                      </label>

                      {allowedStatuses.length > 0 ? (
                        <select
                          id={`status-${orderId}`}
                          defaultValue=""
                          disabled={updatingOrderId === orderId}
                          onChange={(event) => {
                            const nextStatus = event.target.value;

                            if (nextStatus) {
                              handleStatusChange(orderId, nextStatus);
                            }
                          }}
                        >
                          <option value="" disabled>
                            {updatingOrderId === orderId
                              ? "Updating..."
                              : "Choose next status"}
                          </option>

                          {allowedStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() +
                                status.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="order-terminal-status">
                          This order is {order.status}.
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Orders;
