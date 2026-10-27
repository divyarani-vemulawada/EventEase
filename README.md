# EventEase — Event Registration & Management Platform

EventEase is a full-stack web application that makes it easy for users to discover events, register for them, and manage their registrations. It also provides an admin dashboard for managing event information.

## Features

### Attendee Features
- Browse and explore upcoming events.
- Search events by title, topic, or location.
- Filter events by category.
- View event details, dates, times, locations, and ticket prices.
- Create an account and log in securely.
- Register for events with duplicate-registration prevention.
- View personal event registrations.

### Admin Features
- Access an admin dashboard.
- Create new events.
- Update existing event information.
- Delete eligible events.
- Restrict event-management operations to authorized administrators.

### Additional Features
- Responsive user interface.
- Form validation and error messages.
- JWT-based authentication.
- Password hashing.
- PostgreSQL relational database.
- Event-capacity and registration checks.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JSON Web Tokens (JWT), bcrypt |
| API | REST API |
| Development Tools | Visual Studio Code, npm, Git, GitHub |

## Project Structure

```text
EventEase/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── admin.js
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   └── registrations.js
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   └── test-db.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js and npm
- PostgreSQL
- Git
- A code editor such as Visual Studio Code

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/divyarani-vemulawada/EventEase.git
cd EventEase
```

### 2. Configure the database

Create a PostgreSQL database named `eventease`.

Configure the database connection and authentication secrets using the environment variables documented in `backend/.env.example`.

Create your local environment file by copying the example:

**PowerShell:**

```powershell
Copy-Item backend/.env.example backend/.env
```

Update `backend/.env` with your own database credentials and a secure JWT secret. Never commit this file or publish real credentials.

Make sure the required database tables are created before starting the application.

### 3. Install and start the backend

Open a terminal in the project directory:

```bash
cd backend
npm install
```

Configure the environment variables, then start the backend using the available development script:

```bash
npm run dev
```

If your `package.json` does not define a development script, use the appropriate start command configured for your project.

### 4. Install and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, typically:

`http://localhost:5173`

Ensure the backend is running at the API URL configured in the frontend.

## API Endpoints

The application exposes the following API routes.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate a user |

### Events

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/events` | Retrieve events |
| GET | `/api/events/:id` | Retrieve an event by ID |
| POST | `/api/events` | Create an event — admin only |
| PUT | `/api/events/:id` | Update an event — admin only |
| DELETE | `/api/events/:id` | Delete an eligible event — admin only |

### Registrations

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/registrations/:eventId` | Register for an event |
| GET | `/api/registrations/my` | Retrieve the logged-in user's registrations |

Protected endpoints require a valid Bearer token in the `Authorization` header. Administrative endpoints additionally require admin privileges.

## Security

- Passwords are hashed before storage.
- JWTs are used to authenticate protected requests.
- Middleware verifies authentication and administrator permissions.
- Database queries use parameterized SQL.
- Duplicate event registrations are prevented.
- Event capacity is checked during registration.
- Environment files containing secrets are excluded from version control.

## Future Enhancements

- Online payment integration.
- Email confirmations and reminders.
- Event cancellation and waitlists.
- Event analytics and reporting.
- Deployment with a hosted PostgreSQL database.
- Automated testing and continuous integration.

## Author

**Divya Rani Vemulawada**

MCA Graduate | Aspiring Software Developer

GitHub: [divyarani-vemulawada](https://github.com/divyarani-vemulawada)

## License

This project was developed as a learning and internship project. A license can be added if the project is intended for public reuse.
