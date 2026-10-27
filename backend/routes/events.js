
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");

// Validate event data received from the frontend.
function validateEvent(body) {
  const {
    title,
    category,
    date,
    time,
    location,
    price,
    description,
    capacity,
  } = body;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof category !== "string" ||
    !category.trim() ||
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof time !== "string" ||
    !/^\d{2}:\d{2}(:\d{2})?$/.test(time) ||
    typeof location !== "string" ||
    !location.trim() ||
    typeof description !== "string" ||
    price === undefined ||
    price === null ||
    price === "" ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0 ||
    capacity === undefined ||
    capacity === null ||
    capacity === "" ||
    !Number.isInteger(Number(capacity)) ||
    Number(capacity) < 1
  ) {
    return "Please provide valid event details, including date, time, price, and capacity.";
  }

  // Check that the date is a real calendar date.
  const parsedDate = new Date(`${date}T00:00:00Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    return "Please provide a valid event date.";
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (hours > 23 || minutes > 59) {
    return "Please provide a valid event time.";
  }

  return null;
}

// GET all events (public)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        category,
        TO_CHAR(event_date, 'YYYY-MM-DD') AS date,
        event_time AS time,
        location,
        price,
        description,
        capacity
      FROM events
      ORDER BY event_date ASC, id ASC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      events: result.rows,
    });
  } catch (error) {
    console.error("Fetch events error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch events",
    });
  }
});

// GET one event by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        title,
        category,
        TO_CHAR(event_date, 'YYYY-MM-DD') AS date,
        event_time AS time,
        location,
        price,
        description,
        capacity
       FROM events
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Fetch event error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch event",
    });
  }
});

// CREATE event (admin only)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validationError = validateEvent(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const {
      title,
      category,
      date,
      time,
      location,
      price,
      description,
      capacity,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO events
        (title, category, event_date, event_time, location,
         price, description, capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING
         id, title, category,
         TO_CHAR(event_date, 'YYYY-MM-DD') AS date,
         event_time AS time, location, price, description, capacity`,
      [
        title.trim(),
        category.trim(),
        date,
        time,
        location.trim(),
        Number(price),
        description.trim(),
        Number(capacity),
      ]
    );

    res.status(201).json({
      success: true,
      message: "Event created successfully.",
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Create event error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to create event.",
    });
  }
});

// UPDATE event (admin only)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid event ID.",
        });
      }

      const validationError = validateEvent(req.body);

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const {
        title,
        category,
        date,
        time,
        location,
        price,
        description,
        capacity,
      } = req.body;

      const result = await pool.query(
        `UPDATE events
         SET title = $1,
             category = $2,
             event_date = $3,
             event_time = $4,
             location = $5,
             price = $6,
             description = $7,
             capacity = $8
         WHERE id = $9
         RETURNING
           id, title, category,
           TO_CHAR(event_date, 'YYYY-MM-DD') AS date,
           event_time AS time, location, price, description, capacity`,
        [
          title.trim(),
          category.trim(),
          date,
          time,
          location.trim(),
          Number(price),
          description.trim(),
          Number(capacity),
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Event not found.",
        });
      }

      res.json({
        success: true,
        message: "Event updated successfully.",
        event: result.rows[0],
      });
    } catch (error) {
      console.error("Update event error:", error.message);
      res.status(500).json({
        success: false,
        message: "Unable to update event.",
      });
    }
  }
);

// DELETE event (admin only)
// Refuse deletion if attendee registrations exist.
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { id } = req.params;

      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid event ID.",
        });
      }

      await client.query("BEGIN");

      const eventResult = await client.query(
        "SELECT id FROM events WHERE id = $1 FOR UPDATE",
        [id]
      );

      if (eventResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Event not found.",
        });
      }

      const registrationResult = await client.query(
        `SELECT id FROM registrations
         WHERE event_id = $1
         LIMIT 1`,
        [id]
      );

      if (registrationResult.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message:
            "This event has registrations and cannot be deleted. Consider cancelling the event instead.",
        });
      }

      await client.query("DELETE FROM events WHERE id = $1", [id]);
      await client.query("COMMIT");

      res.json({
        success: true,
        message: "Event deleted successfully.",
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});

      console.error("Delete event error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to delete event.",
      });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
