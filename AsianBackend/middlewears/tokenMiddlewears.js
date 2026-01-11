// middleware/tokenDecoder.js
import jwt from "jsonwebtoken";

const tokenDecoder = (req, res, next) => {
  try {
    let token = req.cookies.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized: No token provided",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    req.userId = decoded.userId;
    req.role = decoded.role;
    req.email = decoded.email;

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({
      message: "Unauthorized: Invalid or expired token",
      success: false,
    });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.role !== "admin") {
    return res.status(403).json({
      message: "Access denied: Admin only",
      success: false,
    });
  }
  next();
};

const authorizeSeller = (req, res, next) => {
  if (req.role !== "seller") {
    return res.status(403).json({
      message: "Access denied: Seller only",
      success: false,
    });
  }
  next();
};

const authorizeUser = (req, res, next) => {
  if (req.role !== "user") {
    return res.status(403).json({
      message: "Access denied: User only",
      success: false,
    });
  }
  next();
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({
        message: `Access denied: ${allowedRoles.join(" or ")} only`,
        success: false,
      });
    }
    next();
  };
};

export default tokenDecoder;

export {
  tokenDecoder,
  authorizeAdmin,
  authorizeSeller,
  authorizeUser,
  authorizeRoles,
};
