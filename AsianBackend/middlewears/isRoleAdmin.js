// middlewares/isRoleAdmin.js
export const isRoleAdmin = (req, res, next) => {
  try {
    const role = req.role;
    console.log("Role:", req.role);

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to access this route. Admin access required.",
      });
    }
    next();
  } catch (error) {
    console.log("Error in isRoleAdmin middleware:", error);
    res.status(500).json({
      message: "Error in authorization",
      success: false,
    });
  }
};

// Alternative: Combined role checker
export const isRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const role = req.role;
      console.log("User Role:", role, "| Allowed Roles:", allowedRoles);

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        });
      }
      next();
    } catch (error) {
      console.log("Error in role middleware:", error);
      res.status(500).json({
        message: "Error in authorization",
        success: false,
      });
    }
  };
};
export default isRoleAdmin;
