// Components/Admin/Dashboard/ViewOrders.jsx
import React, { useState, useEffect, useCallback } from "react";
import styles from "../../../Styles/Admin/ViewOrders.module.css";
import api from "../../../services/axiosConfig";
import { toast } from "react-toastify";
import ActionDropdown from "../../Common/ActionDropdown";
import {
  FiPackage,
  FiSearch,
  FiFilter,
  FiEye,
  FiEdit,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiDownload,
  FiX,
  FiCheck,
  FiTruck,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiDollarSign,
  FiBox,
  FiCopy,
  FiCalendar,
  FiHash,
} from "react-icons/fi";

const ViewOrders = ({
  setActiveMenu,
  setSelectedOrderId,
  showOnlyPending = false,
}) => {
  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    showOnlyPending ? "Pending" : ""
  );
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Status Update States
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Order Statuses (matching your schema)
  const orderStatuses = [
    { value: "Pending", label: "Pending", color: "#f59e0b", icon: FiClock },
    { value: "Confirmed", label: "Confirmed", color: "#3b82f6", icon: FiCheck },
    { value: "Shipped", label: "Shipped", color: "#8b5cf6", icon: FiTruck },
    {
      value: "Delivered",
      label: "Delivered",
      color: "#10b981",
      icon: FiCheckCircle,
    },
    {
      value: "Cancelled",
      label: "Cancelled",
      color: "#ef4444",
      icon: FiXCircle,
    },
  ];

  // Payment Statuses (matching your schema)
  const paymentStatuses = [
    { value: "Pending", label: "Pending", color: "#f59e0b" },
    { value: "Completed", label: "Completed", color: "#10b981" },
    { value: "Failed", label: "Failed", color: "#ef4444" },
    { value: "Refunded", label: "Refunded", color: "#6b7280" },
  ];

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        sortBy,
        sortOrder,
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      if (paymentFilter) params.append("paymentStatus", paymentFilter);
      if (dateFilter.start) params.append("startDate", dateFilter.start);
      if (dateFilter.end) params.append("endDate", dateFilter.end);

      const response = await api.get(`/admin/orders?${params.toString()}`);

      if (response.data.success) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalOrders(response.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    limit,
    searchTerm,
    statusFilter,
    paymentFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchOrders();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Single Order Details
  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      if (response.data.success) {
        setSelectedOrder(response.data.order);
        setShowOrderModal(true);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to fetch order details");
    }
  };

  // Update Order Status
  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await api.patch(
        `/admin/orders/${selectedOrder._id}/status`,
        {
          status: newStatus,
          note: statusNote,
        }
      );

      if (response.data.success) {
        toast.success("Order status updated successfully");
        setShowStatusModal(false);
        setNewStatus("");
        setStatusNote("");
        fetchOrders();

        // Update selected order if modal is open
        if (showOrderModal) {
          fetchOrderDetails(selectedOrder._id);
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update order status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete Order
  const handleDeleteOrder = async () => {
    try {
      const response = await api.delete(`/admin/orders/${orderToDelete._id}`);

      if (response.data.success) {
        toast.success("Order deleted successfully");
        setShowDeleteModal(false);
        setOrderToDelete(null);
        fetchOrders();
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(error.response?.data?.message || "Failed to delete order");
    }
  };

  // Open Status Update Modal
  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setStatusNote("");
    setShowStatusModal(true);
  };

  // Copy Order ID
  const copyOrderId = (orderId) => {
    navigator.clipboard.writeText(orderId);
    toast.success("Order ID copied!", { autoClose: 1500 });
  };

  // Format Date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format Short Date
  const formatShortDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Get Status Badge
  const getStatusBadge = (status, type = "order") => {
    const statuses = type === "order" ? orderStatuses : paymentStatuses;
    const statusInfo = statuses.find((s) => s.value === status) || {
      color: "#6b7280",
      label: status || "Unknown",
    };

    return (
      <span
        className={styles.statusBadge}
        style={{
          backgroundColor: `${statusInfo.color}20`,
          color: statusInfo.color,
        }}
      >
        {type === "order" && statusInfo.icon && (
          <statusInfo.icon size={12} style={{ marginRight: "4px" }} />
        )}
        {statusInfo.label}
      </span>
    );
  };

  // Get Order Actions for ActionDropdown
  const getOrderActions = (order) => {
    return [
      {
        label: "View Details",
        icon: <FiEye size={14} />,
        onClick: () => fetchOrderDetails(order._id),
      },
      {
        label: "Change Status",
        icon: <FiEdit size={14} />,
        onClick: () => openStatusModal(order),
      },
      {
        label: "Copy Order ID",
        icon: <FiCopy size={14} />,
        onClick: () => copyOrderId(order.orderId),
      },
      { divider: true },
      {
        label: "Delete Order",
        icon: <FiTrash2 size={14} />,
        onClick: () => {
          setOrderToDelete(order);
          setShowDeleteModal(true);
        },
        className: "danger",
      },
    ];
  };

  // Export Orders
  const exportOrders = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const csvData = orders.map((order) => ({
      "Order ID": order.orderId,
      "Customer Name": order.user?.name || order.shippingAddress?.name || "N/A",
      Email: order.user?.email || "N/A",
      Phone: order.shippingAddress?.phone || "N/A",
      "Total Amount": order.totalAmount,
      "Delivery Charges": order.deliveryCharges || 0,
      "Final Amount": order.finalAmount,
      "Order Status": order.orderStatus,
      "Payment Status": order.paymentStatus,
      "Payment Method": order.paymentMethod,
      "Order Date": formatShortDate(order.orderDate || order.createdAt),
      City: order.shippingAddress?.city || "N/A",
      State: order.shippingAddress?.state || "N/A",
      "Total Products": order.products?.length || 0,
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Orders exported successfully!");
  };

  // Clear Filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter(showOnlyPending ? "Pending" : "");
    setPaymentFilter("");
    setDateFilter({ start: "", end: "" });
    setCurrentPage(1);
  };

  // Handle Sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Calculate order stats from current page
  const orderStats = {
    pending: orders.filter((o) => o.orderStatus === "Pending").length,
    confirmed: orders.filter((o) => o.orderStatus === "Confirmed").length,
    shipped: orders.filter((o) => o.orderStatus === "Shipped").length,
    delivered: orders.filter((o) => o.orderStatus === "Delivered").length,
  };

  // Get total products count in an order
  const getProductsCount = (order) => {
    return order.products?.reduce((sum, p) => sum + (p.quantity || 1), 0) || 0;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <FiPackage size={24} />
          </div>
          <div>
            <h1 className={styles.title}>
              {showOnlyPending ? "Pending Orders" : "Order Management"}
            </h1>
            <p className={styles.subtitle}>{totalOrders} total orders</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={fetchOrders}
            disabled={loading}
            title="Refresh"
          >
            <FiRefreshCw size={18} className={loading ? styles.spinning : ""} />
          </button>
          <button className={styles.exportBtn} onClick={exportOrders}>
            <FiDownload size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#fef3c7" }}>
            <FiClock size={20} color="#f59e0b" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{orderStats.pending}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#dbeafe" }}>
            <FiCheck size={20} color="#3b82f6" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{orderStats.confirmed}</span>
            <span className={styles.statLabel}>Confirmed</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#ede9fe" }}>
            <FiTruck size={20} color="#8b5cf6" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{orderStats.shipped}</span>
            <span className={styles.statLabel}>Shipped</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#d1fae5" }}>
            <FiCheckCircle size={20} color="#10b981" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{orderStats.delivered}</span>
            <span className={styles.statLabel}>Delivered</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.searchWrapper}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearSearchBtn}
              onClick={() => setSearchTerm("")}
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        <button
          className={`${styles.filterToggleBtn} ${
            showFilters ? styles.active : ""
          }`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter size={18} />
          <span>Filters</span>
          {(statusFilter ||
            paymentFilter ||
            dateFilter.start ||
            dateFilter.end) && (
            <span className={styles.filterCount}>
              {
                [statusFilter, paymentFilter, dateFilter.start].filter(Boolean)
                  .length
              }
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label>Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">All Statuses</option>
              {orderStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Payment Status</label>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">All Payments</option>
              {paymentStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Start Date</label>
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => {
                setDateFilter({ ...dateFilter, start: e.target.value });
                setCurrentPage(1);
              }}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>End Date</label>
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => {
                setDateFilter({ ...dateFilter, end: e.target.value });
                setCurrentPage(1);
              }}
              className={styles.filterInput}
            />
          </div>

          <button className={styles.clearFiltersBtn} onClick={clearFilters}>
            <FiX size={16} />
            Clear All
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <FiPackage size={48} />
            <h3>No Orders Found</h3>
            <p>
              {searchTerm || statusFilter || paymentFilter
                ? "Try adjusting your filters"
                : "No orders have been placed yet"}
            </p>
            {(searchTerm || statusFilter || paymentFilter) && (
              <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("orderId")}
                  className={styles.sortable}
                >
                  Order ID
                  {sortBy === "orderId" && (
                    <span className={styles.sortIcon}>
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th>Customer</th>
                <th>Products</th>
                <th
                  onClick={() => handleSort("finalAmount")}
                  className={styles.sortable}
                >
                  Amount
                  {sortBy === "finalAmount" && (
                    <span className={styles.sortIcon}>
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th>Status</th>
                <th>Payment</th>
                <th
                  onClick={() => handleSort("createdAt")}
                  className={styles.sortable}
                >
                  Date
                  {sortBy === "createdAt" && (
                    <span className={styles.sortIcon}>
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <div className={styles.orderId}>
                      <span className={styles.orderIdText}>
                        {order.orderId}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.customerInfo}>
                      <span className={styles.customerName}>
                        {order.user?.name ||
                          order.shippingAddress?.name ||
                          "N/A"}
                      </span>
                      <span className={styles.customerPhone}>
                        {order.shippingAddress?.phone || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.productsCount}>
                      {getProductsCount(order)} items
                    </span>
                  </td>
                  <td>
                    <span className={styles.amount}>
                      {formatCurrency(order.finalAmount)}
                    </span>
                  </td>
                  <td>{getStatusBadge(order.orderStatus, "order")}</td>
                  <td>
                    <div className={styles.paymentInfo}>
                      {getStatusBadge(order.paymentStatus, "payment")}
                      <span className={styles.paymentMethod}>
                        {order.paymentMethod || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.date}>
                      {formatShortDate(order.orderDate || order.createdAt)}
                    </span>
                  </td>
                  <td>
                    <ActionDropdown
                      actions={getOrderActions(order)}
                      align="right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && orders.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {(currentPage - 1) * limit + 1} to{" "}
            {Math.min(currentPage * limit, totalOrders)} of {totalOrders} orders
          </div>
          <div className={styles.paginationControls}>
            <button
              className={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              First
            </button>
            <button
              className={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <FiChevronLeft size={18} />
            </button>

            <div className={styles.pageNumbers}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    className={`${styles.pageBtn} ${
                      currentPage === pageNum ? styles.activePage : ""
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              className={styles.pageBtn}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <FiChevronRight size={18} />
            </button>
            <button
              className={styles.pageBtn}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowOrderModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <FiPackage size={20} />
                <h2>Order Details</h2>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowOrderModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.modalContent}>
              {/* Order Summary */}
              <div className={styles.orderSummary}>
                <div className={styles.orderSummaryHeader}>
                  <div>
                    <h3 className={styles.orderIdLarge}>
                      <FiHash size={18} />
                      {selectedOrder.orderId}
                      <button
                        className={styles.copyBtn}
                        onClick={() => copyOrderId(selectedOrder.orderId)}
                        title="Copy Order ID"
                      >
                        <FiCopy size={14} />
                      </button>
                    </h3>
                    <p className={styles.orderDate}>
                      <FiCalendar size={14} />
                      Placed on{" "}
                      {formatDate(
                        selectedOrder.orderDate || selectedOrder.createdAt
                      )}
                    </p>
                  </div>
                  <div className={styles.orderStatuses}>
                    {getStatusBadge(selectedOrder.orderStatus, "order")}
                    {getStatusBadge(selectedOrder.paymentStatus, "payment")}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className={styles.infoGrid}>
                {/* Customer Information */}
                <div className={styles.infoCard}>
                  <h4>
                    <FiUser size={16} /> Customer Information
                  </h4>
                  <div className={styles.infoContent}>
                    <p>
                      <strong>Name:</strong>{" "}
                      {selectedOrder.user?.name ||
                        selectedOrder.shippingAddress?.name ||
                        "N/A"}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {selectedOrder.user?.email || "N/A"}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {selectedOrder.shippingAddress?.phone || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className={styles.infoCard}>
                  <h4>
                    <FiMapPin size={16} /> Shipping Address
                  </h4>
                  <div className={styles.infoContent}>
                    {selectedOrder.shippingAddress ? (
                      <>
                        <p>
                          <strong>{selectedOrder.shippingAddress.name}</strong>
                        </p>
                        <p>{selectedOrder.shippingAddress.address}</p>
                        <p>
                          {selectedOrder.shippingAddress.city},{" "}
                          {selectedOrder.shippingAddress.state}
                        </p>
                        <p>PIN: {selectedOrder.shippingAddress.pincode}</p>
                        <p>Phone: {selectedOrder.shippingAddress.phone}</p>
                      </>
                    ) : (
                      <p>No shipping address available</p>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className={styles.infoCard}>
                  <h4>
                    <FiCreditCard size={16} /> Payment Information
                  </h4>
                  <div className={styles.infoContent}>
                    <p>
                      <strong>Method:</strong>{" "}
                      {selectedOrder.paymentMethod || "N/A"}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {getStatusBadge(selectedOrder.paymentStatus, "payment")}
                    </p>
                  </div>
                </div>

                {/* Order Total */}
                <div className={styles.infoCard}>
                  <h4>
                    <FiDollarSign size={16} /> Order Summary
                  </h4>
                  <div className={styles.infoContent}>
                    <div className={styles.priceRow}>
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className={styles.priceRow}>
                      <span>Delivery Charges:</span>
                      <span>
                        {formatCurrency(selectedOrder.deliveryCharges || 0)}
                      </span>
                    </div>
                    <div className={`${styles.priceRow} ${styles.totalRow}`}>
                      <strong>Total:</strong>
                      <strong>
                        {formatCurrency(selectedOrder.finalAmount)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking Information */}
              {(selectedOrder.trackingNumber ||
                selectedOrder.expectedDelivery) && (
                <div className={styles.trackingInfo}>
                  <h4>
                    <FiTruck size={16} /> Tracking Information
                  </h4>
                  <div className={styles.trackingContent}>
                    {selectedOrder.trackingNumber && (
                      <p>
                        <strong>Tracking Number:</strong>{" "}
                        {selectedOrder.trackingNumber}
                      </p>
                    )}
                    {selectedOrder.expectedDelivery && (
                      <p>
                        <strong>Expected Delivery:</strong>{" "}
                        {formatShortDate(selectedOrder.expectedDelivery)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Products */}
              <div className={styles.orderItems}>
                <h4>
                  <FiBox size={16} /> Order Products (
                  {selectedOrder.products?.length || 0})
                </h4>
                <div className={styles.itemsList}>
                  {selectedOrder.products?.map((item, index) => (
                    <div key={index} className={styles.orderItem}>
                      <div className={styles.itemImage}>
                        {item.imgUrl ? (
                          <img
                            src={item.imgUrl}
                            alt={item.title || "Product"}
                          />
                        ) : (
                          <div className={styles.noImage}>
                            <FiBox size={24} />
                          </div>
                        )}
                      </div>
                      <div className={styles.itemDetails}>
                        <h5>{item.title || "Product"}</h5>
                        <div className={styles.itemMeta}>
                          <span>Size: {item.size}</span>
                          <span>Qty: {item.quantity}</span>
                          {item.productStatus && (
                            <span className={styles.productStatus}>
                              {getStatusBadge(item.productStatus, "order")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.itemPrice}>
                        <span className={styles.unitPrice}>
                          {formatCurrency(item.price)} × {item.quantity}
                        </span>
                        <span className={styles.totalPrice}>
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryBtn}
                onClick={() => setShowOrderModal(false)}
              >
                Close
              </button>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  setShowOrderModal(false);
                  openStatusModal(selectedOrder);
                }}
              >
                <FiEdit size={16} />
                Change Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className={`${styles.modal} ${styles.smallModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <FiEdit size={20} />
                <h2>Change Order Status</h2>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowStatusModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.orderInfo}>
                <span className={styles.orderInfoLabel}>Order:</span>
                <span className={styles.orderInfoValue}>
                  #{selectedOrder.orderId}
                </span>
              </div>

              <div className={styles.currentStatus}>
                <span>Current Status:</span>
                {getStatusBadge(selectedOrder.orderStatus, "order")}
              </div>

              <div className={styles.formGroup}>
                <label>New Status *</label>
                <div className={styles.statusOptions}>
                  {orderStatuses.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      className={`${styles.statusOption} ${
                        newStatus === status.value ? styles.selected : ""
                      }`}
                      style={{
                        borderColor:
                          newStatus === status.value
                            ? status.color
                            : "transparent",
                        backgroundColor:
                          newStatus === status.value
                            ? `${status.color}15`
                            : "transparent",
                      }}
                      onClick={() => setNewStatus(status.value)}
                    >
                      <status.icon size={16} style={{ color: status.color }} />
                      <span>{status.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Note (Optional)</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Add a note about this status change..."
                  className={styles.textarea}
                  rows={3}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryBtn}
                onClick={() => setShowStatusModal(false)}
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                className={styles.primaryBtn}
                onClick={handleUpdateStatus}
                disabled={updatingStatus || !newStatus}
              >
                {updatingStatus ? (
                  <>
                    <div className={styles.btnSpinner}></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FiCheck size={16} />
                    Update Status
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && orderToDelete && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className={`${styles.modal} ${styles.smallModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <FiAlertCircle size={20} color="#ef4444" />
                <h2>Delete Order</h2>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowDeleteModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.deleteWarning}>
                <p>Are you sure you want to delete this order?</p>
                <div className={styles.deleteOrderInfo}>
                  <div className={styles.deleteInfoRow}>
                    <strong>Order ID:</strong>
                    <span>{orderToDelete.orderId}</span>
                  </div>
                  <div className={styles.deleteInfoRow}>
                    <strong>Customer:</strong>
                    <span>
                      {orderToDelete.user?.name ||
                        orderToDelete.shippingAddress?.name ||
                        "N/A"}
                    </span>
                  </div>
                  <div className={styles.deleteInfoRow}>
                    <strong>Amount:</strong>
                    <span>{formatCurrency(orderToDelete.finalAmount)}</span>
                  </div>
                  <div className={styles.deleteInfoRow}>
                    <strong>Status:</strong>
                    <span>
                      {getStatusBadge(orderToDelete.orderStatus, "order")}
                    </span>
                  </div>
                </div>
                <p className={styles.deleteNote}>
                  <FiAlertCircle size={14} />
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryBtn}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.deleteConfirmBtn}
                onClick={handleDeleteOrder}
              >
                <FiTrash2 size={16} />
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOrders;
