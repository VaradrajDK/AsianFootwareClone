// controllers/admin.controllers.js
import mongoose from "mongoose";
import User from "../model/user.schema.js";
import Seller from "../model/seller.schema.js";
import Admin from "../model/admin.schema.js";
import Product from "../model/product.schema.js";
import Order from "../model/order.schema.js";
import Category from "../model/Category.schema.js";
import Banner from "../model/Banner.schema.js";
import bcrypt from "bcrypt";
import fs from "fs";

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

const GetDashboardStats = async (req, res) => {
  try {
    // Get counts
    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      activeUsers,
      activeSellers,
      activeProducts,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Seller.countDocuments(),
      Product.countDocuments({ isDeleted: false }),
      Order.countDocuments(),
      User.countDocuments({ isActive: true }),
      Seller.countDocuments({ isActive: true }),
      Product.countDocuments({ isDeleted: false, isArchived: false }),
      Order.countDocuments({ orderStatus: "Pending" }),
      Order.countDocuments({ orderStatus: "Delivered" }),
      Order.countDocuments({ orderStatus: "Cancelled" }),
    ]);

    // Get revenue stats
    const revenueStats = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, todayRevenue, todayUsers] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, paymentStatus: "Paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      User.countDocuments({ createdAt: { $gte: today } }),
    ]);

    // Get this month's stats
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [monthlyOrders, monthlyRevenue, monthlyUsers] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        {
          $match: { createdAt: { $gte: startOfMonth }, paymentStatus: "Paid" },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

    // Get last 7 days order trend
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const orderTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: {
        overview: {
          totalUsers,
          totalSellers,
          totalProducts,
          totalOrders,
          activeUsers,
          activeSellers,
          activeProducts,
        },
        orders: {
          pending: pendingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
        },
        revenue: {
          total: revenueStats[0]?.totalRevenue || 0,
          avgOrderValue: revenueStats[0]?.avgOrderValue || 0,
        },
        today: {
          orders: todayOrders,
          revenue: todayRevenue[0]?.total || 0,
          newUsers: todayUsers,
        },
        thisMonth: {
          orders: monthlyOrders,
          revenue: monthlyRevenue[0]?.total || 0,
          newUsers: monthlyUsers,
        },
        orderTrend,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard stats",
      error: error.message,
    });
  }
};

const GetRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("user", "name email")
      .select("orderId totalAmount orderStatus createdAt")
      .lean();

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select("name email createdAt")
      .lean();

    // Get recent products
    const recentProducts = await Product.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("seller", "name brandName")
      .select("title sellingPrice createdAt")
      .lean();

    // Combine and sort by date
    const activities = [
      ...recentOrders.map((order) => ({
        type: "order",
        data: order,
        date: order.createdAt,
      })),
      ...recentUsers.map((user) => ({
        type: "user",
        data: user,
        date: user.createdAt,
      })),
      ...recentProducts.map((product) => ({
        type: "product",
        data: product,
        date: product.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    return res.status(200).json({
      success: true,
      message: "Recent activity fetched successfully",
      activities,
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching recent activity",
      error: error.message,
    });
  }
};

// ============================================
// UNIFIED USER MANAGEMENT (User, Seller, Admin)
// ============================================

// Helper function to find user in any collection
const findUserInAllCollections = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { user: null, userType: null, Model: null };
  }

  // Try User collection first
  let user = await User.findById(id);
  if (user) {
    return { user, userType: "User", Model: User, role: "user" };
  }

  // Try Seller collection
  user = await Seller.findById(id);
  if (user) {
    return { user, userType: "Seller", Model: Seller, role: "seller" };
  }

  // Try Admin collection
  user = await Admin.findById(id);
  if (user) {
    return { user, userType: "Admin", Model: Admin, role: "admin" };
  }

  return { user: null, userType: null, Model: null, role: null };
};

// Get all users from all collections (User, Seller, Admin)
const GetAllRolesUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    let allUsers = [];
    let totalCount = 0;

    // Build base queries
    const userQuery = {};
    const sellerQuery = {};
    const adminQuery = {};

    // Search filter
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      userQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
      ];

      sellerQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { brandName: searchRegex },
      ];

      adminQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
      ];
    }

    // Status filter
    if (status === "active") {
      userQuery.isActive = true;
      sellerQuery.isActive = true;
      adminQuery.isActive = true;
    } else if (status === "inactive") {
      userQuery.isActive = false;
      sellerQuery.isActive = false;
      adminQuery.isActive = false;
    }

    // Role-based filtering
    if (!role || role === "all") {
      // Get ALL users from all three collections
      const [users, sellers, admins] = await Promise.all([
        User.find(userQuery).sort(sort).select("-password -__v").lean(),
        Seller.find(sellerQuery).sort(sort).select("-password -__v").lean(),
        Admin.find(adminQuery).sort(sort).select("-password -__v").lean(),
      ]);

      // Process regular users
      const usersWithRole = users.map((user) => ({
        ...user,
        role: "user",
        userType: "User",
        brandName: null,
        isVerified: null,
      }));

      // Process sellers
      const sellersWithRole = sellers.map((seller) => ({
        ...seller,
        role: "seller",
        userType: "Seller",
        brandName: seller.brandName || null,
        isVerified: seller.isVerified || false,
      }));

      // Process admins
      const adminsWithRole = admins.map((admin) => ({
        ...admin,
        role: "admin",
        userType: "Admin",
        brandName: null,
        isVerified: null,
      }));

      allUsers = [...usersWithRole, ...sellersWithRole, ...adminsWithRole];
      totalCount = allUsers.length;
    } else if (role === "seller") {
      const sellers = await Seller.find(sellerQuery)
        .sort(sort)
        .select("-password -__v")
        .lean();

      allUsers = sellers.map((seller) => ({
        ...seller,
        role: "seller",
        userType: "Seller",
        brandName: seller.brandName || null,
        isVerified: seller.isVerified || false,
      }));
      totalCount = allUsers.length;
    } else if (role === "user") {
      const users = await User.find(userQuery)
        .sort(sort)
        .select("-password -__v")
        .lean();

      allUsers = users.map((user) => ({
        ...user,
        role: "user",
        userType: "User",
        brandName: null,
        isVerified: null,
      }));
      totalCount = allUsers.length;
    } else if (role === "admin") {
      const admins = await Admin.find(adminQuery)
        .sort(sort)
        .select("-password -__v")
        .lean();

      allUsers = admins.map((admin) => ({
        ...admin,
        role: "admin",
        userType: "Admin",
        brandName: null,
        isVerified: null,
      }));
      totalCount = allUsers.length;
    }

    // Sort combined results if getting all roles
    if (!role || role === "all") {
      allUsers.sort((a, b) => {
        const aValue = a[sortBy] || new Date(0);
        const bValue = b[sortBy] || new Date(0);

        if (aValue instanceof Date && bValue instanceof Date) {
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedUsers = allUsers.slice(skip, skip + parseInt(limit));

    // Add stats only for paginated users
    const usersWithStats = await Promise.all(
      paginatedUsers.map(async (user) => {
        let orderCount = 0;
        let totalSpent = 0;
        let productCount = 0;

        if (user.role !== "admin") {
          orderCount = await Order.countDocuments({ user: user._id });

          const totalSpentResult = await Order.aggregate([
            { $match: { user: user._id, paymentStatus: "Paid" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ]);

          totalSpent = totalSpentResult[0]?.total || 0;
        }

        if (user.role === "seller") {
          productCount = await Product.countDocuments({
            seller: user._id,
            isDeleted: false,
          });
        }

        return {
          ...user,
          orderCount,
          totalSpent,
          productCount,
        };
      })
    );

    // Calculate summary
    const summary = {
      totalUsers: allUsers.filter((u) => u.role === "user").length,
      totalSellers: allUsers.filter((u) => u.role === "seller").length,
      totalAdmins: allUsers.filter((u) => u.role === "admin").length,
      activeUsers: allUsers.filter((u) => u.isActive === true).length,
      inactiveUsers: allUsers.filter((u) => u.isActive === false).length,
      totalCount: totalCount,
    };

    return res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
      summary,
    });
  } catch (error) {
    console.error("Error fetching all roles users:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

// Get user by ID (works for User, Seller, Admin)
const GetUserByIDUnified = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const { user, userType, role } = await findUserInAllCollections(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Convert to plain object and remove password
    const userData = user.toObject ? user.toObject() : { ...user };
    delete userData.password;
    delete userData.__v;

    // Get user's orders (for users and sellers)
    let orders = [];
    let stats = { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 };

    if (role !== "admin") {
      orders = await Order.find({ user: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderId totalAmount orderStatus createdAt")
        .lean();

      const orderStats = await Order.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(id) } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$totalAmount" },
            avgOrderValue: { $avg: "$totalAmount" },
          },
        },
      ]);

      stats = orderStats[0] || stats;
    }

    // For sellers, get product stats
    let productStats = null;
    if (role === "seller") {
      const prodStats = await Product.aggregate([
        {
          $match: {
            seller: new mongoose.Types.ObjectId(id),
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: {
              $sum: { $cond: [{ $eq: ["$isArchived", false] }, 1, 0] },
            },
          },
        },
      ]);

      productStats = prodStats[0] || { totalProducts: 0, activeProducts: 0 };
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: {
        ...userData,
        userType,
        role,
        orders,
        stats,
        ...(productStats && { productStats }),
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user",
      error: error.message,
    });
  }
};

// Create user (can create User, Seller, or Admin)
const CreateUserUnified = async (req, res) => {
  try {
    const { name, email, mobile, password, role, brandName } = req.body;

    // Validation
    if (!name || !email || !mobile || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, mobile, password, and role are required",
      });
    }

    // Check for duplicate email across all collections
    const [existingUser, existingSeller, existingAdmin] = await Promise.all([
      User.findOne({ email }),
      Seller.findOne({ email }),
      Admin.findOne({ email }),
    ]);

    if (existingUser || existingSeller || existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser;
    let userType;

    if (role === "seller") {
      newUser = new Seller({
        name,
        email,
        mobile,
        password: hashedPassword,
        role: "seller",
        brandName: brandName || "",
        isActive: true,
        isVerified: false,
      });
      userType = "Seller";
    } else if (role === "admin") {
      newUser = new Admin({
        name,
        email,
        mobile,
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });
      userType = "Admin";
    } else {
      newUser = new User({
        name,
        email,
        mobile,
        password: hashedPassword,
        role: "user",
        isActive: true,
      });
      userType = "User";
    }

    await newUser.save();

    // Remove password from response
    const userData = newUser.toObject();
    delete userData.password;

    return res.status(201).json({
      success: true,
      message: `${userType} created successfully`,
      user: {
        ...userData,
        userType,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating user",
      error: error.message,
    });
  }
};

// Update user (works for User, Seller, Admin)
const UpdateUserByIDUnified = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const { user, userType, Model, role } = await findUserInAllCollections(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build update object based on role
    const updateData = {};

    // Common fields for all roles
    if (updateFields.name !== undefined) updateData.name = updateFields.name;
    if (updateFields.mobile !== undefined)
      updateData.mobile = updateFields.mobile;
    if (updateFields.isActive !== undefined)
      updateData.isActive = updateFields.isActive;

    // Role-specific fields
    if (role === "seller") {
      if (updateFields.brandName !== undefined)
        updateData.brandName = updateFields.brandName;
      if (updateFields.isVerified !== undefined) {
        updateData.isVerified = updateFields.isVerified;
        updateData.verifiedAt = updateFields.isVerified ? new Date() : null;
      }
    }

    if (role === "user") {
      if (updateFields.dob !== undefined) updateData.dob = updateFields.dob;
      if (updateFields.gender !== undefined)
        updateData.gender = updateFields.gender;
      if (updateFields.alternateMobile !== undefined)
        updateData.alternateMobile = updateFields.alternateMobile;
      if (updateFields.addresses !== undefined)
        updateData.addresses = updateFields.addresses;
    }

    updateData.updatedAt = new Date();

    const updatedUser = await Model.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -__v");

    return res.status(200).json({
      success: true,
      message: `${userType} updated successfully`,
      user: {
        ...updatedUser.toObject(),
        role,
        userType,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating user",
      error: error.message,
    });
  }
};

// Toggle status for any user type
const ToggleUserStatusUnified = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const { user, userType, role } = await findUserInAllCollections(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deactivating themselves
    if (role === "admin" && req.userId === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    // Toggle status
    user.isActive = !user.isActive;
    if (user.updatedAt !== undefined) {
      user.updatedAt = new Date();
    }
    await user.save();

    return res.status(200).json({
      success: true,
      message: `${userType} ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        role,
        userType,
      },
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while toggling user status",
      error: error.message,
    });
  }
};

// Delete any user type
const DeleteUserByIDUnified = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = "false" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const { user, userType, Model, role } = await findUserInAllCollections(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    if (role === "admin" && req.userId === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    if (permanent === "true") {
      // Permanent delete
      await Model.findByIdAndDelete(id);

      // If seller, also delete their products
      if (role === "seller") {
        await Product.updateMany(
          { seller: id },
          { isDeleted: true, deletedAt: new Date() }
        );
      }

      return res.status(200).json({
        success: true,
        message: `${userType} permanently deleted`,
      });
    }

    // Soft delete
    const softDeleteData = {
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
    };

    await Model.findByIdAndUpdate(id, softDeleteData);

    // If seller, also soft delete their products
    if (role === "seller") {
      await Product.updateMany(
        { seller: id },
        { isDeleted: true, deletedAt: new Date() }
      );
    }

    return res.status(200).json({
      success: true,
      message: `${userType} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting user",
      error: error.message,
    });
  }
};

// ============================================
// USER MANAGEMENT FUNCTIONS (Original)
// ============================================

const GetAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-password -__v")
        .lean(),
      User.countDocuments(query),
    ]);

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user._id });
        const totalSpent = await Order.aggregate([
          { $match: { user: user._id, paymentStatus: "Paid" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);

        return {
          ...user,
          orderCount,
          totalSpent: totalSpent[0]?.total || 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

const GetUserByID = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select("-password -__v").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's orders
    const orders = await Order.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get user stats
    const stats = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: {
        ...user,
        orders,
        stats: stats[0] || { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 },
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user",
      error: error.message,
    });
  }
};

const UpdateUserByID = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Don't allow password update through this route
    delete updateData.password;
    delete updateData.email;

    const user = await User.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating user",
      error: error.message,
    });
  }
};

const DeleteUserByID = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = "false" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (permanent === "true") {
      await User.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: "User permanently deleted",
      });
    }

    // Soft delete
    await User.findByIdAndUpdate(id, {
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting user",
      error: error.message,
    });
  }
};

const ToggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while toggling user status",
      error: error.message,
    });
  }
};

// ============================================
// SELLER MANAGEMENT FUNCTIONS
// ============================================

const GetAllSellers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      verified,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { brandName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    if (verified === "true") {
      query.isVerified = true;
    } else if (verified === "false") {
      query.isVerified = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [sellers, total] = await Promise.all([
      Seller.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-password -__v")
        .lean(),
      Seller.countDocuments(query),
    ]);

    // Get product counts for each seller
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const productCount = await Product.countDocuments({
          seller: seller._id,
          isDeleted: false,
        });

        const orderCount = await Order.countDocuments({
          "items.seller": seller._id,
        });

        return {
          ...seller,
          productCount,
          orderCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Sellers fetched successfully",
      sellers: sellersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching sellers",
      error: error.message,
    });
  }
};

const GetSellerByID = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await Seller.findById(id).select("-password -__v").lean();

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Get seller's products
    const products = await Product.find({ seller: id, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get seller stats
    const productStats = await Product.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(id), isDeleted: false } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ["$isArchived", false] }, 1, 0] },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Seller fetched successfully",
      seller: {
        ...seller,
        products,
        stats: productStats[0] || { totalProducts: 0, activeProducts: 0 },
      },
    });
  } catch (error) {
    console.error("Error fetching seller:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching seller",
      error: error.message,
    });
  }
};

const UpdateSellerByID = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    // Don't allow password/email update through this route
    delete updateData.password;
    delete updateData.email;

    const seller = await Seller.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Seller updated successfully",
      seller,
    });
  } catch (error) {
    console.error("Error updating seller:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating seller",
      error: error.message,
    });
  }
};

const DeleteSellerByID = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = "false" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await Seller.findById(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (permanent === "true") {
      await Seller.findByIdAndDelete(id);
      // Also delete seller's products
      await Product.updateMany(
        { seller: id },
        { isDeleted: true, deletedAt: new Date() }
      );
      return res.status(200).json({
        success: true,
        message: "Seller and their products permanently deleted",
      });
    }

    // Soft delete
    await Seller.findByIdAndUpdate(id, {
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
    });

    // Also soft delete products
    await Product.updateMany(
      { seller: id },
      { isDeleted: true, deletedAt: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: "Seller deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting seller:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting seller",
      error: error.message,
    });
  }
};

const ToggleSellerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await Seller.findById(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    seller.isActive = !seller.isActive;
    await seller.save();

    return res.status(200).json({
      success: true,
      message: `Seller ${
        seller.isActive ? "activated" : "deactivated"
      } successfully`,
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        brandName: seller.brandName,
        isActive: seller.isActive,
      },
    });
  } catch (error) {
    console.error("Error toggling seller status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while toggling seller status",
      error: error.message,
    });
  }
};

const VerifySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified = true } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await Seller.findByIdAndUpdate(
      id,
      {
        isVerified: verified,
        verifiedAt: verified ? new Date() : null,
      },
      { new: true }
    ).select("-password -__v");

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Seller ${verified ? "verified" : "unverified"} successfully`,
      seller,
    });
  } catch (error) {
    console.error("Error verifying seller:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying seller",
      error: error.message,
    });
  }
};

// ============================================
// PRODUCT MANAGEMENT FUNCTIONS
// ============================================

// Create Product - NEW
const CreateProduct = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      category,
      subCategory,
      gender,
      mrp,
      sellingPrice,
      discount,
      specifications,
      variants,
      seller,
      tags, // NEW: Add tags
    } = req.body;

    console.log("=== CREATE PRODUCT REQUEST ===");
    console.log("Title:", title);
    console.log("Seller:", seller);
    console.log("Variants count:", variants?.length);
    console.log("Tags:", tags);

    // Validation
    if (!title || !slug || !category || !mrp || !sellingPrice || !seller) {
      return res.status(400).json({
        success: false,
        message:
          "Title, slug, category, MRP, selling price, and seller are required",
        missing: {
          title: !title,
          slug: !slug,
          category: !category,
          mrp: !mrp,
          sellingPrice: !sellingPrice,
          seller: !seller,
        },
      });
    }

    // NEW: Validate tags
    const validTags = ["new-arrival", "best-seller", "featured", "trending"];
    let sanitizedTags = [];

    if (tags && Array.isArray(tags)) {
      const invalidTags = tags.filter((tag) => !validTags.includes(tag));
      if (invalidTags.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid tags: ${invalidTags.join(
            ", "
          )}. Valid tags are: ${validTags.join(", ")}`,
        });
      }
      // Remove duplicates
      sanitizedTags = [...new Set(tags)];
    }

    // Check for duplicate slug
    const existingProduct = await Product.findOne({
      slug: slug.toLowerCase().trim(),
      isDeleted: false,
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "A product with this slug already exists",
      });
    }

    // Validate seller exists
    const sellerExists = await Seller.findById(seller);
    if (!sellerExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID - seller not found",
      });
    }

    // Validate variants
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required",
      });
    }

    // Validate each variant
    const allSkus = [];
    const processedVariants = [];

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];

      // Validate color info
      if (!variant.colorName || !variant.hexCode) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1}: Color name and hex code are required`,
        });
      }

      // Validate images
      if (
        !variant.images ||
        !Array.isArray(variant.images) ||
        variant.images.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1}: At least one image URL is required`,
        });
      }

      // Filter and validate image URLs
      const validImages = variant.images.filter((img) => {
        if (!img || typeof img !== "string") return false;
        const trimmed = img.trim();
        if (!trimmed) return false;
        try {
          new URL(trimmed);
          return true;
        } catch {
          return false;
        }
      });

      if (validImages.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1}: No valid image URLs provided`,
        });
      }

      // Validate sizes
      if (
        !variant.sizes ||
        !Array.isArray(variant.sizes) ||
        variant.sizes.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1}: At least one size is required`,
        });
      }

      const processedSizes = [];

      for (let j = 0; j < variant.sizes.length; j++) {
        const size = variant.sizes[j];

        if (!size.size || !size.sku) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1}, Size ${
              j + 1
            }: Size and SKU are required`,
          });
        }

        const skuTrimmed = size.sku.trim().toUpperCase();

        // Check for duplicate SKU within request
        if (allSkus.includes(skuTrimmed)) {
          return res.status(400).json({
            success: false,
            message: `Duplicate SKU found: ${skuTrimmed}. Each size must have a unique SKU.`,
          });
        }

        allSkus.push(skuTrimmed);

        processedSizes.push({
          size: size.size.toString().trim(),
          sku: skuTrimmed,
          stock: parseInt(size.stock) || 0,
          priceOverride: size.priceOverride
            ? parseFloat(size.priceOverride)
            : null,
        });
      }

      processedVariants.push({
        colorName: variant.colorName.trim(),
        hexCode: variant.hexCode.trim(),
        images: validImages.map((img) => img.trim()),
        sizes: processedSizes,
      });
    }

    // Check for existing SKUs in database
    if (allSkus.length > 0) {
      const existingSkuProduct = await Product.findOne({
        isDeleted: false,
        "variants.sizes.sku": { $in: allSkus },
      });

      if (existingSkuProduct) {
        return res.status(400).json({
          success: false,
          message: "One or more SKUs already exist in another product",
        });
      }
    }

    // Create new product
    const newProduct = new Product({
      title: title.trim(),
      slug: slug.toLowerCase().trim(),
      description: description?.trim() || "",
      category: category.trim(),
      subCategory: subCategory?.trim() || "",
      gender: gender || "",
      mrp: parseFloat(mrp),
      sellingPrice: parseFloat(sellingPrice),
      discount: parseFloat(discount) || 0,
      specifications: {
        upperMaterial: specifications?.upperMaterial?.trim() || "",
        soleMaterial: specifications?.soleMaterial?.trim() || "",
        insole: specifications?.insole?.trim() || "",
        closure: specifications?.closure?.trim() || "",
      },
      variants: processedVariants,
      tags: sanitizedTags, // NEW: Add tags
      seller: seller,
      isArchived: false,
      isDeleted: false,
      isFeatured: false,
      isApproved: true,
    });

    console.log("Saving product:", newProduct.title);
    console.log("Product tags:", newProduct.tags);

    await newProduct.save();

    console.log("Product saved successfully with ID:", newProduct._id);

    // Populate seller info for response
    const populatedProduct = await Product.findById(newProduct._id)
      .populate("seller", "name brandName email")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error("=== CREATE PRODUCT ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field}. Please use a unique value.`,
        error: error.message,
      });
    }

    // Handle validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating product",
      error: error.message,
    });
  }
};

// Get All Products
const GetAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category,
      seller,
      status,
      tag, // NEW: Add tag filter
      tags, // NEW: Add multiple tags filter
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (seller) {
      query.seller = seller;
    }

    if (status === "active") {
      query.isArchived = false;
    } else if (status === "archived") {
      query.isArchived = true;
    }

    // NEW: Single tag filter
    if (tag) {
      query.tags = tag;
    }

    // NEW: Multiple tags filter (comma-separated or array)
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(",");
      query.tags = { $in: tagsArray };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("seller", "name brandName email")
        .lean(),
      Product.countDocuments(query),
    ]);

    // Calculate total stock for each product
    const productsWithStats = products.map((product) => {
      let totalStock = 0;
      if (product.variants) {
        product.variants.forEach((variant) => {
          if (variant.sizes) {
            variant.sizes.forEach((size) => {
              totalStock += size.stock || 0;
            });
          }
        });
      }
      return {
        ...product,
        totalStock,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      products: productsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching products",
      error: error.message,
    });
  }
};

// Get Product by ID
const GetProductByID = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({ _id: id, isDeleted: false })
      .populate("seller", "name brandName email mobile")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Calculate total stock
    let totalStock = 0;
    if (product.variants) {
      product.variants.forEach((variant) => {
        if (variant.sizes) {
          variant.sizes.forEach((size) => {
            totalStock += size.stock || 0;
          });
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product: {
        ...product,
        totalStock,
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching product",
      error: error.message,
    });
  }
};

// Update Product by ID
const UpdateProductByID = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({ _id: id, isDeleted: false });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check slug uniqueness if being updated
    if (updateData.slug && updateData.slug !== product.slug) {
      const existingProduct = await Product.findOne({
        slug: updateData.slug.toLowerCase(),
        isDeleted: false,
        _id: { $ne: id },
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "A product with this slug already exists",
        });
      }
    }

    // Build update object
    const updateFields = {};

    if (updateData.title !== undefined)
      updateFields.title = updateData.title.trim();
    if (updateData.slug !== undefined)
      updateFields.slug = updateData.slug.toLowerCase().trim();
    if (updateData.description !== undefined)
      updateFields.description = updateData.description.trim();
    if (updateData.category !== undefined)
      updateFields.category = updateData.category;
    if (updateData.subCategory !== undefined)
      updateFields.subCategory = updateData.subCategory;
    if (updateData.gender !== undefined)
      updateFields.gender = updateData.gender;
    if (updateData.mrp !== undefined)
      updateFields.mrp = parseFloat(updateData.mrp);
    if (updateData.sellingPrice !== undefined)
      updateFields.sellingPrice = parseFloat(updateData.sellingPrice);
    if (updateData.discount !== undefined)
      updateFields.discount = parseFloat(updateData.discount);
    if (updateData.specifications !== undefined)
      updateFields.specifications = updateData.specifications;

    // NEW: Handle tags update
    if (updateData.tags !== undefined) {
      const validTags = ["new-arrival", "best-seller", "featured", "trending"];

      if (!Array.isArray(updateData.tags)) {
        return res.status(400).json({
          success: false,
          message: "Tags must be an array",
        });
      }

      const invalidTags = updateData.tags.filter(
        (tag) => !validTags.includes(tag)
      );
      if (invalidTags.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid tags: ${invalidTags.join(
            ", "
          )}. Valid tags are: ${validTags.join(", ")}`,
        });
      }

      // Remove duplicates
      updateFields.tags = [...new Set(updateData.tags)];
    }

    if (updateData.variants !== undefined) {
      // Validate and process variants
      const allSkus = [];
      const processedVariants = updateData.variants.map((variant) => {
        const processedSizes = variant.sizes.map((size) => {
          const skuTrimmed = size.sku.trim().toUpperCase();
          allSkus.push(skuTrimmed);
          return {
            size: size.size.toString().trim(),
            sku: skuTrimmed,
            stock: parseInt(size.stock) || 0,
            priceOverride: size.priceOverride
              ? parseFloat(size.priceOverride)
              : null,
          };
        });

        return {
          colorName: variant.colorName.trim(),
          hexCode: variant.hexCode,
          images: variant.images.filter((img) => img && img.trim()),
          sizes: processedSizes,
        };
      });

      // Check for duplicate SKUs in other products
      const existingSkuProduct = await Product.findOne({
        _id: { $ne: id },
        isDeleted: false,
        "variants.sizes.sku": { $in: allSkus },
      });

      if (existingSkuProduct) {
        return res.status(400).json({
          success: false,
          message: "One or more SKUs already exist in another product",
        });
      }

      updateFields.variants = processedVariants;
    }

    updateFields.updatedAt = new Date();

    const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    }).populate("seller", "name brandName email");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating product",
      error: error.message,
    });
  }
};

// Delete Product
const DeleteProductByID = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = "false" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (permanent === "true") {
      await Product.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: "Product permanently deleted",
      });
    }

    await Product.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting product",
      error: error.message,
    });
  }
};

// Toggle Product Status
const ToggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({ _id: id, isDeleted: false });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isArchived = !product.isArchived;
    product.archivedAt = product.isArchived ? new Date() : null;
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product ${
        product.isArchived ? "archived" : "activated"
      } successfully`,
      product: {
        _id: product._id,
        title: product.title,
        isArchived: product.isArchived,
      },
    });
  } catch (error) {
    console.error("Error toggling product status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while toggling product status",
      error: error.message,
    });
  }
};

// Approve Product
const ApproveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved = true } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isApproved: approved },
      { new: true }
    ).populate("seller", "name brandName");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product ${approved ? "approved" : "unapproved"} successfully`,
      product,
    });
  } catch (error) {
    console.error("Error approving product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while approving product",
      error: error.message,
    });
  }
};

// Feature Product
const FeatureProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured = true } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isFeatured: featured },
      { new: true }
    ).populate("seller", "name brandName");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product ${featured ? "featured" : "unfeatured"} successfully`,
      product,
    });
  } catch (error) {
    console.error("Error featuring product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while featuring product",
      error: error.message,
    });
  }
};

// ============================================
// ORDER MANAGEMENT FUNCTIONS
// ============================================

const GetAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      paymentStatus,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "shippingAddress.name": { $regex: search, $options: "i" } },
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      query.orderStatus = status;
    }

    // Payment status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Date filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "name email mobile")
        .populate("products.product", "title slug")
        .populate("products.seller", "name brandName")
        .lean(),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
      error: error.message,
    });
  }
};

const GetOrderByID = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id)
      .populate("user", "name email mobile")
      .populate("products.product", "title slug variants")
      .populate("products.seller", "name brandName email")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching order",
      error: error.message,
    });
  }
};

const UpdateOrderByID = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Fields that can be updated
    const allowedFields = [
      "orderStatus",
      "paymentStatus",
      "trackingNumber",
      "expectedDelivery",
      "shippingAddress",
    ];

    const updateFields = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    });

    const order = await Order.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    })
      .populate("user", "name email mobile")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating order",
      error: error.message,
    });
  }
};

const UpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const validStatuses = [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
        validStatuses,
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order status
    order.orderStatus = status;

    // Also update all product statuses to match (optional - depends on your business logic)
    if (order.products && order.products.length > 0) {
      order.products.forEach((product) => {
        product.productStatus = status;
      });
    }

    // If delivered, update payment status to Completed (for COD)
    if (status === "Delivered" && order.paymentMethod === "COD") {
      order.paymentStatus = "Completed";
    }

    // If cancelled, you might want to handle refund logic here
    if (status === "Cancelled" && order.paymentStatus === "Completed") {
      // You can add refund logic here or keep it as is
      // order.paymentStatus = "Refunded";
    }

    await order.save();

    // Populate and return
    const updatedOrder = await Order.findById(id)
      .populate("user", "name email mobile")
      .lean();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating order status",
      error: error.message,
    });
  }
};

const DeleteOrderByID = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // You might want to add checks before deletion
    // For example, prevent deletion of completed orders
    // if (order.orderStatus === "Delivered") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Cannot delete delivered orders",
    //   });
    // }

    await Order.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting order",
      error: error.message,
    });
  }
};

// ============================================
// CATEGORY MANAGEMENT FUNCTIONS
// ============================================

const CreateCategory = async (req, res) => {
  try {
    const { name, description, subCategories } = req.body;

    console.log("=== CREATE CATEGORY REQUEST ===");
    console.log("Body:", req.body);
    console.log("User ID:", req.userId);

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check for duplicate
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Process subcategories
    const processedSubCategories = (subCategories || [])
      .filter((sub) => sub.name && sub.name.trim())
      .map((sub) => ({
        name: sub.name.trim(),
        description: sub.description?.trim() || "",
      }));

    // Create category - use req.userId as seller for admin
    const category = new Category({
      name: name.trim(),
      description: description?.trim() || "",
      subCategories: processedSubCategories,
      seller: req.userId, // ✅ Use the admin's userId as seller
      createdBy: req.userId,
      createdByModel: "Admin",
    });

    console.log("Creating category:", category);

    await category.save();

    console.log("Category created successfully:", category._id);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Handle validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating category",
      error: error.message,
    });
  }
};

const UpdateCategoryByID = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, subCategories } = req.body;

    console.log("=== UPDATE CATEGORY REQUEST ===");
    console.log("Category ID:", id);
    console.log("Body:", req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check for duplicate name (excluding current category)
    if (name && name.trim() !== existingCategory.name) {
      const duplicateCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        _id: { $ne: id },
      });

      if (duplicateCategory) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }
    }

    // Build update data
    const updateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (subCategories !== undefined) {
      updateData.subCategories = subCategories
        .filter((sub) => sub.name && sub.name.trim())
        .map((sub) => ({
          name: sub.name.trim(),
          description: sub.description?.trim() || "",
        }));
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    console.log("Category updated successfully");

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating category",
      error: error.message,
    });
  }
};

const GetAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [categories, total] = await Promise.all([
      Category.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("seller", "name brandName")
        .lean(),
      Category.countDocuments(query),
    ]);

    // Add product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({
          category: cat.name,
          isDeleted: false,
        });
        return { ...cat, productCount };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      categories: categoriesWithCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
      error: error.message,
    });
  }
};

const GetCategoryByID = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id)
      .populate("seller", "name brandName")
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Get products in this category
    const productCount = await Product.countDocuments({
      category: category.name,
      isDeleted: false,
    });

    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      category: {
        ...category,
        productCount,
      },
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching category",
      error: error.message,
    });
  }
};

const DeleteCategoryByID = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({
      category: category.name,
      isDeleted: false,
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productCount} products are using this category. Please reassign or delete those products first.`,
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting category",
      error: error.message,
    });
  }
};

// ============================================
// HELPER: Get Backend URL
// ============================================
const getBackendUrl = (req) => {
  // Try environment variable first
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  // Build from request headers (works for both local and deployed)
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;

  return `${protocol}://${host}`;
};

// ============================================
// BANNER MANAGEMENT FUNCTIONS
// ============================================

const CreateBanner = async (req, res) => {
  try {
    const { title, subtitle, link, order, isActive } = req.body;

    console.log("=== CREATE BANNER REQUEST ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Banner title is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    // Create relative image path (stored in DB)
    const imagePath = `/uploads/banners/${req.file.filename}`;
    console.log("📸 Image path:", imagePath);

    // Create new banner
    const newBanner = new Banner({
      title: title.trim(),
      subtitle: subtitle?.trim() || "",
      image: imagePath, // Store relative path
      link: link?.trim() || "",
      order: parseInt(order) || 0,
      isActive: isActive === "true" || isActive === true,
      position: "home-top",
      startDate: new Date(),
    });

    await newBanner.save();

    // Return with full URL
    const backendUrl = getBackendUrl(req);
    const bannerResponse = {
      ...newBanner.toObject(),
      imageUrl: `${backendUrl}${imagePath}`,
    };

    console.log("✅ Banner created:", newBanner._id);
    console.log("📸 Full URL:", bannerResponse.imageUrl);

    return res.status(201).json({
      success: true,
      message: "Banner created successfully",
      banner: bannerResponse,
    });
  } catch (error) {
    console.error("❌ Create banner error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating banner",
      error: error.message,
    });
  }
};

const UpdateBannerByID = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, link, order, isActive } = req.body;

    console.log("=== UPDATE BANNER REQUEST ===");
    console.log("Banner ID:", id);
    console.log("File:", req.file);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID",
      });
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Build update object
    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (subtitle !== undefined) updateData.subtitle = subtitle.trim();
    if (link !== undefined) updateData.link = link.trim();
    if (order !== undefined) updateData.order = parseInt(order);
    if (isActive !== undefined) {
      updateData.isActive = isActive === "true" || isActive === true;
    }

    // Update image if new file is uploaded
    if (req.file) {
      // Delete old image
      if (banner.image && banner.image.startsWith("/uploads/")) {
        const oldImagePath = `.${banner.image}`;
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log("🗑️ Deleted old image:", oldImagePath);
        }
      }

      // Set new image path
      updateData.image = `/uploads/banners/${req.file.filename}`;
      console.log("📸 New image path:", updateData.image);
    }

    updateData.updatedAt = new Date();

    const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Return with full URL
    const backendUrl = getBackendUrl(req);
    const bannerResponse = {
      ...updatedBanner.toObject(),
      imageUrl: `${backendUrl}${updatedBanner.image}`,
    };

    console.log("✅ Banner updated");

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      banner: bannerResponse,
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating banner",
      error: error.message,
    });
  }
};

const GetAllBanners = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = "order",
      sortOrder = "asc",
    } = req.query;

    const query = {};

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [banners, total] = await Promise.all([
      Banner.find(query).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Banner.countDocuments(query),
    ]);

    // ✅ Add full URL to each banner
    const backendUrl = getBackendUrl(req);

    const bannersWithFullUrl = banners.map((banner) => ({
      ...banner,
      imageUrl: banner.image ? `${backendUrl}${banner.image}` : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Banners fetched successfully",
      banners: bannersWithFullUrl,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching banners",
      error: error.message,
    });
  }
};

const GetBannerByID = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID",
      });
    }

    const banner = await Banner.findById(id).lean();

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // ✅ Add full URL
    const backendUrl = getBackendUrl(req);
    const bannerWithUrl = {
      ...banner,
      imageUrl: banner.image ? `${backendUrl}${banner.image}` : null,
    };

    return res.status(200).json({
      success: true,
      message: "Banner fetched successfully",
      banner: bannerWithUrl,
    });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching banner",
      error: error.message,
    });
  }
};

const DeleteBannerByID = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID",
      });
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Delete image file if exists
    if (banner.image && banner.image.startsWith("/uploads/")) {
      const imagePath = `.${banner.image}`;
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("🗑️ Banner image deleted:", imagePath);
      }
    }

    await Banner.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting banner",
      error: error.message,
    });
  }
};

const ToggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID",
      });
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    // ✅ Add full URL
    const backendUrl = getBackendUrl(req);
    const bannerResponse = {
      ...banner.toObject(),
      imageUrl: banner.image ? `${backendUrl}${banner.image}` : null,
    };

    return res.status(200).json({
      success: true,
      message: `Banner ${
        banner.isActive ? "activated" : "deactivated"
      } successfully`,
      banner: bannerResponse,
    });
  } catch (error) {
    console.error("Error toggling banner status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while toggling banner status",
      error: error.message,
    });
  }
};

// ============================================
// REPORTS & ANALYTICS FUNCTIONS
// ============================================

const GetSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    const matchStage = { paymentStatus: "Paid" };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    let dateFormat;
    switch (groupBy) {
      case "month":
        dateFormat = "%Y-%m";
        break;
      case "year":
        dateFormat = "%Y";
        break;
      default:
        dateFormat = "%Y-%m-%d";
    }

    const salesData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const summary = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Sales report generated successfully",
      data: salesData,
      summary: summary[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
      },
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating sales report",
      error: error.message,
    });
  }
};

const GetUserReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const userGrowth = await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ["$isActive", 1, 0] } },
          inactiveUsers: { $sum: { $cond: ["$isActive", 0, 1] } },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "User report generated successfully",
      data: userGrowth,
      summary: userStats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
      },
    });
  } catch (error) {
    console.error("Error generating user report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating user report",
      error: error.message,
    });
  }
};

const GetProductReport = async (req, res) => {
  try {
    const { category, seller } = req.query;

    const matchStage = { isDeleted: false };
    if (category) matchStage.category = category;
    if (seller) matchStage.seller = new mongoose.Types.ObjectId(seller);

    // Products by category
    const categoryBreakdown = await Product.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$sellingPrice" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Product stats
    const productStats = await Product.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: ["$isArchived", 0, 1] } },
          archivedProducts: { $sum: { $cond: ["$isArchived", 1, 0] } },
          avgPrice: { $avg: "$sellingPrice" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Product report generated successfully",
      data: {
        categoryBreakdown,
      },
      summary: productStats[0] || {
        totalProducts: 0,
        activeProducts: 0,
        archivedProducts: 0,
        avgPrice: 0,
      },
    });
  } catch (error) {
    console.error("Error generating product report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating product report",
      error: error.message,
    });
  }
};

const GetSellerReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Top sellers by product count
    const topSellers = await Product.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$seller",
          productCount: { $sum: 1 },
        },
      },
      { $sort: { productCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "sellers",
          localField: "_id",
          foreignField: "_id",
          as: "sellerInfo",
        },
      },
      { $unwind: "$sellerInfo" },
      {
        $project: {
          _id: 1,
          productCount: 1,
          name: "$sellerInfo.name",
          brandName: "$sellerInfo.brandName",
          email: "$sellerInfo.email",
        },
      },
    ]);

    // Seller stats
    const sellerStats = await Seller.aggregate([
      {
        $group: {
          _id: null,
          totalSellers: { $sum: 1 },
          activeSellers: { $sum: { $cond: ["$isActive", 1, 0] } },
          verifiedSellers: { $sum: { $cond: ["$isVerified", 1, 0] } },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Seller report generated successfully",
      data: {
        topSellers,
      },
      summary: sellerStats[0] || {
        totalSellers: 0,
        activeSellers: 0,
        verifiedSellers: 0,
      },
    });
  } catch (error) {
    console.error("Error generating seller report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating seller report",
      error: error.message,
    });
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export {
  // Dashboard
  GetDashboardStats,
  GetRecentActivity,

  // User Management (Original)
  GetAllUsers,
  GetUserByID,
  UpdateUserByID,
  DeleteUserByID,
  ToggleUserStatus,

  // Unified User Management (All Roles)
  GetAllRolesUsers,
  GetUserByIDUnified,
  CreateUserUnified,
  UpdateUserByIDUnified,
  ToggleUserStatusUnified,
  DeleteUserByIDUnified,

  // Seller Management
  GetAllSellers,
  GetSellerByID,
  UpdateSellerByID,
  DeleteSellerByID,
  ToggleSellerStatus,
  VerifySeller,

  // Product Management
  GetAllProducts,
  GetProductByID,
  CreateProduct,
  UpdateProductByID,
  DeleteProductByID,
  ToggleProductStatus,
  ApproveProduct,
  FeatureProduct,

  // Order Management
  GetAllOrders,
  GetOrderByID,
  UpdateOrderByID,
  UpdateOrderStatus,
  DeleteOrderByID,

  // Category Management
  GetAllCategories,
  GetCategoryByID,
  CreateCategory,
  UpdateCategoryByID,
  DeleteCategoryByID,

  // Banner Management
  GetAllBanners,
  GetBannerByID,
  CreateBanner,
  UpdateBannerByID,
  DeleteBannerByID,
  ToggleBannerStatus,

  // Reports & Analytics
  GetSalesReport,
  GetUserReport,
  GetProductReport,
  GetSellerReport,
};
