// controller/auth.controller.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../model/user.schema.js";
import Seller from "../model/seller.schema.js";
import Admin from "../model/admin.schema.js";

// ✅ Debug: Check if JWT_TOKEN is loaded
console.log("JWT_TOKEN loaded:", process.env.JWT_TOKEN ? "✅ Yes" : "❌ No");

// ✅ Get JWT secret with validation
const getJWTSecret = () => {
  const secret = process.env.JWT_TOKEN;
  if (!secret) {
    throw new Error("JWT_TOKEN environment variable is not set!");
  }
  return secret;
};

// Model mapping
const models = {
  user: User,
  seller: Seller,
  admin: Admin,
};

const allowedRoles = ["user", "seller", "admin"];

const Login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password, and role are required",
        success: false,
      });
    }

    const normalizedRole = role.toLowerCase();
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role", success: false });
    }

    const Model = models[normalizedRole];
    const user = await Model.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid email or password", success: false });
    }

    // Check if admin is active
    if (normalizedRole === "admin" && !user.isActive) {
      return res.status(403).json({
        message: "Admin account is deactivated",
        success: false,
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ message: "Invalid email or password", success: false });
    }

    // Update last login for admin
    if (normalizedRole === "admin") {
      user.lastLogin = new Date();
      await user.save();
    }

    // ✅ Get JWT secret safely
    let jwtSecret;
    try {
      jwtSecret = getJWTSecret();
    } catch (error) {
      console.error("JWT Secret Error:", error.message);
      return res.status(500).json({
        message: "Server configuration error",
        success: false,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: normalizedRole,
      },
      jwtSecret, // ✅ Use validated secret
      { expiresIn: "7d" }
    );

    // Set cookie
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // Build response user object
    const responseUser = {
      name: user.name,
      userId: user._id,
      role: normalizedRole,
      email: user.email,
    };

    if (normalizedRole === "seller" && user.brandName) {
      responseUser.brandName = user.brandName;
    }

    return res.status(200).json({
      message: "Login successful",
      success: true,
      user: responseUser,
      token: token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const Register = async (req, res) => {
  try {
    const { name, email, mobile, password, role, brandName } = req.body;

    if (!name || !email || !mobile || !password || !role) {
      return res
        .status(400)
        .json({ message: "All fields are required", success: false });
    }

    const normalizedRole = role.toLowerCase();
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role", success: false });
    }

    // Validate seller requires brandName
    if (normalizedRole === "seller" && !brandName) {
      return res.status(400).json({
        message: "Brand name is required for seller",
        success: false,
      });
    }

    const Model = models[normalizedRole];

    // Check if user already exists
    const existingUser = await Model.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: `${normalizedRole} with this email already exists`,
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Build user data based on role
    const newUserData = {
      name,
      email,
      mobile,
      password: hashedPassword,
      role: normalizedRole,
    };

    if (normalizedRole === "seller") {
      newUserData.brandName = brandName;
    }

    const newUser = new Model(newUserData);
    await newUser.save();

    // Build response
    const responseUser = {
      name: newUser.name,
      userId: newUser._id,
      role: normalizedRole,
      email: newUser.email,
    };

    if (normalizedRole === "seller") {
      responseUser.brandName = newUser.brandName;
    }

    return res.status(201).json({
      message: `${
        normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)
      } registered successfully`,
      success: true,
      user: responseUser,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const getLoggedInUser = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    let user = null;
    let role = null;

    // Check each model
    user = await User.findById(req.userId);
    if (user) role = "user";

    if (!user) {
      user = await Seller.findById(req.userId);
      if (user) role = "seller";
    }

    if (!user) {
      user = await Admin.findById(req.userId);
      if (user) role = "admin";
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    const responseUser = {
      name: user.name,
      userId: user._id,
      role,
      email: user.email,
    };

    if (role === "seller" && user.brandName) {
      responseUser.brandName = user.brandName;
    }

    return res.status(200).json({
      message: "User data fetched successfully",
      success: true,
      user: responseUser,
    });
  } catch (error) {
    console.error("Error fetching logged-in user:", error);
    return res
      .status(500)
      .json({ message: "Error in getting current user", success: false });
  }
};

const Logout = async (req, res) => {
  try {
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production";

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful",
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

export { Login, Register, getLoggedInUser, Logout };
