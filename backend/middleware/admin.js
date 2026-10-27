
const pool = require("../config/db");

async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue.",
      });
    }

    // Always check the user's current role in PostgreSQL.
    const result = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (result.rows[0].role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    req.user.role = result.rows[0].role;
    next();
  } catch (error) {
    console.error("Admin authorization error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin permissions.",
    });
  }
}

module.exports = requireAdmin;
