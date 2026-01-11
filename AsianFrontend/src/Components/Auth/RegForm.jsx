import React, { useState, useEffect } from "react";
import styles from "../../Styles/Auth/RegForm.module.css";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../services/axiosConfig.js";
import { toast } from "react-toastify";

const RegForm = () => {
  const user = useSelector((state) => state.user.userInfo);
  const router = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    role: "user",
    brandName: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Validate all required fields
      if (
        !userData.name ||
        !userData.email ||
        !userData.mobile ||
        !userData.password ||
        !userData.confirmPassword ||
        !userData.role
      ) {
        toast.warning("Please fill all required fields");
        return;
      }

      // Validate brand name for sellers
      if (userData.role.toLowerCase() === "seller" && !userData.brandName) {
        toast.warning("Brand name is required for seller registration");
        return;
      }

      // Validate password match
      if (userData.password !== userData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      // Validate password length
      if (userData.password.length < 6) {
        toast.warning("Password must be at least 6 characters long");
        return;
      }

      // Prepare data for API call (exclude confirmPassword)
      const registrationData = {
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        password: userData.password,
        role: userData.role,
      };

      // Add brandName only for sellers
      if (userData.role.toLowerCase() === "seller") {
        registrationData.brandName = userData.brandName;
      }

      // API call
      const response = await api.post("/auth/register", registrationData);

      if (response.data.success) {
        toast.success(response.data.message);
        // Reset form
        setUserData({
          name: "",
          email: "",
          mobile: "",
          password: "",
          confirmPassword: "",
          role: "user",
          brandName: "",
        });
        // Redirect to login page
        router("/login");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      // Handle error response
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
      console.error("Registration error:", error);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      router("/");
    }
  }, [user, router]);

  return (
    <div className={styles.mainContent}>
      <div className={styles.signupFormCard}>
        <div className={styles.banner}>
          <img
            className={styles.signupImg}
            src="https://cdn.asianlive.in/digital-website/Fotwear-Sale_11864338494287093289.jpg?tr=w-1536"
            alt="signup-img"
          />
        </div>
        <div className={styles.signupForm}>
          <h1>Create Your Account</h1>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={userData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="mobile">Mobile Number</label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={userData.mobile}
                onChange={handleChange}
                placeholder="Enter your mobile number"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={userData.password}
                onChange={handleChange}
                placeholder="Create a password (min 6 characters)"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                name="confirmPassword"
                value={userData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="role">I'm signing up as</label>
              <select
                id="role"
                name="role"
                value={userData.role}
                onChange={handleChange}
              >
                <option value="user">Regular User</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {userData.role.toLowerCase() === "seller" && (
              <div className={styles.formGroup}>
                <label htmlFor="brandName">Brand Name</label>
                <input
                  type="text"
                  id="brandName"
                  name="brandName"
                  value={userData.brandName}
                  onChange={handleChange}
                  placeholder="Enter your brand name"
                  required
                />
              </div>
            )}
            <button type="submit" className={styles.submitButton}>
              Sign Up
            </button>
            <div className={styles.formFooter}>
              Already have an account? <a href="/login">Log in</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegForm;
