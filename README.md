# LifeSaver AI OS

A full-stack, multi-agent productivity dashboard that helps coordinate task execution, schedule deep-work blocks, and balance cognitive load. Powered by Google Gemini and Express, it acts as an intelligent operating system to streamline commitments, track habits, and proactively mitigate academic and professional burnout.

---

## Features

- **Authentication & Secure Sessions**: JWT-secured login, registration, and session verification.
- **Multi-Agent OS Engine**: Simulates specialized cognitive agents (Learning, Focus, Recovery, Chronos) working in parallel to plan schedules, predict burnout risk, and output diagnostic terminal logs.
- **Voice Assistant**: Hands-free voice commands using the Web Speech API with text-to-speech synthesized replies.
- **Productivity Twin & Simulator**: Interactive conversational chatbot terminal to converse with a simulated future self.
- **Extension Negotiator**: Creates communication templates and draft emails for requesting project or deadline extensions.
- **Cramming & Milestone Planner**: Generates target-oriented academic revision grids and timelines based on subject inputs.
- **Unified Calendar & Scheduling**: Custom calendar interface to map deep-work blocks, tasks, and scheduling intervals.
- **Strategic Goal & Habit Tracker**: Define custom goals, track progression statistics, and log daily habit loops.
- **Real-Time Analytics Dashboard**: Real-time gauges for completion rates, goals, streaks, and integrated burnout indices.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS (v4), Framer Motion, Lucide React
- **Backend**: Express.js (Node.js runtime)
- **Database**: Dual-persistence layer via MongoDB (Mongoose) with an automatic local transactional JSON database fallback.
- **AI SDK**: Official Google Gen AI SDK (`@google/genai`) utilizing the `gemini-3.5-flash` model.
- **Bundling & Build Tools**: Vite (frontend assets), `esbuild` (backend bundling), `tsx` (TypeScript dev runner).

---

## Project Structure

```
.
├── index.html                   # SPA Entry point
├── package.json                 # Project scripts and dependencies
├── server.ts                    # Express server entry point
├── vite.config.ts               # Vite configuration
├── server/                      # Production Backend Architecture
│   ├── config/db.ts             # Database configuration (MongoDB / JSON fallback)
│   ├── controllers/             # Controllers handling authentication, tasks, and AI operations
│   ├── middlewares/             # Security middleware (JWT validation)
│   ├── models/                  # Database schemas
│   ├── repositories/            # Data storage adapters (MongoDB & local JSON engine)
│   ├── routes/api.ts            # Centralized API routing definition
│   └── utils/jsonDb.ts          # Resilient transactional local JSON file database
└── src/                         # Production React Frontend
    ├── App.tsx                  # Master state machine and main interface
    ├── main.tsx                 # Client bootstrap script
    ├── index.css                # Global styles, Tailwind classes, and theme variables
    ├── types.ts                 # Master TypeScript interfaces and definitions
    └── components/              # Interactive modules (Calendar, Goal, Voice, Agent Terminal, etc.)
```

---

## Installation

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment secrets**:
   Create a `.env` file in the root directory and populate the required variables listed below.

---

## Environment Variables

Configure the following variables in a `.env` file at the project root (see `.env.example` for reference):

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | **Yes** | API key to authenticate server-side calls to Google Gemini |
| `JWT_SECRET` | **Yes** | Secret cryptographic key used to sign and verify JSON Web Tokens |
| `MONGODB_URI` | No | Connection string for MongoDB (falls back to local JSON database if empty) |

---

## Available Scripts

- `npm run dev`: Starts the backend Express server with dynamic Vite dev middleware on port 3000.
- `npm run build`: Bundles the React assets via Vite and packages the TypeScript server to `dist/server.cjs` via esbuild.
- `npm run start`: Launches the compiled Node production bundle inside `dist/server.cjs`.
- `npm run lint`: Validates TypeScript syntax and rules across the project.
- `npm run clean`: Clears distribution and temporary build directories.

---

## API Documentation

All routes except authentication portals require a valid `Authorization: Bearer <JWT>` header.

### Authentication
- `POST /api/auth/register` - Register a new account
- `POST /api/auth/login` - Authenticate credentials and return a JWT
- `POST /api/auth/logout` - Invalidate the active session
- `POST /api/auth/forgot-password` - Trigger password recovery email flow
- `POST /api/auth/reset-password` - Update password with a reset token
- `GET /api/auth/me` - Retrieve authenticated user profile metadata

### Tasks & Core CRUD
- `GET /api/tasks` | `POST /api/tasks` - Retrieve or create commitments
- `PUT /api/tasks/:id` | `DELETE /api/tasks/:id` - Update status or delete a task
- `GET /api/goals` | `POST /api/goals` - Fetch or create strategic goals
- `PUT /api/goals/:id` | `DELETE /api/goals/:id` - Manage goal milestones
- `GET /api/habits` | `POST /api/habits` - Retrieve or establish habits
- `PUT /api/habits/:id` | `DELETE /api/habits/:id` - Log daily habit completions and streaks
- `GET /api/calendar` | `POST /api/calendar` - Fetch or create scheduled calendar blocks
- `PUT /api/calendar/:id` | `DELETE /api/calendar/:id` - Manage calendar events

### Notifications
- `GET /api/notifications` - Retrieve alerts and notifications
- `POST /api/notifications` - Dispatches system alerts
- `PUT /api/notifications/:id/read` - Mark a specific alert as read
- `DELETE /api/notifications/:id` - Dismiss an alert

### AI Operations
- `POST /api/ai/process` - Run Multi-Agent evaluation and plan schedules
- `POST /api/ai/negotiate` - Draft extension templates using the Negotiator Agent
- `POST /api/ai/twin-chat` - Send and receive messages with the Future Self twin
- `POST /api/ai/prepare` - Compute exam preparation timelines and outlines
- `GET /api/ai/chat-logs` - Retrieve the messaging history of the Productivity Twin
- `GET /api/ai/agent-logs` - Query structured multi-agent operation logs

### System Operations & Analytics
- `GET /api/settings` | `PUT /api/settings` - Retrieve or update configuration parameters
- `PUT /api/profile` - Modify authenticated user settings
- `GET /api/analytics/dashboard` - Fetch aggregated completion rate, goal, habit, and calendar metrics

---

## Screenshots

> Screenshots will be added soon.

---

## Deployment

The application is fully optimized for containerized environments (e.g., Google Cloud Run) and serverless hosting. In production:
- The Express server binds to host `0.0.0.0` and port `3000`.
- All static React frontend assets are precompiled into the `dist/` directory and served directly by the backend Express layer.

---

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/name`).
3. Commit your changes (`git commit -m "feat: add feature details"`).
4. Push to the branch (`git push origin feature/name`).
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License.

---

## Author

Created by the AI Coding Assistant and the LifeSaver Team.
