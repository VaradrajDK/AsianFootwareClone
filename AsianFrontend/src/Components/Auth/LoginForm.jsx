// Pages/Auth/LoginForm.jsx
import React, { useState, useEffect } from "react";
import { login } from "../../Redux/userStore";
import { useDispatch, useSelector } from "react-redux";
import api from "../../services/axiosConfig.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "../../Styles/Auth/LoginForm.module.css";

const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const [showPassword, setShowPassword] = useState(false);
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    role: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate all fields
      if (!userData.email || !userData.password || !userData.role) {
        toast.warning("Please fill all fields");
        setIsLoading(false);
        return;
      }

      console.log("🔐 Login attempt:", {
        email: userData.email,
        role: userData.role,
      });

      // Make API call
      const response = await api.post("/auth/login", userData);

      console.log("✅ API Response:", response.data);

      if (response.data.success) {
        const { user: loggedInUser, token } = response.data;

        console.log("👤 Logged in user:", loggedInUser);
        console.log("🔑 Token received:", token ? "Yes" : "No");

        // ✅ Verify role matches
        if (loggedInUser.role !== userData.role) {
          console.error("❌ Role mismatch:", {
            expected: userData.role,
            actual: loggedInUser.role,
          });
          toast.error(
            `This account is registered as ${loggedInUser.role}, not ${userData.role}`
          );
          setIsLoading(false);
          return;
        }

        // ✅ Dispatch login with user data AND token
        console.log("📦 Dispatching login to Redux...");
        dispatch(
          login({
            user: loggedInUser,
            token: token,
          })
        );

        console.log("✅ Redux state updated");

        // ✅ Show success message based on role
        const roleMessages = {
          admin: "Welcome Admin! Redirecting to admin dashboard...",
          seller: "Welcome back! Redirecting to seller dashboard...",
          user: "Login successful! Welcome back!",
        };

        toast.success(roleMessages[loggedInUser.role] || response.data.message);

        // Clear form
        setUserData({
          email: "",
          password: "",
          role: "",
        });

        // ✅ Navigate based on role
        const roleRoutes = {
          admin: "/admin-dash",
          seller: "/seller-dash",
          user: "/",
        };

        const route = roleRoutes[loggedInUser.role] || "/";
        console.log("🚀 Navigating to:", route);

        // Navigate immediately
        setTimeout(() => {
          navigate(route, { replace: true });
        }, 500);
      } else {
        console.error("❌ Login failed:", response.data.message);
        toast.error(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("❌ Login error:", error);

      // ✅ Handle specific error messages
      if (error.response?.status === 401) {
        toast.error("Invalid email or password");
      } else if (error.response?.status === 403) {
        toast.error(
          error.response.data.message || "Your account has been deactivated"
        );
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || "Invalid login data");
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "An error occurred during login. Please try again.";
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Redirect if already logged in
  useEffect(() => {
    console.log("🔍 Checking auth status:", {
      user: user,
      isAuthenticated: isAuthenticated,
    });

    if (isAuthenticated && user && user.userId && user.role) {
      console.log("✅ User already logged in, redirecting...");
      const roleRoutes = {
        admin: "/admin-dash",
        seller: "/seller-dash",
        user: "/",
      };
      const route = roleRoutes[user.role] || "/";
      console.log("🚀 Redirecting to:", route);
      navigate(route, { replace: true });
    }
  }, [user, isAuthenticated, navigate]);

  return (
    <div className={styles.mainContent}>
      <div className={styles.loginFormCard}>
        <div className={styles.banner}>
          <img
            className={styles.loginImg}
            src="https://cdn.asianlive.in/digital-website/Fotwear-Sale_11864338494287093289.jpg?tr=w-1536"
            alt="login-img"
          />
        </div>
        <div className={styles.loginForm}>
          <h1>Log In to Your Account</h1>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                required
                value={userData.email}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                value={userData.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <div className={styles.showPassword}>
                <input
                  type="checkbox"
                  id="show-password"
                  name="show-password"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={isLoading}
                />
                <label htmlFor="show-password">Show Password</label>
              </div>
              <div className={styles.forgotPassword}>
                <a href="/forgot-password">Forgot Password?</a>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role">I'm Logging In as</label>
              <select
                id="role"
                name="role"
                value={userData.role}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="">Select role</option>
                <option value="user">Regular User</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* ✅ Admin Warning - Only shows when admin is selected */}
            {userData.role === "admin" && (
              <div className={styles.adminWarning}>
                ⚠️ You are logging in with administrator privileges
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "Logging In..." : "Log In"}
            </button>

            <div className={styles.formFooter}>
              Don't have an account? <a href="/register">Sign up</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
