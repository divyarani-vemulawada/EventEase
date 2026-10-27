
const express = require("express");
const pool = require("../config/db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Register the logged-in user for an event
router.post("/:eventId", authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  if (!/^\d+$/.test(eventId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid event ID.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const eventResult = await client.query(
      `SELECT id, title, capacity
       FROM events
       WHERE id = $1
       FOR UPDATE`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const event = eventResult.rows[0];

    const existing = await client.query(
      `SELECT id FROM registrations
       WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "You have already registered for this event.",
      });
    }

    const countResult = await client.query(
      `SELECT COUNT(*)::int AS total
       FROM registrations
       WHERE event_id = $1 AND status = 'confirmed'`,
      [eventId]
    );

    if (countResult.rows[0].total >= event.capacity) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Sorry, this event has reached its capacity.",
      });
    }

    const result = await client.query(
      `INSERT INTO registrations (user_id, event_id)
       VALUES ($1, $2)
       RETURNING id, user_id, event_id, registered_at, status`,
      [userId, eventId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "You have successfully registered for the event!",
      registration: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "You have already registered for this event.",
      });
    }

    console.error("Registration error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to register for this event.",
    });
  } finally {
    client.release();
  }
});

// View the logged-in user's registrations
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id AS registration_id, r.registered_at, r.status,
              e.id AS event_id, e.title, e.category,
              e.event_date AS date, e.event_time AS time,
              e.location, e.price
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.user_id = $1
       ORDER BY r.registered_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      registrations: result.rows,
    });
  } catch (error) {
    console.error("My registrations error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch your registrations.",
    });
  }
});

module.exports = router;
