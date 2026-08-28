# 🚀 Backend API — Ultimate Step-by-Step Developer Guide

A production-ready, scalable RESTful API and real-time backend architecture built with **TypeScript**, **Node.js**, **Express**, **Prisma ORM**, **MongoDB**, **WebSockets**, and integrated cloud services.

---

## 📋 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [Prerequisites](#-prerequisites)
3. [Step-by-Step Quick Start](#-step-by-step-quick-start)
4. [Environment Configuration (.env)](#-environment-configuration-env)
5. [Database & Prisma ORM Guide](#-database--prisma-orm-guide)
6. [Automatic Module Generator](#-automatic-module-generator)
7. [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
8. [API Route Reference (`/api/v1`)](#-api-route-reference-apiv1)
   - [Auth Routes](#1-auth-routes-apiv1auth)
   - [User Routes](#2-user-routes-apiv1users)
   - [Notification Routes](#3-notification-routes-apiv1notifications)
   - [Subscription Offer Routes](#4-subscription-offer-routes-apiv1subscriptionoffers)
   - [User Subscription Routes](#5-user-subscription-routes-apiv1usersubscriptions)
   - [WebSockets & Real-Time Communication](#6-websockets--real-time-communication)
9. [Available NPM Scripts](#-available-npm-scripts)
10. [Step-by-Step Deployment Guide](#-step-by-step-deployment-guide)
    - [Deploy to Vercel](#deploy-to-vercel-recommended-serverless)
    - [Deploy to VPS / Linux Server (PM2)](#deploy-to-vps--linux-server-pm2)
11. [Troubleshooting & Common Issues](#-troubleshooting--common-issues)

---

## 🛠 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Runtime & Language** | Node.js (v18+ or v20+), TypeScript (v5.x) |
| **Framework** | Express.js |
| **Database & ORM** | MongoDB Atlas, Prisma ORM (v6.9.0) |
| **Validation** | Zod, Zod-Prisma-Types |
| **Authentication & Security** | JWT (JSON Web Tokens), Bcrypt, OAuth2 (Google & Facebook), Express Rate Limit |
| **Real-time Communication** | WebSockets (`ws`), Socket.io |
| **File Storage** | DigitalOcean Spaces (S3-compatible API), Cloudinary |
| **Payments** | Stripe, PayPal REST SDK |
| **Notifications & Mail** | Nodemailer (SMTP), Firebase Cloud Messaging (FCM Admin SDK) |
| **Scheduled Tasks** | Node-Cron |

---

## 📦 Prerequisites

Before getting started, ensure you have the following installed on your local machine:
- **Node.js**: `v18.0.0` or higher (v20 LTS recommended)
- **npm** (v9+) or **yarn** / **pnpm**
- **Git**
- **MongoDB Atlas** cluster account (or local MongoDB with replica set enabled)

---

## ⚡ Step-by-Step Quick Start

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd code-base
```

### 2. Install Dependencies
Install all required project packages:
```bash
npm install
```
*(Note: `prisma generate` will run automatically after install via `postinstall` script).*

### 3. Setup Environment Variables
Create a local `.env` file by copying `.env.example`:
```bash
# On Linux / macOS / Git Bash:
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example .env
```
Open `.env` and fill in your MongoDB URI, JWT Secrets, SMTP credentials, and third-party API keys.

### 4. Sync Database Schema with Prisma
Generate the Prisma client and push your schema to MongoDB:
```bash
# Generate Prisma Client
npx prisma generate

# Push Schema to MongoDB
npx prisma db push
```

### 5. Start the Development Server
```bash
npm run dev
```
The server will start listening at: `http://localhost:5000` (or the port defined in your `.env`).

---

## ⚙️ Environment Configuration (.env)

Configure the following variables in your `.env` file:

```env
# ==========================================
# 🗄️ DATABASE & SERVER SETTINGS
# ==========================================
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority"
NODE_ENV="development"
PORT=5000
FRONTEND_BASE_URL="http://localhost:3000"

# ==========================================
# 🔐 AUTHENTICATION & JWT TOKENS
# ==========================================
BCRYPT_SALT_ROUNDS=12
JWT_SECRET="your_jwt_secret_key"
EXPIRES_IN="60d"
REFRESH_TOKEN_SECRET="your_refresh_token_secret"
REFRESH_TOKEN_EXPIRES_IN="120d"
RESET_PASS_TOKEN="your_reset_pass_token_secret"
RESET_PASS_TOKEN_EXPIRES_IN="10m"
RESET_PASS_LINK="http://localhost:3001/reset-password"

# ==========================================
# 📧 EMAIL (SMTP - NODEMAILER)
# ==========================================
EMAIL="your_email@gmail.com"
APP_PASS="your_gmail_app_password"

# ==========================================
# ☁️ DIGITALOCEAN SPACES (OBJECT STORAGE)
# ==========================================
DO_SPACE_ENDPOINT="https://nyc3.digitaloceanspaces.com"
DO_SPACE_ORIGIN_ENDPOINT="https://your-space-name.nyc3.digitaloceanspaces.com"
DO_SPACE_ACCESS_KEY="your_do_space_access_key"
DO_SPACE_SECRET_KEY="your_do_space_secret_key"
DO_SPACE_BUCKET="your_do_space_bucket"

# ==========================================
# 🖼️ CLOUDINARY (MEDIA STORAGE)
# ==========================================
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
ENVIRONMENT_VARIABLE="cloudinary://<api_key>:<api_secret>@<cloud_name>"

# ==========================================
# 💳 PAYMENT GATEWAYS
# ==========================================
STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

PAYPAL_CLIENT_ID="your_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret"
PAYPAL_MODE="sandbox" # or "live"

# ==========================================
# 🌐 SOCIAL LOGIN (OAUTH)
# ==========================================
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/v1/auth/google/callback"

FACEBOOK_APP_ID="your_facebook_app_id"
FACEBOOK_APP_SECRET="your_facebook_app_secret"
FACEBOOK_CALLBACK_URL="http://localhost:5000/api/v1/auth/facebook/callback"

# ==========================================
# 🗺️ THIRD-PARTY APIS
# ==========================================
GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
TICKETMASTER_BASE_URL="https://app.ticketmaster.com/discovery/v2"
TICKETMASTER_API_KEY="your_ticketmaster_api_key"
AI_API_KEY="your_ai_api_key"
```

---

## 🗄️ Database & Prisma ORM Guide

The project uses **Prisma v6.9.0** configured with MongoDB.

### Essential Prisma Commands

```bash
# 1. Generate Prisma Client whenever schema.prisma changes
npx prisma generate

# 2. Push schema changes to MongoDB database
npx prisma db push

# 3. Open Prisma Studio (visual database UI in browser)
npx prisma studio

# 4. Format schema.prisma file
npx prisma format

# 5. Validate schema
npx prisma validate
```

> **Note on Prisma Version**: If re-installing or pinning Prisma dependencies, use:
> ```bash
> npm i -D prisma@6.9.0 @prisma/internals@6.9.0
> npm i @prisma/client@6.9.0
> ```

---

## 🛠️ Automatic Module Generator

This codebase includes a built-in automated code generation utility (`src/generate-module.js`) that creates complete, production-grade module architectures (Controller, Service, Route, Validation, Interface) directly from your `schema.prisma` models.

### How to Use:
```bash
# 1. Sync and generate modules for all models in schema.prisma:
npm run generate -- --sync

# 2. Generate a specific module by model name:
npm run generate "Subscriptionoffer"
```
The generator automatically:
- Creates `src/app/modules/<ModuleName>/`
- Generates `<module>.controller.ts`, `<module>.service.ts`, `<module>.routes.ts`, `<module>.validation.ts`, `<module>.interface.ts`
- Registers the new route automatically into `src/app/routes/index.ts`

---

## 📂 Project Architecture & Directory Structure

```text
├── prisma/
│   └── schema.prisma          # Database models & relationships
├── src/
│   ├── app/
│   │   ├── middlewares/       # Auth guard, rate-limiter, global error handler, validation
│   │   ├── modules/           # Feature-based modular architecture
│   │   │   ├── Auth/          # Authentication & social login
│   │   │   ├── User/          # User management & profile
│   │   │   ├── notification/  # Notification handling
│   │   │   ├── subscriptionoffer/ # Admin subscription plans
│   │   │   ├── usersubscription/  # User subscriptions & billing
│   │   │   └── Websocket/     # Real-time WebSocket connection & rooms
│   │   └── routes/            # Central routing table (index.ts)
│   ├── config/                # Central environment variables & config
│   ├── errors/                # Custom AppError & error abstractions
│   ├── helpars/               # File uploaders, pagination, filters
│   ├── interfaces/            # Global TypeScript interfaces
│   ├── shared/                # Prisma client singleton, email sender, cron jobs
│   ├── app.ts                 # Express application & middleware setup
│   ├── generate-module.js     # CLI module scaffolding tool
│   └── server.ts              # HTTP & WebSocket server entry point
├── .env.example               # Template environment configuration
├── .gitignore                 # Git ignore rules (protects .env)
├── package.json               # NPM scripts and dependencies
├── tsconfig.json              # TypeScript compiler configuration
└── vercel.json                # Vercel serverless deployment configuration
```

---

## 🔌 API Route Reference (`/api/v1`)

Base URL: `http://localhost:5000/api/v1`

### 1. Auth Routes (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Log in user and receive JWT Access & Refresh tokens |
| `POST` | `/auth/logout` | Public | Log out user and clear cookie sessions |
| `GET` | `/auth/profile` | Required | Retrieve current authenticated user profile |
| `PUT` | `/auth/change-password` | Required | Change password for logged-in user |
| `POST` | `/auth/forgot-password` | Public | Initiate password reset (sends OTP via email) |
| `POST` | `/auth/resend-otp` | Public | Resend OTP verification code |
| `POST` | `/auth/verify-otp` | Public | Verify OTP code |
| `POST` | `/auth/reset-password` | Public | Reset password using verified token/OTP |
| `GET` | `/auth/google` | Public | Web: Google OAuth authorization URL redirect |
| `GET` | `/auth/google/callback` | Public | Web: Google OAuth callback handler |
| `POST` | `/auth/google-login` | Public | Mobile: Token-based Google sign-in |
| `GET` | `/auth/facebook` | Public | Web: Facebook OAuth authorization URL redirect |
| `GET` | `/auth/facebook/callback`| Public | Web: Facebook OAuth callback handler |
| `POST` | `/auth/facebook-login` | Public | Mobile: Token-based Facebook sign-in |

### 2. User Routes (`/api/v1/users`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/users` | Public | Register a new user |
| `GET` | `/users` | Public | Retrieve paginated list of all users |
| `GET` | `/users/:id` | Public | Retrieve single user by ObjectId |
| `PUT` | `/users/profile` | Required | Update logged-in user's profile (supports multipart image) |
| `POST` | `/users/upload-photo` | Required | Upload single photo (DigitalOcean / Cloudinary) |
| `PUT` | `/users/toggle-block/:id`| Required | Block or unblock a user |
| `DELETE`| `/users/delete/:id` | Required | Soft-delete / Remove user |
| `POST` | `/users/support/message`| Public | Submit user support inquiry to admin email |
| `PUT` | `/users/approve-users/:id`| Admin | Admin approves a user account |
| `PUT` | `/users/reject-users/:id` | Admin | Admin rejects a user account |

### 3. Notification Routes (`/api/v1/notifications`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/notifications/send-noti` | Public | Send notification to a specific user |
| `GET` | `/notifications/all-noti` | Required | Get all system notifications |
| `GET` | `/notifications/get-noti` | Required | Get notifications for authenticated user |
| `GET` | `/notifications/unread-noti`| Required | Get unread notifications for authenticated user |
| `PATCH`| `/notifications/read-noti` | Required | Mark user notifications as read |
| `POST` | `/notifications/send-group-noti` | Admin | Broadcast notification to user groups |
| `DELETE`| `/notifications/delete-noti/:id` | Required | Delete notification by ID |

### 4. Subscription Offer Routes (`/api/v1/subscriptionoffers`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/subscriptionoffers` | Admin | Create a new subscription package / plan |
| `GET` | `/subscriptionoffers` | Required | List all available subscription plans |
| `GET` | `/subscriptionoffers/get/by/userId` | Required | Get offers applicable for user |
| `PUT` | `/subscriptionoffers/:id` | Admin | Update subscription plan details |
| `DELETE`| `/subscriptionoffers/:id` | Admin | Delete a subscription offer |

### 5. User Subscription Routes (`/api/v1/usersubscriptions`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/usersubscriptions` | Required | Subscribe user to a plan |
| `POST` | `/usersubscriptions/:id` | Required | Subscribe to specific plan ID |
| `GET` | `/usersubscriptions` | Required | List all user subscriptions |
| `GET` | `/usersubscriptions/get/by/userId` | Required | Get current active subscriptions for user |
| `PUT` | `/usersubscriptions/:id` | Required | Update subscription details |
| `PUT` | `/usersubscriptions/cancel/:id` | Required | Cancel active subscription |

### 6. WebSockets & Real-Time Communication

The server attaches a WebSocket server to the HTTP instance for real-time capabilities:
- **Endpoint**: `ws://localhost:5000` (or `wss://yourdomain.com`)
- **Features**: Real-time 1-on-1 chats, chat rooms, connection presence, instant notification dispatching.

---

## 📜 Available NPM Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts development server with hot reload (`ts-node-dev`) |
| `npm run build` | Compiles TypeScript (`src/`) to JavaScript (`dist/`) |
| `npm start` | Runs the compiled production code (`node ./dist/server.js`) |
| `npm run generate` | Runs the automatic module scaffolding generator |
| `npm run postinstall` | Automatically triggers `prisma generate` upon package installation |

---

## 🚀 Step-by-Step Deployment Guide

### Deploy to Vercel (Recommended Serverless)

This project contains a preconfigured [vercel.json](file:///c:/Users/ashiq/Desktop/Code%20Base/code-base/vercel.json).

#### Step 1: Build the Project Locally
Ensure TypeScript compiles cleanly:
```bash
npm run build
```

#### Step 2: Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
vercel -v
```

#### Step 3: Login to Vercel
```bash
vercel login
```

#### Step 4: Deploy to Production
```bash
vercel --prod
```
During the interactive prompt:
- **Set up and deploy?**: `y`
- **Which scope?**: Press `Enter` (default account)
- **Link to existing project?**: `n`
- **What's your project name?**: Press `Enter` (or specify name)
- **In which directory is code located?**: `./` (Press `Enter`)

#### Step 5: Add Environment Variables on Vercel
1. Navigate to [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your deployed project.
3. Go to **Settings** > **Environment Variables**.
4. Add all keys from your `.env` file (e.g., `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`).
5. Trigger a Redeploy under the **Deployments** tab.

---

### Deploy to VPS / Linux Server (PM2)

#### Step 1: Clone and Install on VPS
```bash
git clone <your-repo-url> /var/www/api
cd /var/www/api
npm install
```

#### Step 2: Configure Environment
```bash
cp .env.example .env
nano .env   # edit variables
```

#### Step 3: Generate Prisma Client & Build
```bash
npx prisma generate
npm run build
```

#### Step 4: Start Process with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start server
pm2 start dist/server.js --name "backend-api"

# Save PM2 process list & setup startup hook
pm2 save
pm2 startup
```

---

## 🔍 Troubleshooting & Common Issues

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `PrismaClientInitializationError` | Invalid or unreachable `DATABASE_URL` | Ensure your MongoDB Atlas IP access list allows `0.0.0.0/0` or your server IP. |
| `Cannot find module '@prisma/client'` | Prisma client not generated | Run `npx prisma generate`. |
| `JWT / Token Unauthorized (401)` | Expired or incorrect secret | Verify `JWT_SECRET` matches across environments and token is formatted as `Bearer <token>`. |
| `CORS Error in Browser` | Origin not whitelisted | Add your frontend domain to `corsOptions.origin` in [src/app.ts](file:///c:/Users/ashiq/Desktop/Code%20Base/code-base/src/app.ts). |
| `Rate Limit 429 Too Many Requests` | Exceeded 2000 req / 15 min | Adjust window and limit in `apiLimiter` in [src/app.ts](file:///c:/Users/ashiq/Desktop/Code%20Base/code-base/src/app.ts). |

---

## 📄 License
This project is licensed under the [ISC License](file:///c:/Users/ashiq/Desktop/Code%20Base/code-base/package.json).
