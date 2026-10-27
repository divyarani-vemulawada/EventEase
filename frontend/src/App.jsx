
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

const categories = [
  "All Events",
  "Technology",
  "Career",
  "Design",
  "Business",
  "Workshop",
  "Hackathon",
];

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Events");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");

  const [token, setToken] = useState(
    () => localStorage.getItem("eventease_token") || ""
  );
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("eventease_user")) || null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showMyRegistrations, setShowMyRegistrations] = useState(false);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");

  const isAdmin = user?.role === "admin";
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [editingEventId, setEditingEventId] = useState(null);
  const emptyAdminForm = {
    title: "",
    category: "Technology",
    date: "",
    time: "",
    location: "",
    price: "0",
    description: "",
    capacity: "50",
  };
  const [adminForm, setAdminForm] = useState(emptyAdminForm);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API}/events`);
        const data = await response.json();

        if (!response.ok || !data.success || !Array.isArray(data.events)) {
          throw new Error(data.message || "Unable to load events.");
        }

        setEvents(data.events);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(
          "Could not load events. Please make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  function getEventColor(eventCategory) {
    const colors = {
      Technology: "tech",
      Career: "career",
      Design: "design",
      Business: "business",
      Workshop: "tech",
      Hackathon: "career",
    };

    return colors[eventCategory] || "tech";
  }

  function getEventIcon(eventCategory) {
    const icons = {
      Technology: "💻",
      Career: "🚀",
      Design: "🎨",
      Business: "💡",
      Workshop: "🛠️",
      Hackathon: "🏆",
    };

    return icons[eventCategory] || "✨";
  }

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory =
        category === "All Events" || event.category === category;

      const searchableText = [
        event.title,
        event.description,
        event.location,
        event.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        search.toLowerCase().trim()
      );

      return matchesCategory && matchesSearch;
    });
  }, [events, search, category]);

  function showRegistration(event) {
    setSelectedEvent(event);
    setNotice("");
    setNoticeType("info");
  }

  function formatPrice(price) {
    return Number(price) === 0 ? "Free entry" : `₹${price}`;
  }

  function openAuth(mode = "login") {
    setAuthMode(mode);
    setAuthError("");
    setAuthMessage("");
    setAuthForm({ name: "", email: "", password: "" });
    setShowAuth(true);
  }

  function logout() {
    localStorage.removeItem("eventease_token");
    localStorage.removeItem("eventease_user");
    setToken("");
    setUser(null);
    setMyRegistrations([]);
    setShowAdminDashboard(false);
    setNotice("You have logged out successfully.");
    setNoticeType("success");
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "register" ? "register" : "login";

      const payload =
        authMode === "register"
          ? {
              name: authForm.name.trim(),
              email: authForm.email.trim(),
              password: authForm.password,
            }
          : {
              email: authForm.email.trim(),
              password: authForm.password,
            };

      const response = await fetch(`${API}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Authentication failed.");
      }

      // Registration creates an account; the user must then log in.
      if (authMode === "register") {
        setAuthMode("login");
        setAuthForm({
          name: "",
          email: payload.email,
          password: "",
        });
        setAuthMessage("Account created! Please log in.");
        return;
      }

      localStorage.setItem("eventease_token", data.token);
      localStorage.setItem("eventease_user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      setShowAuth(false);
      setAuthMessage("");

      if (selectedEvent) {
        await submitEventRegistration(selectedEvent, data.token);
      } else {
        setNotice(`Welcome, ${data.user.name}! You are logged in.`);
        setNoticeType("success");
      }
    } catch (err) {
      setAuthError(err.message || "Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function submitEventRegistration(event, accessToken) {
    setNotice("Registering you for this event...");
    setNoticeType("info");

    try {
      const response = await fetch(
        `${API}/registrations/${event.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Registration failed.");
      }

      setNotice(data.message || "You have successfully registered!");
      setNoticeType("success");
    } catch (err) {
      setNotice(err.message || "Unable to register for this event.");
      setNoticeType("error");
    }
  }

  function registerForEvent() {
    if (!selectedEvent) return;

    if (!token || !user) {
      openAuth("login");
      setAuthMessage("Please log in to register for this event.");
      return;
    }

    submitEventRegistration(selectedEvent, token);
  }

  async function fetchMyRegistrations() {
    if (!token) {
      openAuth("login");
      setAuthMessage("Please log in to view your registrations.");
      return;
    }

    setShowMyRegistrations(true);
    setRegistrationsLoading(true);
    setRegistrationError("");

    try {
      const response = await fetch(`${API}/registrations/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load registrations.");
      }

      setMyRegistrations(data.registrations || []);
    } catch (err) {
      setRegistrationError(err.message);
    } finally {
      setRegistrationsLoading(false);
    }
  }


  function dateForInput(value) {
    if (!value) return "";
    const text = String(value);
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(text)) return text;
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function startCreateEvent() {
    setEditingEventId(null);
    setAdminForm({ ...emptyAdminForm });
    setAdminError("");
    setAdminMessage("");
    setShowAdminDashboard(true);
    document.getElementById("admin-dashboard")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function startEditEvent(event) {
    setEditingEventId(event.id);
    setAdminForm({
      title: event.title || "",
      category: event.category || "Technology",
      date: dateForInput(event.date),
      time: String(event.time || "").slice(0, 5),
      location: event.location || "",
      price: String(event.price ?? 0),
      description: event.description || "",
      capacity: String(event.capacity ?? 50),
    });
    setAdminError("");
    setAdminMessage("");
    setShowAdminDashboard(true);
    document.getElementById("admin-dashboard")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function reloadEvents() {
    const response = await fetch(`${API}/events`);
    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.events)) {
      throw new Error(data.message || "Unable to refresh events.");
    }
    setEvents(data.events);
  }

  async function handleAdminSubmit(event) {
    event.preventDefault();
    setAdminError("");
    setAdminMessage("");

    if (!token || !isAdmin) {
      setAdminError("Please log in with an administrator account.");
      return;
    }

    const payload = {
      title: adminForm.title.trim(),
      category: adminForm.category,
      date: adminForm.date,
      time: adminForm.time,
      location: adminForm.location.trim(),
      price: Number(adminForm.price),
      description: adminForm.description.trim(),
      capacity: Number(adminForm.capacity),
    };

    if (
      !payload.title ||
      !payload.date ||
      !payload.time ||
      !payload.location ||
      !payload.description ||
      !Number.isFinite(payload.price) ||
      payload.price < 0 ||
      !Number.isInteger(payload.capacity) ||
      payload.capacity < 1
    ) {
      setAdminError("Please complete every field with valid price and capacity values.");
      return;
    }

    setAdminLoading(true);
    try {
      const isEditing = editingEventId !== null;
      const response = await fetch(
        isEditing
          ? `${API}/events/${editingEventId}`
          : `${API}/events`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save this event.");
      }

      await reloadEvents();
      setAdminMessage(
        data.message ||
          (isEditing ? "Event updated successfully." : "Event created successfully.")
      );
      setEditingEventId(null);
      setAdminForm({ ...emptyAdminForm });
    } catch (err) {
      setAdminError(err.message || "Unable to save this event.");
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleAdminDelete(event) {
    const confirmed = window.confirm(
      `Delete "${event.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setAdminError("");
    setAdminMessage("");
    setAdminLoading(true);
    try {
      const response = await fetch(`${API}/events/${event.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete this event.");
      }

      await reloadEvents();
      setAdminMessage(data.message || `"${event.title}" was deleted.`);
      if (editingEventId === event.id) {
        setEditingEventId(null);
        setAdminForm({ ...emptyAdminForm });
      }
    } catch (err) {
      setAdminError(err.message || "Unable to delete this event.");
    } finally {
      setAdminLoading(false);
    }
  }

  function closeAuth() {
    setShowAuth(false);
    setAuthError("");
    setAuthMessage("");
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <a className="brand" href="#home" aria-label="EventEase home">
          <span className="brand-icon">E</span>
          EventEase<span className="brand-dot">.</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#events">Explore Events</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-account">
          {user ? (
            <>
              <span className="welcome-user">
                Hi, {user.name.split(" ")[0]}
              </span>
              {isAdmin && (
                <button
                  type="button"
                  className="nav-account-button admin-nav-button"
                  onClick={() => {
                    setShowAdminDashboard((current) => !current);
                    setAdminError("");
                    setAdminMessage("");
                  }}
                >
                  {showAdminDashboard ? "Close Admin" : "Admin Dashboard"}
                </button>
              )}
              <button
                type="button"
                className="nav-account-button"
                onClick={fetchMyRegistrations}
              >
                My Registrations
              </button>
              <button
                type="button"
                className="nav-account-button"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="nav-account-button"
                onClick={() => openAuth("login")}
              >
                Login
              </button>
              <button
                type="button"
                className="nav-cta"
                onClick={() => openAuth("register")}
              >
                Sign up <span aria-hidden="true">↗</span>
              </button>
            </>
          )}
        </div>
      </header>

      {notice && !selectedEvent && (
        <div className={`global-notice ${noticeType}`} role="status">
          {notice}
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {showAdminDashboard && isAdmin && (
        <section className="admin-dashboard" id="admin-dashboard">
          <div className="admin-dashboard-heading">
            <div>
              <span className="section-kicker">EVENT MANAGEMENT</span>
              <h2>Admin Dashboard</h2>
              <p>Create events, update details, and manage the event list.</p>
            </div>
            <button
              type="button"
              className="hero-button admin-new-button"
              onClick={startCreateEvent}
              disabled={adminLoading}
            >
              + Create event
            </button>
          </div>

          {adminMessage && (
            <p className="admin-feedback success" role="status">
              {adminMessage}
            </p>
          )}
          {adminError && (
            <p className="admin-feedback error" role="alert">
              {adminError}
            </p>
          )}

          <div className="admin-content-grid">
            <form className="admin-event-form" onSubmit={handleAdminSubmit}>
              <h3>{editingEventId !== null ? "Edit event" : "Create a new event"}</h3>
              <p className="admin-form-hint">
                Fields marked with * are required.
              </p>

              <label>
                Event title *
                <input
                  type="text"
                  value={adminForm.title}
                  onChange={(e) => setAdminForm({ ...adminForm, title: e.target.value })}
                  maxLength={150}
                  placeholder="e.g. Full Stack Developer Meetup"
                  required
                />
              </label>

              <label>
                Category *
                <select
                  value={adminForm.category}
                  onChange={(e) => setAdminForm({ ...adminForm, category: e.target.value })}
                  required
                >
                  {categories.filter((item) => item !== "All Events").map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <div className="admin-form-row">
                <label>
                  Date *
                  <input
                    type="date"
                    value={adminForm.date}
                    onChange={(e) => setAdminForm({ ...adminForm, date: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Time *
                  <input
                    type="time"
                    value={adminForm.time}
                    onChange={(e) => setAdminForm({ ...adminForm, time: e.target.value })}
                    required
                  />
                </label>
              </div>

              <label>
                Location *
                <input
                  type="text"
                  value={adminForm.location}
                  onChange={(e) => setAdminForm({ ...adminForm, location: e.target.value })}
                  maxLength={200}
                  placeholder="e.g. Hyderabad or Online"
                  required
                />
              </label>

              <div className="admin-form-row">
                <label>
                  Price (₹) *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={adminForm.price}
                    onChange={(e) => setAdminForm({ ...adminForm, price: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Capacity *
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={adminForm.capacity}
                    onChange={(e) => setAdminForm({ ...adminForm, capacity: e.target.value })}
                    required
                  />
                </label>
              </div>

              <label>
                Description *
                <textarea
                  value={adminForm.description}
                  onChange={(e) => setAdminForm({ ...adminForm, description: e.target.value })}
                  rows="4"
                  maxLength={2000}
                  placeholder="What will attendees learn or experience?"
                  required
                />
              </label>

              <div className="admin-form-actions">
                <button type="submit" className="hero-button" disabled={adminLoading}>
                  {adminLoading
                    ? "Saving..."
                    : editingEventId !== null
                      ? "Save changes"
                      : "Create event"}
                </button>
                {editingEventId !== null && (
                  <button
                    type="button"
                    className="secondary-modal-button"
                    disabled={adminLoading}
                    onClick={() => {
                      setEditingEventId(null);
                      setAdminForm({ ...emptyAdminForm });
                      setAdminError("");
                      setAdminMessage("");
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            <div className="admin-event-list">
              <div className="admin-list-heading">
                <div>
                  <h3>Manage events</h3>
                  <p>{events.length} event{events.length === 1 ? "" : "s"} in the catalogue</p>
                </div>
              </div>
              {events.length === 0 ? (
                <div className="admin-empty">No events yet. Create your first event.</div>
              ) : (
                <div className="admin-managed-events">
                  {events.map((event) => (
                    <article className="admin-managed-event" key={event.id}>
                      <div className="admin-managed-event-info">
                        <span className="admin-event-category">{event.category}</span>
                        <h4>{event.title}</h4>
                        <p>{event.date} · {event.time}</p>
                        <p>{event.location} · {formatPrice(event.price)}</p>
                      </div>
                      <div className="admin-event-actions">
                        <button
                          type="button"
                          className="admin-edit-button"
                          onClick={() => startEditEvent(event)}
                          disabled={adminLoading}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-delete-button"
                          onClick={() => handleAdminDelete(event)}
                          disabled={adminLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">
              <span className="live-dot" />
              YOUR NEXT EXPERIENCE STARTS HERE
            </span>

            <h1>
              Discover events.
              <br />
              <span>Meet your people.</span>
            </h1>

            <p>
              Find inspiring workshops, technology events, and
              experiences that bring your next big idea to life.
            </p>

            <a className="hero-button" href="#events">
              Explore upcoming events <span aria-hidden="true">→</span>
            </a>

            <div className="hero-note">
              <span aria-hidden="true">✦</span> Learn something new.
              Make meaningful connections.
            </div>
          </div>

          <div className="hero-art" aria-label="Event community illustration">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />

            <div className="art-center">
              <span>✦</span>
              <strong>Ideas</strong>
              <strong>into action.</strong>
            </div>

            <div className="floating-card card-top">
              <span>💻</span>
              <div>
                <strong>Tech talks</strong>
                <small>Learn & build</small>
              </div>
            </div>

            <div className="floating-card card-bottom">
              <span>🤝</span>
              <div>
                <strong>Real connections</strong>
                <small>People who inspire</small>
              </div>
            </div>
          </div>
        </section>

        <section className="events-section" id="events">
          <div className="section-heading">
            <div>
              <span className="section-kicker">YOUR NEXT CHAPTER</span>
              <h2>Explore upcoming events</h2>
              <p>Find the right event to learn, connect, and grow.</p>
            </div>

            <span className="event-count">
              {loading ? "Loading..." : `${filteredEvents.length} events`}
            </span>
          </div>

          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search events, topics, or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search events"
            />
          </label>

          <div className="category-list" aria-label="Filter by category">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={`category-button ${
                  category === item ? "active" : ""
                }`}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>

          {loading && (
            <p role="status" className="loading-message">
              Loading events...
            </p>
          )}

          {!loading && error && (
            <div className="empty-state" role="alert">
              <h3>Unable to load events</h3>
              <p>{error}</p>
              <button
                type="button"
                className="category-button active"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="event-grid">
                {filteredEvents.map((event) => (
                  <article className="event-card" key={event.id}>
                    <div className={`event-art ${getEventColor(event.category)}`}>
                      <span className="event-category">{event.category}</span>
                      <span className="event-emoji" aria-hidden="true">
                        {getEventIcon(event.category)}
                      </span>
                      <span className="art-number">
                        EVENT / {String(event.id).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="event-info">
                      <div className="event-date">
                        <span aria-hidden="true">▦</span> {event.date}
                        <span className="date-divider">·</span> {event.time}
                      </div>

                      <h3>{event.title}</h3>
                      <p className="event-description">{event.description}</p>

                      <div className="event-location">
                        <span aria-hidden="true">⌖</span> {event.location}
                      </div>

                      <div className="event-card-footer">
                        <span className="seat-label">
                          {formatPrice(event.price)}
                        </span>
                        <button
                          type="button"
                          className="register-button"
                          onClick={() => showRegistration(event)}
                        >
                          View details <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {filteredEvents.length === 0 && (
                <div className="empty-state">
                  <span aria-hidden="true">⌕</span>
                  <h3>No events found</h3>
                  <p>Try a different search term or category.</p>
                  <button
                    type="button"
                    className="category-button active"
                    onClick={() => {
                      setSearch("");
                      setCategory("All Events");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="about-section" id="about">
          <span className="section-kicker">MADE FOR CURIOUS MINDS</span>
          <h2>Good things happen when people come together.</h2>
          <p>
            EventEase brings events and people together in one simple place.
            Discover your interests, build your skills, and find your community.
          </p>
          <a href="#events">Find your next event →</a>
        </section>
      </main>

      {selectedEvent && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedEvent(null)}
        >
          <section
            className="event-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedEvent(null)}
              aria-label="Close event details"
            >
              ×
            </button>

            <span className="section-kicker">{selectedEvent.category}</span>
            <h2 id="modal-title">{selectedEvent.title}</h2>
            <p>{selectedEvent.description}</p>

            <div className="modal-detail">
              <strong>Date & time</strong>
              <span>{selectedEvent.date} · {selectedEvent.time}</span>
            </div>

            <div className="modal-detail">
              <strong>Location</strong>
              <span>{selectedEvent.location}</span>
            </div>

            <div className="modal-detail">
              <strong>Ticket price</strong>
              <span>{formatPrice(selectedEvent.price)}</span>
            </div>

            {notice && (
              <p className={`notice ${noticeType}`} role="status">
                {notice}
              </p>
            )}

            <button
              type="button"
              className="hero-button modal-button"
              onClick={registerForEvent}
            >
              {user ? "Register for this event" : "Login to register"}
            </button>

            <button
              type="button"
              className="secondary-modal-button"
              onClick={() => setSelectedEvent(null)}
            >
              Back to events
            </button>
          </section>
        </div>
      )}

      {showAuth && (
        <div className="modal-backdrop" onClick={closeAuth}>
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeAuth}
              aria-label="Close authentication"
            >
              ×
            </button>

            <span className="section-kicker">WELCOME TO EVENTEASE</span>
            <h2 id="auth-title">
              {authMode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="auth-description">
              {authMode === "login"
                ? "Log in to register for events and manage your bookings."
                : "Join EventEase and discover your next experience."}
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={authMode === "login" ? "active" : ""}
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                  setAuthMessage("");
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === "register" ? "active" : ""}
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                  setAuthMessage("");
                }}
              >
                Sign up
              </button>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <label>
                  Full name
                  <input
                    type="text"
                    autoComplete="name"
                    value={authForm.name}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    minLength={1}
                    maxLength={100}
                    required
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  autoComplete={
                    authMode === "login" ? "current-password" : "new-password"
                  }
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, password: e.target.value })
                  }
                  placeholder={
                    authMode === "login"
                      ? "Enter your password"
                      : "At least 8 characters"
                  }
                  minLength={authMode === "register" ? 8 : undefined}
                  required
                />
              </label>

              {authMessage && (
                <p className="auth-message success" role="status">
                  {authMessage}
                </p>
              )}

              {authError && (
                <p className="auth-message error" role="alert">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="hero-button auth-submit"
                disabled={authLoading}
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Login to EventEase"
                    : "Create account"}
              </button>
            </form>
          </section>
        </div>
      )}

      {showMyRegistrations && (
        <div
          className="modal-backdrop"
          onClick={() => setShowMyRegistrations(false)}
        >
          <section
            className="registrations-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registrations-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowMyRegistrations(false)}
              aria-label="Close registrations"
            >
              ×
            </button>

            <span className="section-kicker">YOUR EVENT JOURNEY</span>
            <h2 id="registrations-title">My Registrations</h2>

            {registrationsLoading && <p>Loading your registrations...</p>}

            {registrationError && (
              <p className="auth-message error" role="alert">
                {registrationError}
              </p>
            )}

            {!registrationsLoading &&
              !registrationError &&
              myRegistrations.length === 0 && (
                <div className="empty-state">
                  <h3>No registrations yet</h3>
                  <p>Explore upcoming events and reserve your place.</p>
                  <button
                    type="button"
                    className="category-button active"
                    onClick={() => {
                      setShowMyRegistrations(false);
                      document
                        .getElementById("events")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Explore events
                  </button>
                </div>
              )}

            {!registrationsLoading &&
              myRegistrations.map((registration) => (
                <article
                  className="my-registration-card"
                  key={registration.registration_id}
                >
                  <div>
                    <h3>{registration.title}</h3>
                    <p>
                      {registration.date} · {registration.time}
                    </p>
                    <p>{registration.location}</p>
                    <span className="registration-status">
                      {registration.status}
                    </span>
                  </div>
                  <strong>{formatPrice(registration.price)}</strong>
                </article>
              ))}
          </section>
        </div>
      )}

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">E</span>
          EventEase<span className="brand-dot">.</span>
        </a>
        <p>Discover more. Experience more.</p>
        <span>© 2026 EventEase · Internship Project</span>
      </footer>
    </div>
  );
}

export default App;
