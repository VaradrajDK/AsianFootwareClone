// Components/Admin/Dashboard/ViewUsers.jsx
import React, { useState, useEffect } from "react";
import styles from "../../../Styles/Admin/ViewUsers.module.css";
import api from "../../../services/axiosConfig";
import { toast } from "react-toastify";
import ActionDropdown from "../../Common/ActionDropdown";
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiUserPlus,
  FiRefreshCw,
  FiEye,
  FiToggleLeft,
  FiToggleRight,
  FiShoppingBag,
  FiUser,
  FiShield,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";

const ViewUsers = ({ setActiveMenu, setSelectedUserId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, statusFilter, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(roleFilter !== "all" && { role: roleFilter }),
      });

      const response = await api.get(`/admin/all-users?${params}`);

      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedUser(null);
  };

  const handleEditUser = (userId, userRole) => {
    setSelectedUserId({ id: userId, role: userRole });
    setActiveMenu("edit-user");
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"?`))
      return;

    try {
      const response = await api.delete(`/admin/all-users/${userId}`);

      if (response.data.success) {
        toast.success("✅ User deleted successfully!");
        fetchUsers();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "❌ Failed to delete user");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await api.patch(
        `/admin/all-users/${userId}/toggle-status`
      );

      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
        fetchUsers();
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error(
        error.response?.data?.message || "❌ Failed to update status"
      );
    }
  };

  const handleVerifySeller = async (sellerId, currentStatus) => {
    try {
      const response = await api.patch(`/admin/sellers/${sellerId}/verify`, {
        isVerified: !currentStatus,
      });

      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
        fetchUsers();
      }
    } catch (error) {
      console.error("Verify seller error:", error);
      toast.error(
        error.response?.data?.message || "❌ Failed to verify seller"
      );
    }
  };

  // Generate actions for each user
  const getUserActions = (user) => {
    const actions = [
      {
        label: "View Details",
        icon: <FiEye size={16} />,
        onClick: () => handleViewUser(user),
        variant: "primary",
      },
      {
        label: "Edit User",
        icon: <FiEdit size={16} />,
        onClick: () => handleEditUser(user._id, user.role),
      },
      {
        label: user.isActive ? "Deactivate" : "Activate",
        icon: user.isActive ? (
          <FiToggleLeft size={16} />
        ) : (
          <FiToggleRight size={16} />
        ),
        onClick: () => handleToggleStatus(user._id, user.isActive),
        variant: user.isActive ? "warning" : "success",
      },
    ];

    // Add verify option for sellers
    if (user.role === "seller") {
      actions.push({
        label: user.isVerified ? "Unverify Seller" : "Verify Seller",
        icon: <FiCheckCircle size={16} />,
        onClick: () => handleVerifySeller(user._id, user.isVerified),
        variant: user.isVerified ? "warning" : "success",
        badge: user.isVerified ? "✓" : null,
      });
    }

    // Add divider before delete
    actions.push({ divider: true });

    // Add delete action
    actions.push({
      label: "Delete User",
      icon: <FiTrash2 size={16} />,
      onClick: () => handleDelete(user._id, user.name),
      variant: "danger",
    });

    return actions;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <FiShield size={14} />;
      case "seller":
        return <FiShoppingBag size={14} />;
      default:
        return <FiUser size={14} />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "#ef4444";
      case "seller":
        return "#f59e0b";
      default:
        return "#3b82f6";
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FiUsers size={28} />
          <div>
            <h1 className={styles.title}>User Management</h1>
            <p className={styles.subtitle}>
              Manage all users, sellers, and admins
            </p>
          </div>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setActiveMenu("add-user")}
        >
          <FiUserPlus size={18} />
          <span>Add User</span>
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <FiUser size={20} />
            <div>
              <span className={styles.summaryCount}>{summary.totalUsers}</span>
              <span className={styles.summaryLabel}>Users</span>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <FiShoppingBag size={20} />
            <div>
              <span className={styles.summaryCount}>
                {summary.totalSellers}
              </span>
              <span className={styles.summaryLabel}>Sellers</span>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <FiShield size={20} />
            <div>
              <span className={styles.summaryCount}>{summary.totalAdmins}</span>
              <span className={styles.summaryLabel}>Admins</span>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <FiCheckCircle size={20} color="#10b981" />
            <div>
              <span className={styles.summaryCount}>{summary.activeUsers}</span>
              <span className={styles.summaryLabel}>Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <FiFilter size={16} />
          <span>Status:</span>
          <button
            className={`${styles.filterBtn} ${
              statusFilter === "all" ? styles.active : ""
            }`}
            onClick={() => handleStatusFilter("all")}
          >
            All
          </button>
          <button
            className={`${styles.filterBtn} ${
              statusFilter === "active" ? styles.active : ""
            }`}
            onClick={() => handleStatusFilter("active")}
          >
            Active
          </button>
          <button
            className={`${styles.filterBtn} ${
              statusFilter === "inactive" ? styles.active : ""
            }`}
            onClick={() => handleStatusFilter("inactive")}
          >
            Inactive
          </button>
        </div>

        <div className={styles.filterGroup}>
          <span>Role:</span>
          <button
            className={`${styles.filterBtn} ${
              roleFilter === "all" ? styles.active : ""
            }`}
            onClick={() => handleRoleFilter("all")}
          >
            All
          </button>
          <button
            className={`${styles.filterBtn} ${
              roleFilter === "user" ? styles.active : ""
            }`}
            onClick={() => handleRoleFilter("user")}
          >
            Users
          </button>
          <button
            className={`${styles.filterBtn} ${
              roleFilter === "seller" ? styles.active : ""
            }`}
            onClick={() => handleRoleFilter("seller")}
          >
            Sellers
          </button>
          <button
            className={`${styles.filterBtn} ${
              roleFilter === "admin" ? styles.active : ""
            }`}
            onClick={() => handleRoleFilter("admin")}
          >
            Admins
          </button>
        </div>

        <button
          className={styles.refreshBtn}
          onClick={fetchUsers}
          disabled={loading}
          title="Refresh Users"
        >
          <FiRefreshCw size={18} className={loading ? styles.spinning : ""} />
        </button>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        {users.length === 0 ? (
          <div className={styles.emptyState}>
            <FiUsers size={64} />
            <h3>No users found</h3>
            <p>Try adjusting your filters or add a new user.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className={styles.userCell}>
                        <div
                          className={styles.avatar}
                          style={{
                            backgroundColor: getRoleColor(user.role),
                          }}
                        >
                          {user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className={styles.userName}>
                            {user.name}
                            {user.role === "seller" && user.isVerified && (
                              <FiCheckCircle
                                size={14}
                                color="#10b981"
                                style={{ marginLeft: 4 }}
                                title="Verified Seller"
                              />
                            )}
                          </div>
                          <div className={styles.userEmail}>{user.email}</div>
                          {user.role === "seller" && user.brandName && (
                            <div className={styles.brandName}>
                              {user.brandName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{user.mobile}</td>
                    <td>
                      <span
                        className={styles.roleBadge}
                        style={{
                          backgroundColor: `${getRoleColor(user.role)}15`,
                          color: getRoleColor(user.role),
                        }}
                      >
                        {getRoleIcon(user.role)}
                        <span>{user.role}</span>
                      </span>
                    </td>
                    <td>{user.orderCount || 0}</td>
                    <td>₹{(user.totalSpent || 0).toLocaleString("en-IN")}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          user.isActive ? styles.active : styles.inactive
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <ActionDropdown
                        actions={getUserActions(user)}
                        align="right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* View User Details Modal */}
      {showViewModal && selectedUser && (
        <div className={styles.modalOverlay} onClick={closeViewModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>User Details</h2>
              <button className={styles.closeBtn} onClick={closeViewModal}>
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <strong>Name:</strong>
                <span>{selectedUser.name}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Email:</strong>
                <span>{selectedUser.email}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Mobile:</strong>
                <span>{selectedUser.mobile}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Role:</strong>
                <span
                  className={styles.roleBadge}
                  style={{
                    backgroundColor: `${getRoleColor(selectedUser.role)}15`,
                    color: getRoleColor(selectedUser.role),
                  }}
                >
                  {getRoleIcon(selectedUser.role)}
                  <span>{selectedUser.role}</span>
                </span>
              </div>
              {selectedUser.role === "seller" && (
                <>
                  <div className={styles.detailRow}>
                    <strong>Brand Name:</strong>
                    <span>{selectedUser.brandName || "N/A"}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <strong>Verified:</strong>
                    <span
                      className={`${styles.statusBadge} ${
                        selectedUser.isVerified
                          ? styles.active
                          : styles.inactive
                      }`}
                    >
                      {selectedUser.isVerified ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <strong>Products:</strong>
                    <span>{selectedUser.productCount || 0}</span>
                  </div>
                </>
              )}
              <div className={styles.detailRow}>
                <strong>Status:</strong>
                <span
                  className={`${styles.statusBadge} ${
                    selectedUser.isActive ? styles.active : styles.inactive
                  }`}
                >
                  {selectedUser.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className={styles.detailRow}>
                <strong>Total Orders:</strong>
                <span>{selectedUser.orderCount || 0}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Total Spent:</strong>
                <span>
                  ₹{(selectedUser.totalSpent || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className={styles.detailRow}>
                <strong>Joined:</strong>
                <span>
                  {new Date(selectedUser.createdAt).toLocaleDateString(
                    "en-IN",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.editBtn}
                onClick={() => {
                  closeViewModal();
                  handleEditUser(selectedUser._id, selectedUser.role);
                }}
              >
                <FiEdit size={16} />
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewUsers;
