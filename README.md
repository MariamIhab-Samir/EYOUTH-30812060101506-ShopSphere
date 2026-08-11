# Full-Stack E-Commerce Platform (Capstone Project)

A secure, high-performance, dual-database full-stack E-Commerce application built with a modular React frontend and a highly disciplined Node.js/Express backend. This application features complex user authentication splits, live product CRUD with file uploads, and full Docker service orchestration.

---

## 🏗️ System Architecture & Database Design

This platform operates on a robust, split-database engine architecture designed to maximize data integrity and log persistence separately:
* **Primary Database (PostgreSQL via Prisma ORM):** Handles strict relational transaction data including structured schemas for Users, Products, and Checkout Orders.
* **Logging Database (MongoDB via Mongoose):** Houses decoupled, immutable, asynchronous operational engines tracking application activity logs and system authentication failures.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** React (Vite)
* **Routing:** React Testing Library / React Router DOM (Case-sensitive declarative pathing)
* **State Management:** Native state hook engines with clean stream consumption guards

### Backend
* **Runtime Environment:** Node.js / Express.js
* **Primary ORM:** Prisma Client (PostgreSQL)
* **Logging ODM:** Mongoose (MongoDB)
* **File Handling:** Multer Middleware (Multipart form data image uploads)
* **Security & Encryption:** JSON Web Tokens (JWT) & Bcrypt password hashing

### Testing & DevOps
* **Testing Suites:** Jest (Unit), Supertest (API Integration), React Testing Library (Frontend)
* **API Mocking:** Mock Service Worker (MSW)
* **Containerization:** Docker, Multi-stage Dockerfiles, Docker Compose

---

## 🚀 Key Features Implemented

* **Dual-Role Authentication:** Clean UI division between User Login and Admin Login utilizing unified controllers targeting unique backend endpoint validation paths (`/api/auth/login`).
* **Administrative Control Panel:** Dynamic layout rendering matching case-sensitive path constraints (`/adminTab`), allowing authorized administrators to Add, Edit, Delete, and Upload physical product catalog media using Multer.
* **Robust Stream Management:** Bulletproof frontend fetch implementations avoiding double-consumption errors by reading the incoming network response buffer exactly once.
* **Safe Log Isolation:** Asynchronous catch blocks guaranteeing that tracking model writing faults never intercept downstream API payload responses.

---

## 🚦 Getting Started & Local Installation

### Prerequisites
* Node.js (v18+ recommended)
* PostgreSQL & MongoDB instances running locally or via Docker

### 1. Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd <project-folder>

# Install Backend Dependencies
cd backend && npm install

# Install Frontend Dependencies
cd ../frontend && npm install

2. Environment Configuration
Create a .env file inside your /backend folder:

Code snippet
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/"Term1Project"?schema=public"
MONGO_URI="mongodb://localhost:27017/ecommerce_logs"
JWT_SECRET="your_secure_fallback_jwt_key_here"
3. Synchronize Database & Schema
To safely bring up your Prisma models and migrate tables without losing operational baseline data:

Bash
cd backend
npx prisma db push
4. Running the Development Servers
Bash
# Start backend service (from /backend)
npm run dev

# Start frontend application (from /frontend)
npm run dev
🧪 Running the Test Frameworks
This codebase maintains high testing standards via decoupled behaviors:

Run Backend Unit & Integration Tests (Jest + Supertest):

Bash
cd backend && npm run test
Run Frontend Component Tests (React Testing Library + MSW):

Bash
cd frontend && npm run test
🐳 Docker Orchestration
Deploy the entire stack containing your frontend, backend, and database engines automatically:

Bash
# Build and lift all core services together from the project root
docker-compose up --build
🔑 Test Account Credentials
To access administrative routes, ensure your profile role column inside Prisma matches the string token constraints perfectly.

🔗 Project URLs
Frontend Client Workspace: http://localhost:3000

Backend Core Live API: http://localhost:5000

Health Check Monitoring Route: http://localhost:5000/health

"ok, this is an edit to my previous project since I had given you my credentials (my apologies), so yeah, I deleted it and now, u have .env.example for each .env required to make and yeah, also I realized my db name in DATABASE_URL was typed the first time wrong (it needed double quotes around the name(in some .env files it doesn't and yeah, the name wasn't right)) and the second time corretly so I changed it and now, it is without the credentials"