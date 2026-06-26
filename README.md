# 🧬 LifeSaver AI OS

[![React](https://img.shields.io/badge/Frontend-React%2018%2B-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Build%20System-Vite%205-bd34fe?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Express%204-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/AI-Google%20Gemini-4285f4?style=flat-square&logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> **LifeSaver AI OS** is a premium, full-stack, autonomous productivity companion. It acts as an interactive, multi-agent command center designed to optimize timelines, predict cognitive burnout, rescue failing academic or business milestones, and synchronize personal schedules in real time using Google Gemini and a secure Node.js backend.

---

## 📌 Table of Contents

1. [Core Objectives & Problem Solved](#-core-objectives--problem-solved)
2. [Master Feature Matrix](#-master-feature-matrix)
3. [Tech Stack](#-tech-stack)
4. [System Architecture](#-system-architecture)
5. [Directory Tree & Codebase Layout](#-directory-tree--codebase-layout)
6. [Installation & Local Setup](#-installation--local-setup)
7. [Environment Configuration Reference](#-environment-configuration-reference)
8. [Comprehensive API Documentation](#-comprehensive-api-documentation)
9. [Database Schema Specifications](#-database-schema-specifications)
10. [Application Operational Workflow](#-application-operational-workflow)
11. [Screenshots & Visuals](#-screenshots--visuals)
12. [Future Roadmap & Enhancements](#-future-roadmap--enhancements)
13. [Contributing Guidelines](#-contributing-guidelines)
14. [License](#-license)
15. [Author](#-author)

---

## 🎯 Core Objectives & Problem Solved

Traditional task managers and calendar systems are passive. They require constant manual entry and do not account for human cognitive limits, leading to task hoarding, study-cramming, and eventual burnout. 

**LifeSaver AI OS** solves these structural productivity bottlenecks by:
- **Proactive Interventions**: Detecting upcoming bottlenecks, predicting success margins, and suggesting structural rescheduling *before* failure occurs.
- **Cognitive Protection**: Quantifying and visualizing burnout risks based on density of high-urgency tasks.
- **Collaborative Agent Orchestration**: Dispatching **10 specialized AI Agents** (such as the *Priority Agent*, *Focus Agent*, *Negotiation Agent*, and *Twin Agent*) that cross-reference schedules, write actions to the database, and log logical reasoning paths.
- **Simulating Real-World Remediation**: Assisting users in draft negotiations for project deadline extensions and generating active recall-based cramming mitigation plans.

---

## ✨ Master Feature Matrix

- **👤 Secure Auth Portal**: Standard registration, session-secured login with JWT, automatic token expiration checks, and full password-reset mechanics.
- **🧠 Collaborative Multi-Agent OS Engine**: Orchestrates a panel of 10 specialized virtual agents to align schedules, logs detailed terminal reports, and dynamically predicts failure margins.
- **🎤 AI Voice Assistant (Hands-Free Integration)**: Full speech-to-text recognition (Web Speech API) and natural voice synthesis (Text-to-Speech) to add commitments, list deadlines, and trigger neural syncs hands-free, including a robust fallback text-input console.
- **👥 Productivity Twin & Future Self Simulator**: An interactive chat terminal with your "Future Self" speaking from a timeline where you solved your priorities, generating immediate, actionable micro-tasks.
- **📬 AI Extension Negotiator**: Drafts highly persuasive emails and messaging templates tailored to specific recipients and tones to secure project extensions when schedules get congested.
- **📚 Academic Cramming & Interview Prep Generator**: Creates time-phased preparation guides featuring active recall methods, high-yield topic mappings, and personalized cognitive relaxation advice.
- **📅 Interactive Unified Calendar**: An interactive grid system displaying tasks, events, and milestones mapped out across hourly timelines.
- **🎯 Strategic Goal Engine**: Lets users define broad operational milestones, track multi-tier progress, and link tasks to strategic outcomes.
- **⏳ Habit Consistency Matrix**: Tracks recurring behavior loops with streak multipliers to build long-term retention.
- **📊 Real-Time Analytics Dashboard**: Aggregates completion rates, goal achievements, active calendar items, and burnout statistics dynamically.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 (with Vite)
- **Language**: TypeScript (Strict Typings)
- **Styling**: Tailwind CSS (with utility classes)
- **Animations**: Framer Motion (smooth transition physics)
- **Iconography**: Lucide React (vector-based)

### Backend
- **Server Framework**: Express.js
- **Runtime Environment**: Node.js
- **Compilation/Bundling**: `tsx` (Dev compilation) & `esbuild` (Production bundle compiling to standalone `.cjs`)

### Database & Security
- **Primary Database**: MongoDB (Mongoose Schema Architecture)
- **Fallback Engine**: Transaction-safe JSON database with atomic file-write fallbacks for zero-setup offline capability
- **Authentication**: JWT (JSON Web Tokens) with Secure Cookie / Authorization headers

### Artificial Intelligence
- **SDK**: `@google/genai` (Official modern Google AI SDK)
- **LLM Core**: `gemini-3.5-flash` (Primary fast response), `gemini-3.1-flash-lite` (Fallback processing)

---

## 📐 System Architecture

The following block-flow diagram demonstrates how data and actions propagate across the layers of the LifeSaver AI OS architecture:

```
+--------------------------------------------------------------------------+
|                              REACT FRONTEND                              |
|   (Interactive Calendar, Auth Forms, Voice Core, Twin Chat, Dashboards)  |
+--------------------------------------------------------------------------+
                                     │ (REST API Fetch Requests / JWT)
                                     ▼
+--------------------------------------------------------------------------+
|                             EXPRESS BACKEND                              |
|        (Router, Auth Middleware, Controllers, Database Repositories)     |
+--------------------------------------------------------------------------+
                  │                                        │
                  ▼                                        ▼
+-----------------------------------+    +---------------------------------+
|          AI OPERATIONS            |    |       DATABASE REPOSITORIES     |
|   (Google GenAI SDK Integration)  |    |  (Dual persistence controller)  |
+-----------------------------------+    +---------------------------------+
                  │                                        │
                  ▼                                        ▼
+-----------------------------------+    +---------------------------------+
|         GEMINI API CLOUD          |    |     MongoDB Cloud / JSON fallback|
| (gemini-3.5-flash reasoning engine)|   |  (Local persistent schemas)     |
+-----------------------------------+    +---------------------------------+
```

---

## 📂 Directory Tree & Codebase Layout

```
.
├── .env.example                # Template for server & third-party secrets
├── .gitignore                  # Exclusion file for node_modules and builds
├── index.html                  # Core HTML file
├── metadata.json               # Sandbox workspace permissions and attributes
├── package.json                # Project dependencies and script declarations
├── server.ts                   # Main server entry point (Boots Express & Vite dev servers)
├── tsconfig.json               # TypeScript compiler rules
├── vite.config.ts              # Vite bundling parameters
│
├── server/                     # Backend Source Code
│   ├── config/
│   │   └── db.ts               # Dual-persistence database connection manager
│   ├── controllers/
│   │   ├── aiController.ts     # Handles multi-agent processing, twin chat, prep, negotiator
│   │   ├── authController.ts   # Secure register, login, profile management
│   │   ├── calendarController.ts # Full CRUD events controller
│   │   ├── goalController.ts   # Strategic goals operational controller
│   │   ├── habitController.ts  # Habit matrix tracking logic
│   │   ├── notificationController.ts # CRUD for user system warnings
│   │   └── settingsController.ts # Handles application metadata configuration
│   ├── middlewares/
│   │   └── authMiddleware.ts   # JSON Web Token verification & security guard
│   ├── models/
│   │   ├── AIConversation.ts   # Future Twin persistent chat history Schema
│   │   ├── AgentLog.ts         # Multi-agent cooperation records
│   │   └── ...                 # Goal, Habit, Task, Event, User Schemas
│   ├── repositories/
│   │   └── baseRepository.ts   # Bridge executing MongoDB commands or JSON DB fallbacks
│   └── utils/
│       └── jsonDb.ts           # Ultra-resilient local JSON file-database transactional layer
│
└── src/                        # Frontend React Codebase
    ├── App.tsx                 # Core layout controller and master state-machine
    ├── main.tsx                # Client entry hook
    ├── index.css               # Global Tailwind CSS and typography declarations
    ├── types.ts                # Master TypeScript interface definitions
    └── components/
        ├── AICoreCanvas.tsx    # Live canvas network animation backdrop
        ├── AgentLogsTerminal.tsx # Visual retro terminal displaying collaborative operations
        ├── AuthScreen.tsx      # Secure Login, Register, and Account Recovery wizard
        ├── CalendarModule.tsx  # Dynamic interactive scheduling interface
        ├── GoalTracker.tsx     # Strategic Objective and progression dashboard
        ├── HabitTracker.tsx    # Behavioral matrix calendar logging streaks
        ├── SettingsPanel.tsx   # Personalized config, weights, and voice defaults
        └── VoiceAssistant.tsx  # Hands-free mic interaction & natural speaker engine
```

---

## 🚀 Installation & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or higher)
- [npm](https://www.npmjs.com/) (bundled with Node.js)

### Step 1: Clone and Enter the Directory
```bash
git clone <your-repository-url>
cd lifesaver-ai-os
```

### Step 2: Install Project Dependencies
Run npm install at the root to set up both frontend bundlers and backend servers:
```bash
npm install
```

### Step 3: Set Up Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Open `.env` and configure your keys (see [Environment Configuration Reference](#-environment-configuration-reference) below).

### Step 4: Run in Development Mode
Start the full-stack development environment:
```bash
npm run dev
```
The server will boot, and Vite will run automatically, proxying front-end assets directly. Open `http://localhost:3000` in your web browser.

### Step 5: Build for Production
To bundle the frontend assets and compile the server code into a single high-performance production CJS bundle:
```bash
npm run build
```
Start the compiled production bundle:
```bash
npm start
```

---

## 🔑 Environment Configuration Reference

The application requires specific environment parameters for database storage and artificial intelligence APIs. Use the table below as a setup guide:

| Variable | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | `3000` | The primary port handled by the reverse proxy and server routing. |
| `JWT_SECRET` | Yes | `lifesaver_secret_key_8842` | Cryptographic secret used to sign and decode user tokens. |
| `GEMINI_API_KEY` | Yes | *None (Requires user key)* | Secret Google Gemini API key to run model inference server-side. |
| `MONGODB_URI` | No | *None (Seamless JSON fallback)* | Optional connection string to a remote MongoDB Atlas or Local cluster. |

---

## 📑 Comprehensive API Documentation

Every endpoint in LifeSaver AI OS is fully protected by a JSON Web Token middleware except public authentication paths.

### 🔐 Authentication

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Create a new user profile with cryptographically hashed passwords. | No |
| `POST` | `/api/auth/login` | Validate user credentials and return a secure JWT access token. | No |
| `POST` | `/api/auth/logout` | Revoke local session parameters and clear state. | Yes |
| `POST` | `/api/auth/forgot-password` | Initiate a password recovery request. | No |
| `POST` | `/api/auth/reset-password` | Finalize password override with recovery tokens. | No |
| `GET` | `/api/auth/me` | Fetch active profile metadata of the current authenticated user. | Yes |

### 📋 Core User Commitments (Tasks, Goals, Habits, Events)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/tasks` | Retrieve all pending and completed commitments for the user. | Yes |
| `POST` | `/api/tasks` | Create a new task with assigned urgency and deadlines. | Yes |
| `PUT` | `/api/tasks/:id` | Update status parameters, titles, or urgencies of a task. | Yes |
| `DELETE` | `/api/tasks/:id` | Erase a specific task from database records. | Yes |
| `GET` | `/api/goals` | Fetch all strategic objectives and active milestone paths. | Yes |
| `POST` | `/api/goals` | Register a new high-level life or operational goal. | Yes |
| `GET` | `/api/habits` | Retrieve user habits and active daily streak parameters. | Yes |
| `POST` | `/api/habits` | Register a new habit tracking loop. | Yes |
| `GET` | `/api/calendar` | Fetch all scheduled calendar events and academic blocks. | Yes |

### 🧠 Intelligent Autonomous Operations

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/ai/process` | Feed task lists and situations to the 10-Agent Collaborative Engine. | Yes |
| `POST` | `/api/ai/negotiate` | Request Negotiation Assistant to draft extension emails/letters. | Yes |
| `POST` | `/api/ai/twin-chat` | Chat with the "Future Self" Productivity Twin simulator. | Yes |
| `POST` | `/api/ai/prepare` | Generate high-yield study timelines for exams or milestones. | Yes |
| `GET` | `/api/ai/chat-logs` | Fetch user conversation history with the Twin Agent. | Yes |
| `GET` | `/api/ai/agent-logs` | Pull structural logical steps logged by the cooperating Agents. | Yes |

---

## 💾 Database Schema Specifications

### User Schema (`User.ts`)
- `email`: `String` (Unique, index) — Primary identifier
- `password`: `String` — Cryptographically salted hash
- `name`: `String` — Human identifier
- `avatar`: `String` — Theme visual parameters

### Task Schema (`Task.ts`)
- `userId`: `String` (Indexed) — Associated account holder
- `title`: `String` — Descriptive action name
- `dueDate`: `String` — Target milestone date
- `urgency`: `low | medium | high | critical` — Urgency severity
- `status`: `pending | completed` — Completion flag

### AI Conversation Schema (`AIConversation.ts`)
- `userId`: `String` (Unique, indexed) — Associated account owner
- `messages`: `Array` of:
  - `role`: `user | assistant`
  - `content`: `String`
  - `microAction`: `String` (Optional short micro-step generated by the Twin)
  - `timestamp`: `String`

---

## 🔄 Application Operational Workflow

1. **Authentication Guard**: On boot, the user lands on a secure authentication screen. After logging in or signing up, a JWT is securely stored in `localStorage`, authorizing further CRUD requests.
2. **Dashboard Overview & Sync**: The master dashboard summarizes tasks, active habits, and active goals. The user writes down their current situation and hits "Trigger Alignment".
3. **Multi-Agent Evaluation**:
   - The frontend forwards the situation and current task dictionary to `/api/ai/process`.
   - The server triggers the **Google Gemini Core** with strict structural instructions.
   - The model analyzes dependencies, assigns failure predictions, estimates burnout risks, and details logs representing debates among the **10 specialized virtual agents**.
4. **Remediation**:
   - If task urgency is critical, **Rescue Mode** goes active, signaling visual warning alerts.
   - The user opens the **AI Extension Negotiator** to draft a highly tailored request for a delay, or the **Exam Prep** engine to schedule active-recall study phases.
5. **Interactive Execution**: The user schedules deep-work events on the **Calendar Module**, tracks habit retention in the **Habit Matrix**, and completes items to watch completion graphs dynamically rise.

---

## 📷 Screenshots & Visuals

> ⚠️ **Developer Note on Screenshots**:
> 
> Because this codebase runs inside a sandboxed cloud container with strict virtual buffer constraints and lacks an interactive desktop display or standard system GPU drivers for headless Puppeteer/Playwright browsers, pixel-perfect physical screenshot files are not automatically written directly to disk. 
> 
> To visually inspect the stunning interface of LifeSaver AI OS, please open the development portal in a browser frame:
> - **Live Shared Preview**: [LifeSaver AI OS Shared Environment](https://ais-pre-ubwrdqw6y656d2w4kttylc-319694471469.asia-east1.run.app)
> - **Local Preview**: `http://localhost:3000` once launched locally on your development machine.

### Core Portal Previews
- **Portal Entry & Auth (390px / 1440px)**: A deep-indigo glass-pane panel supporting seamless login, registration, and automatic credentials recovery with high-contrast inputs.
- **Mission Dashboard**: Displays live burnout stats, failure likelihood percentages, active coach advice widgets, and staggered animated agent debate logs.
- **AI Voice Console**: Centered around a pulsated, glowing microphone trigger allowing real-time command input with full visual waveform animation loops.

---

## 🔮 Future Roadmap & Enhancements

- [ ] **Dual-Channel Audio Websockets**: Implement real-time voice streaming to allow continuous conversation with the Productivity Twin without pressing standard mic buttons.
- [ ] **Google Workspace Calendar OAuth Synchronization**: Establish direct bidirectional synchronization with Google Calendar via secure OAuth flow to auto-write study blocks to Google Accounts.
- [ ] **Advanced Vector Embeddings**: Store past user actions and chat history inside a lightweight vector database to customize AI Coach advices based on historical behavior patterns.

---

## 🤝 Contributing Guidelines

Contributions are highly valued! To contribute:
1. Fork the repository on GitHub.
2. Create a clean feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes with meaningful messages: `git commit -m "feat: add secure real-time notification alerts"`
4. Push your branch: `git push origin feature/amazing-feature`
5. Open a professional Pull Request detailing the changes.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

Developed with care by **LifeSaver AI Operations Core** & the Google AI Studio Development Team. Feel free to contact us at `shivanifs.1786145@gmail.com` for active collaborations.
