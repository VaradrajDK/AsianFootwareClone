// App.js
import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Home from "./Pages/Home";
import { BrowserRouter, useLocation } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "./Redux/userStore.js";
import api from "./services/axiosConfig.js";
import Login from "./Pages/Login";
import Register from "./Pages/Register";

// Seller Pages
import SellerProducts from "./Pages/Seller/SellerOrders.jsx";
import SellerOrders from "./Pages/Seller/SellerOrders.jsx";
import Dashboard from "./Pages/Seller/Dashboard.jsx";

// Admin Pages
import ProtectedRoute from "./Components/ProtectedRoute.jsx";
import AdminDashboard from "./Pages/Admin/AdminDashboard.jsx";

// Public Pages
import PublicProducts from "./Pages/Mens/PublicProducts.jsx";
import SingleProductPage from "./Pages/SingleProduct/SingleProductPage.jsx";

// Import Header Component
import Header from "./Components/Header";
import Wishlist from "./Components/Wishlist.jsx";
import CartPage from "./Pages/Cart/CartPage.jsx";
import UserProfile from "./Pages/userDetails/UserProfile.jsx";
import InstantCheckout from "./Pages/InstantCheckout.jsx";

// Import Order Pages
import OrderConfirmation from "./Pages/Orders/OrderConfirmation.jsx";
import MyOrders from "./Pages/Orders/MyOrders.jsx";
import OrderDetails from "./Pages/Orders/OrderDetails.jsx";

// Layout component to handle conditional header rendering
function Layout({ children }) {
  const location = useLocation();

  // Pages where header should NOT be shown
  const noHeaderPages = ["/login", "/register", "/seller-dash", "/admin-dash"];

  // Check if current page should hide header
  const shouldShowHeader = !noHeaderPages.some((page) =>
    location.pathname.toLowerCase().startsWith(page.toLowerCase())
  );

  return (
    <>
      {shouldShowHeader && <Header />}
      <main>{children}</main>
    </>
  );
}

function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo);
  const token = useSelector((state) => state.user.token);

  async function getUserData() {
    try {
      const response = await api.get("/auth/getLoggedInUser");
      if (response.data.success) {
        // ✅ Dispatch with both user and token
        dispatch(
          login({
            user: response.data.user,
            token: token || localStorage.getItem("token"),
          })
        );
      }
    } catch (error) {
      console.log("error fetching user data", error);
      // Clear invalid token if authentication fails
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }
    }
  }

  useEffect(() => {
    // ✅ ONLY fetch user data if token exists
    const storedToken = localStorage.getItem("token");

    if (!user && storedToken) {
      getUserData();
    }
    // ✅ If no token, do nothing - allow public browsing
  }, []); // Only run once on mount

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Layout>
        <Routes>
          {/* ==================== MAIN PAGES - PUBLIC ==================== */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ==================== SELLER PAGES - PROTECTED ==================== */}
          <Route path="/seller-dash" element={<Dashboard />} />
          <Route path="/getSellerProducts" element={<SellerProducts />} />
          <Route path="/getsellerOrders" element={<SellerOrders />} />

          {/* ==================== ADMIN PAGES - PROTECTED ==================== */}
          <Route
            path="/admin-dash"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ==================== PRODUCT PAGES - PUBLIC ==================== */}
          <Route path="/products" element={<PublicProducts />} />
          <Route path="/product/:id" element={<SingleProductPage />} />

          {/* ==================== USER PAGES - PROTECTED ==================== */}
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/checkout" element={<InstantCheckout />} />

          {/* ==================== ORDER PAGES - PROTECTED ==================== */}
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/order/:orderId" element={<OrderDetails />} />
          <Route
            path="/order-confirmation/:orderId"
            element={<OrderConfirmation />}
          />

          {/* ==================== 404 NOT FOUND ==================== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

// Simple 404 Not Found Component
function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
        padding: "20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "72px", margin: "0" }}>404</h1>
      <h2 style={{ fontSize: "32px", margin: "20px 0" }}>Page Not Found</h2>
      <p style={{ fontSize: "18px", marginBottom: "30px" }}>
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        style={{
          padding: "12px 30px",
          background: "white",
          color: "#667eea",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "16px",
          transition: "all 0.3s ease",
        }}
      >
        Go Back Home
      </a>
    </div>
  );
}

export default App;
