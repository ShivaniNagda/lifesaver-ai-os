# LifeSaver AI Assistant — Project Submission Documentation

---

## 1. COVER PAGE

| Metadata | Project Details |
| :--- | :--- |
| **Project Name** | LifeSaver AI Assistant |
| **Tagline** | AI-powered productivity companion that helps users plan tasks, manage deadlines, and stay organized. |
| **Version** | 1.0.0 |
| **Developer** | Shivani Nagda |
| **GitHub Repository** | [https://github.com/ShivaniNagda/lifesaver-ai-os](https://github.com/ShivaniNagda/lifesaver-ai-os) |
| **Live Demo** | [https://ais-pre-ubwrdqw6y656d2w4kttylc-319694471469.asia-east1.run.app](https://ais-pre-ubwrdqw6y656d2w4kttylc-319694471469.asia-east1.run.app) |
| **Swagger API URL** | [https://ais-pre-ubwrdqw6y656d2w4kttylc-319694471469.asia-east1.run.app/api-docs](https://ais-pre-ubwrdqw6y656d2w4kttylc-319694471469.asia-east1.run.app/api-docs) |
| **Portfolio** | [https://ShivaniNagda.vercel.app](https://ShivaniNagda.vercel.app) |
| **LinkedIn** | [https://www.linkedin.com/in/shivaninagda](https://www.linkedin.com/in/shivaninagda) |
| **Submission Date** | June 29, 2026 |

---

## TABLE OF CONTENTS

1. [Executive Summary](#2-executive-summary)
2. [Project Overview](#3-project-overview)
3. [Technology Stack](#4-technology-stack)
4. [System Architecture](#5-system-architecture)
5. [Core Features](#6-core-features)
6. [AI Features & Capabilities](#7-ai-features--capabilities)
7. [User Workflow](#8-user-workflow)
8. [Database Design](#9-database-design)
9. [API Documentation](#10-api-documentation)
10. [Security Audits](#11-security-audits)
11. [UI Screen Visual Maps](#12-ui-screen-visual-maps)
12. [Installation Guide](#13-installation-guide)
13. [Deployment Protocols](#14-deployment-protocols)
14. [Testing Suite](#15-testing-suite)
15. [Challenges & Solutions](#16-challenges--solutions)
16. [Future Scope](#17-future-scope)
17. [Project Statistics](#18-project-statistics)
18. [Final Verification Checklist](#19-final-verification-checklist)
19. [Submission Status](#20-submission-status)

---

## 2. EXECUTIVE SUMMARY

### Problem Statement
Conventional task management tools and digital calendars act as passive registries, relying entirely on manual upkeep and failing to evaluate the feasibility of a user's workload. Under high scheduling density, passive systems do not protect users from over-scheduling, lack feedback for cognitive fatigue, offer no automated solutions for transcribing physical schedules or syllabi, and fail to provide support mechanisms when deadlines are missed or need to be renegotiated.

### Solution
**LifeSaver AI Assistant** is a full-stack, state-aware productivity dashboard that helps users organize daily tasks and schedules. It integrates server-side Google Gemini AI models to analyze daily tasks, suggest hour-by-hour calendar schedules, display workload insights, extract tasks from schedule pictures via OCR, and generate professional deadline renegotiation drafts. It aims to establish a supportive and structured planning environment.

### Objectives
- **Manage Overload:** Real-time analysis of scheduling density and volume alerts users when commitments become excessive.
- **Efficient Ingestion:** Simplify onboarding by extracting structured tasks directly from physical syllabus photos and digital planner images.
- **Assisted Workflow Planning:** Streamline schedule creation and communication, offering conversational coaching and template email drafts for deadline extensions.
- **Reliable Data Persistence:** Support uninterrupted operation by falling back to local file-system storage when cloud databases are unavailable.

---

## 3. PROJECT OVERVIEW

The application consolidates personal productivity tools—Tasks, long-term Goals, daily Habits, and an hour-by-hour Calendar—into a centralized workspace. It is built for students, software developers, and professionals managing complex daily commitments.

### Core Use Cases
1. **Intelligent Schedule Planning:** Automatically maps pending tasks to empty calendar segments.
2. **Workload Density Alerts:** Triggers notifications as task density increases.
3. **Physical Document Extraction:** Converts printed or handwritten syllabi and work agendas into digital database tasks.
4. **Deadline Extension Assistance:** Generates customizable professional email drafts for requesting project or assignment extensions.

---

## 4. TECHNOLOGY STACK

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Compiled using Vite with functional React hooks and custom Context state. |
| **Styling** | Tailwind CSS + Motion | Direct utility styling with responsive layout support and interactive transitions. |
| **Charts** | Recharts | Renders interactive charts showing task categories and weekly completion rates. |
| **Audio** | Web Audio API | Generates customizable sound indicators for task warnings and alerts. |
| **Backend** | Express.js + TS | Modular TypeScript API routes with JWT authorization. |
| **Database** | MongoDB (Primary) + Local Storage | Dual-persistence architecture: defaults to MongoDB, falls back to local file storage if the database URI is absent. |
| **AI Integration** | `@google/genai` SDK | Accesses Google Gemini models server-side for OCR task parsing, chat help, and schedule recommendations. |
| **Notifications** | Nodemailer + Node-cron | Sends scheduled email briefings and maintains background notification queues. |

---

## 5. SYSTEM ARCHITECTURE

The application is structured as a decoupled full-stack architecture. All API keys and secrets (such as Google Gemini credentials and SMTP details) are handled on the server side to ensure client security.

```mermaid
graph TD
    Client[React Frontend] -->|API Requests with JWT| Server[Express Backend]
    Server -->|Database Queries| DB[(Database: MongoDB or Local Storage)]
    Server -->|Google Gen AI SDK| Gemini[Google Gemini API]
    Server -->|Email Alerts| SMTP[Email Notification Service]
```

---

## 6. CORE FEATURES

Every listed feature is fully implemented and operational.

| Feature Name | Description | Status | Demo Ready |
| :--- | :--- | :---: | :---: |
| **JWT Registration & Auth** | Registration, login, password hashing, and session persistence via JWT. | Completed | ✅ Yes |
| **Avatar Customization** | Supports uploading and cropping user profile photos. | Completed | ✅ Yes |
| **Workload Insights** | Displays workload density indicators based on current tasks and deadlines. | Completed | ✅ Yes |
| **Success Probability Meter** | Displays visual feedback on expected daily task completion likelihood. | Completed | ✅ Yes |
| **Tasks & Goals Boards** | Full CRUD capabilities for task check-ins, custom priorities, and strategic milestones. | Completed | ✅ Yes |
| **Habits Streak Monitor** | Check off repeating habits while tracking active completion streaks. | Completed | ✅ Yes |
| **Calendar Block Scheduler** | Hour-by-hour calendar planner supporting block creation, edits, and automated scheduling. | Completed | ✅ Yes |
| **Acoustic Alerts** | Sound indicators for task warnings, pacing limits, and focus reminders. | Completed | ✅ Yes |
| **AI Planner (Auto-Scheduler)**| Automatically structures calendar events based on pending tasks and available slots. | Completed | ✅ Yes |
| **AI Assistant Chat** | Conversational advisor that provides guidance using active tasks, goals, habits, and workload context. | Completed | ✅ Yes |
| **AI Extension Negotiator** | Generates AI-assisted email drafts for deadline extension requests. | Completed | ✅ Yes |
| **AI Schedule Scanner (OCR)** | Processes printed or handwritten schedule photos and ingests extracted tasks using Gemini. | Completed | ✅ Yes |
| **Voice Command Assistant** | Voice interface for hands-free task registration and schedule status checks. | Completed | ✅ Yes |
| **HTML Email Digest** | Sends regular email summaries of upcoming tasks using node-cron. | Completed | ✅ Yes |
| **Analytics Dashboard** | Displays charts showing task categories, goal progress, and habit streaks. | Completed | ✅ Yes |

---

## 7. AI FEATURES & CAPABILITIES

### 1. AI Schedule Scanner (OCR)
- **Purpose:** Extracts structured checklist items from syllabus photos or printed planners.
- **Input:** Image files (JPEG, PNG, WEBP).
- **Processing:** Passes image binaries to Google Gemini Vision with an output schema.
- **Output:** Parsed task lists with due dates, priorities, and descriptions.
- **Benefit:** Reduces manual data entry by digitizing external documents instantly.

### 2. AI Planner (Auto-Scheduler)
- **Purpose:** Structures daily calendar blocks around pending commitments.
- **Input:** Pending tasks, existing calendar events, and work hour preferences.
- **Processing:** Evaluates scheduling gaps and maps high-priority tasks to empty segments using Google Gemini.
- **Output:** New schedule blocks saved directly to the calendar.
- **Benefit:** Maximizes daily time-blocking with structured scheduler suggestions.

### 3. Conversational AI Assistant
- **Purpose:** Discuss productivity strategies and workload optimization.
- **Input:** User queries alongside active task statistics and habit data.
- **Processing:** Google Gemini generates responses using the user's current tasks, goals, habits, and application context.
- **Output:** Context-aware productivity advice, strategy plans, and motivational feedback.
- **Benefit:** Acts as a personalized companion to help users optimize scheduling habits.

### 4. AI Negotiator
- **Purpose:** Generates professional draft emails when seeking deadline extensions.
- **Input:** Target task, recipient, reasoning details, and tone settings.
- **Processing:** Synthesizes inputs into formal, empathetic, or direct email structures using Gemini.
- **Output:** Copyable email drafts suited to the selected context.
- **Benefit:** Eases professional communication under dense scheduling pressure.

---

## 8. USER WORKFLOW

```
  [1. ONBOARDING] -----> [2. IDENTITY & PROFILE] -----> [3. CAPTURE DATA]
         |                         |                            |
         |                         v                            v
         v                  Upload cropped avatar         Add tasks manually or
  Register & log in        & set role preferences         via AI Scanner (OCR)
         |
         +-------------------------> [4. PLAN DAY] <------------------------+
                                         |
                                         v
                              Run AI Auto-Scheduler to
                              allocate calendar slots
                                         |
                                         +--------------------> [5. PROGRESS & AUDIT]
                                                                        |
                                                                        v
                                                             Check tasks, build habit
                                                             streaks, track goal sliders
                                                                        |
  [7. NEGOTIATING COOLDOWN] <--- [6. OVERLOAD WARNINGS] <---------------+
              |                            |
              v                            v
     AI Negotiator drafts         Burnout risk alerts trigger
     deadline extension emails    sound & stress briefs
```

---

## 9. DATABASE DESIGN

The backend supports dual-persistence. When MongoDB is configured, Mongoose schemas enforce structured models. If MongoDB is unavailable, operations automatically utilize local file-system persistence fallback, keeping user workspaces persistent and functional.

### Database Entities & Fields

#### User
- `_id` (Primary Key): Unique user ID
- `username` (String): User's handle
- `email` (String): Email address (unique)
- `passwordHash` (String): Hashed password value
- `role` (String): Customizable rank role (e.g. Student, Developer)
- `profileImage` (String): Reference to profile avatar
- `createdAt` (Date): Account creation timestamp

#### Task
- `_id` (Primary Key): Unique task ID
- `userId` (Foreign Key): Associated User record
- `title` (String): Headline of the task
- `description` (String): Contextual details
- `category` (String): Classification tag
- `priority` (String): High, Medium, or Low density tag
- `status` (String): Complete or Pending status
- `dueDate` (String): Target date parameter
- `time` (String): Designated time segment

#### Goal
- `_id` (Primary Key): Unique goal ID
- `userId` (Foreign Key): Associated User record
- `title` (String): Strategic pursuit objective
- `description` (String): Description of goals
- `category` (String): Categorization tag
- `targetDate` (String): Target completion date
- `progress` (Number): Percentage tracker (0 - 100)
- `status` (String): Active or Achieved status
- `milestones` (Array): Nested checklist items with complete status

#### Habit
- `_id` (Primary Key): Unique habit ID
- `userId` (Foreign Key): Associated User record
- `title` (String): Repeated routine name
- `category` (String): Discipline track
- `frequency` (String): Daily, Weekly, or Monthly intervals
- `streak` (Number): Consecutive check-in count
- `lastCompleted` (Date): Last check-in date
- `history` (Array): Log of completion dates

#### CalendarEvent
- `_id` (Primary Key): Unique event ID
- `userId` (Foreign Key): Associated User record
- `title` (String): Event title
- `date` (String): Scheduled date parameter
- `startTime` (String): Time-block start
- `endTime` (String): Time-block end
- `category` (String): Focus, Recovery, Lecture, etc.
- `description` (String): Summary details

#### Settings
- `userId` (Foreign Key): Associated User record
- `workHoursStart` (String): Daily start hour
- `workHoursEnd` (String): Daily end hour
- `focusLevel` (String): Work preference metrics
- `pushEnabled` (Boolean): Audio and toast alerts status
- `emailAlerts` (Boolean): Digest delivery status
- `burnoutTriggers` (Boolean): Alerts flag
- `modelType` (String): AI model parameters
- `disruptionGrade` (String): Tolerance settings
- `pacingInterval` (String): Pacing controls

---

## 10. API DOCUMENTATION

Interactive API documentation is hosted at `/api-docs` using Swagger-UI.

### Swagger Documentation URL
👉 **[https://ais-pre-ubwrdqw6y656d2w4kttylc-319694471469.asia-east1.run.app/api-docs](https://ais-pre-ubwrdqw6y656d2w4kttylc-319694471469.asia-east1.run.app/api-docs)**

### API Module Overview
The backend architecture is structured around standard REST principles. Accessing endpoints (excluding registration and login) requires a valid Bearer JWT.

- **Authentication & Profiles:** User registration, password hashing verification, JWT issuance, profile updates, and avatar uploads.
- **Task Management:** Complete CRUD endpoints supporting task filters and priority evaluations.
- **Goals & Habits:** Tracking systems with nested checklist milestones and routine streaks.
- **Calendar & Planning:** Custom scheduling blocks and endpoints for automated calendar slot allocation.
- **AI Core Operations:** Integrates Gemini models for schedule planning, twin chat strategy guidance, study schedules, and email negotiation drafting.
- **OCR Syllabus Scanning:** Image uploading, text extraction, and batch-ingestion routes.
- **Notifications & Analytics:** System alerts, user settings, diagnostic checks, and aggregated analytics charts.

---

## 11. SECURITY AUDITS

1. **Bearer JWT Verification:** Private routes require an `Authorization` header containing a signed JSON Web Token (JWT), protecting multi-user resources.
2. **Password Hashing:** User passwords are encrypted on the server side using BcryptJS with 10 salt rounds before storage.
3. **Payload Sanitization:** Write routes enforce Zod validation schemas on incoming data, preventing malformed variables and injection exploits.
4. **File Upload Restrictions:** User-submitted profile and schedule pictures undergo checks for strict MIME formats (JPEG, PNG, WEBP) and a 5MB size limit.
5. **Storage Cleanup:** Deleted or replaced profile avatars are automatically unlinked from the server storage, preventing disk bloat.

---

## 12. UI SCREEN VISUAL MAPS

The user interface features a cohesive dark theme built with high-contrast text and interactive components.

### 1. Dashboard Landing Layout
![Workspace Access Sign-In](README/screenshots/signin.png)
*Figure 1: Authentication gateway where users can register or log in to launch their secure workspace.*

### 2. Login Verification Portal
![Secure Authentication Portal](README/screenshots/login.png)
*Figure 2: Secure login interface requiring validated JWT access credentials.*

### 3. Unified Dashboard Workspace
![LifeSaver AI OS Dashboard](README/screenshots/dashboard.png)
*Figure 3: Centralized view showing completion probability meters, workload insight indicators, customized briefings, and core task tracking.*

### 4. Interactive Calendar Planner
![Interactive Hour Planner Calendar](README/screenshots/calender.png)
*Figure 4: Hour-by-hour calendar grid allowing manual scheduling and deep-work planning.*

### 5. Multi-Agent AI Scheduler
![AI Planner Coordinates](README/screenshots/Ai_planner.png)
*Figure 5: AI Auto-Scheduler interface for running automated calendar allocations and schedule configurations.*

### 6. AI Voice Assistant Centre
![AI Voice Assistant Controls](README/screenshots/AivoiceAssistant.png)
*Figure 6: Microphone-activated voice interface for hands-free command execution.*

### 7. Conversational Twin Chat
![AI Twin Chatroom](README/screenshots/aichat.png)
*Figure 7: Conversational interface for exploring scheduling habits and productivity strategies.*

### 8. AI Negotiator Extension Architect
![AI Negotiator Interface](README/screenshots/Ai_negotiator.png)
*Figure 8: AI-assisted interface for generating tailored deadline extension email drafts.*

### 9. Exam & Interview Preparation Hub
![Exam and Interview Prep](README/screenshots/Exam_And_Interview_Prep.png)
*Figure 9: Step-by-step syllabus decomposition engine for structuring study tracks.*

### 10. Habits Consistency Grid
![Habit Metrics](README/screenshots/HabitMetrix.png)
*Figure 10: Matrix tracking repeating routines, daily streaks, and consistency rings.*

### 11. Strategic Goals Board
![Strategic Goals](README/screenshots/goals.png)
*Figure 11: Milestone engine designed to decompose long-term projects into manageable targets.*

### 12. Advanced Connection Settings
![System Setup Control Panel](README/screenshots/setting.png)
*Figure 12: Configurations panel for toggling notification channels, work hours, and verifying active database status.*

### 13. Dynamic Theme Settings
![Toggle Theme Mechanics](README/screenshots/Toggle_Theme.png)
*Figure 13: Instant theme engine allowing seamless transitions between cyber dark and eye-safe light themes.*

### 14. Responsive Light Theme Layout
![Light Mode Interface](README/screenshots/LightTheme.png)
*Figure 14: Polished, alternative light theme layout offering enhanced readability and high contrast.*

---

## 13. INSTALLATION GUIDE

Ensure you have Node.js (version 18 or above) installed on your system.

### Step 1: Clone the Repository
```bash
git clone https://github.com/ShivaniNagda/lifesaver-ai-os.git
cd lifesaver-ai-os
npm install
```

### Step 2: Establish the Environment File
Create a `.env` file in the root directory. Populating credentials and secrets is recommended for optimal performance:
```env
# Server configuration
PORT=3000
JWT_SECRET=your_jwt_secret_here

# Database setup (Defaults to local files if MONGODB_URI is left empty)
MONGODB_URI=your_mongodb_connection_string

# Google Gemini AI Integrations
GEMINI_API_KEY=your_google_gemini_api_key_here

# Mailing Service Credentials (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_email_address
EMAIL_PASS=your_smtp_app_password
```

### Step 3: Run the System
```bash
# Start development environment
npm run dev

# Build production assets
npm run build

# Start production server
npm start
```

---

## 14. DEPLOYMENT PROTOCOLS

### General Container Deployment
The application is fully containerization-friendly and optimized for deployment to platforms such as **Google Cloud Run**, Amazon ECS, or modern virtual private servers (VPS).
- **Express Port Binding:** The server binds automatically to `0.0.0.0:3000` to handle container ingress configurations.
- **Optimized Asset Delivery:** Production builds precompile client-side React assets directly to `/dist`. These static files are served directly by the Express backend, ensuring unified routing and avoiding CORS issues.

### Persistent Fallback Handling
In serverless environments or instances deployed without MongoDB connections, the server automatically defaults to local file persistence under the `./data/` directory.

---

## 15. TESTING SUITE

| Module | Status |
| :--- | :---: |
| **Authentication** | ✅ Tested |
| **Tasks & CRUD** | ✅ Tested |
| **Goals & Habits** | ✅ Tested |
| **Audio Notification** | ✅ Tested |
| **AI Planner & Auto-Schedule** | ✅ Tested |
| **OCR Schedule Scanner** | ✅ Tested |
| **SMTP Email Digests** | ✅ Tested |
| **Swagger/OpenAPI Spec** | ✅ Tested |
| **Responsive Web Layout** | ✅ Tested |

---

## 16. CHALLENGES & SOLUTIONS

### 1. Browser Autoplay Restrictions
- **Challenge:** Modern web browsers block programmatic sound playback unless the user has actively interacted with the page first.
- **Solution:** Integrated an initialization check that logs warnings gracefully without interrupting the application if a sound cannot play. Audio is initialized upon the user's first click.

### 2. Container Port Restrictions
- **Challenge:** Container deployments often require applications to listen and communicate through a single port.
- **Solution:** Configured Express to serve both backend API routes and compiled React static files on unified port 3000.

### 3. OCR Image Text Extraction Layouts
- **Challenge:** Handwritten planners or complex syllabus charts yield cluttered, unstructured text strings when processed through standard optical readers.
- **Solution:** Passed the parsed OCR text payload to Gemini models with instructions to return structured JSON outputs matching our predefined schema parameters.

---

## 17. FUTURE SCOPE

- **Bidirectional Google Calendar Sync:** Add support for syncing tasks and scheduling slots directly to users' Google Calendar accounts via OAuth 2.0.
- **Native Web Push Notifications:** Implement real-time push protocols to alert users of upcoming deadlines when they are offline or away from the dashboard.
- **Ambient Focus Audios:** Integrate custom ambient focus sounds to support concentration during scheduled calendar segments.

---

## 18. PROJECT STATISTICS

- **Total API Modules:** 11 active operational categories
- **Total Backend Routes:** 49 verified endpoints
- **Total AI Integration Nodes:** 6 Gemini capability functions
- **Total Collections:** 10 schemas
- **Total HUD Widgets:** 7 core visualization modules
- **Total Main Views:** 2 (Landing Portal & Dashboard HUD)
- **Total Core React Components:** 14 modular interfaces
- **Total Notification Options:** 3 (Screen toasts, sound indicators, email summaries)

---

## 19. FINAL VERIFICATION CHECKLIST

- [x] **Secure Authentication Working:** Complete JWT registration, login, and secure sessions.
- [x] **Productivity CRUD Complete:** Full support for managing Tasks, Goals, Habits, and Calendars.
- [x] **Gemini Integrations Active:** AI Planner, Assistant Chat, OCR Scanner, and Negotiator are fully operational.
- [x] **Audio Alerts Active:** Web Audio API sound indicators are fully integrated.
- [x] **Email Briefings Working:** Scheduled digest emails compile and deliver using Nodemailer.
- [x] **OCR Syllabus Reader Active:** Schedule images are parsed and imported in batch.
- [x] **Interactive Dashboard HUD Active:** Live completion gauges, workload insights, and analytics.
- [x] **Swagger Documentation Present:** Fully documented OpenAPI 3.0 specification served at `/api-docs`.
- [x] **Responsive Visual Layout:** UI scales cleanly across mobile, tablet, and desktop viewports.
- [x] **Deployment Ready:** Packaged and configured for easy deployment.

---

## 20. SUBMISSION STATUS

✅ **Ready for Hackathon Submission**

---
