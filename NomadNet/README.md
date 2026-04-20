# NomadNet 🌍

![NomadNet Banner](https://via.placeholder.com/1200x300?text=NomadNet+-+The+Hub+for+Digital+Nomads)

> A robust, full-stack application built for digital nomads, remote workers, and globetrotters. NomadNet combines interactive geo-mapping, real-time social networking, and a community marketplace into one seamless platform.

## 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Author](#-author)

---

## 🎯 Overview

NomadNet solves the core challenges of living a nomadic lifestyle: isolation, finding good workspaces, and safely buying/selling gear on the go. Users can discover nearby co-working spaces or cafes, check in to connect with other nomads locally, chat in real-time, and utilize an integrated marketplace for community-driven exchanges.

---

## ✨ Key Features

### 🗺️ Location & Venue Discovery
* **Interactive Maps:** Fully functional Mapbox integration showing venues, users, and marketplace items around you.
* **Check-ins:** Broadcast your presence at specific venues or cities. See who else is currently checked in around your area.
* **Spatial Queries:** Uses MongoDB Geospatial queries (`$geoNear`) combined with Turf.js for complex location distance calculations.

### 💬 Real-Time Communication
* **Instant Messaging:** One-to-one and group chats powered by WebSockets (Socket.IO).
* **Online Presence Tracker:** See who's online, offline, or away in real time.
* **Read Receipts & Notifications:** Instant unread message indicators and in-app notifications.

### 🛒 Community Marketplace
* **Complete CRUD Workflows:** Create, read, update, and delete listings for housing, gear, or services.
* **Listing Management Dashboard:** A dedicated space (`MyListingsPage`) to track your active offerings.
* **Category Filtering:** Easily navigate marketplace listings via robust semantic search and categorization properties.

### 🔒 Security & User Management
* **JWT Authentication:** Secure access scaling securely with HTTP-Only cookies/local storage.
* **Email Verification & Password Resets:** Email hooks built out using **Brevo (Sendinblue)** and `nodemailer`.
* **Profile Customization:** Upload and manage personal avatars and bios seamlessly.

### 🏞️ Media & File Handling
* **Image Uploads:** Handled effortlessly via `multer` locally and shipped directly to **Cloudinary** for optimized global CDN delivery.

---

## 🛠 Architecture & Tech Stack

### Frontend (Client)
* **Framework:** React 19 / Vite
* **Routing:** React Router v7
* **Mapping:** `react-map-gl`, Mapbox GL JS, Turf.js
* **State & Networking:** Context API, Axios
* **Real-time:** `socket.io-client`
* **UI/UX:** Tailwind CSS (conceptual), Lucide React, React Icons, Emoji Picker React
* **Time Management:** `date-fns`

### Backend (Server)
* **Environment:** Node.js, Express.js
* **Database:** MongoDB & Mongoose (with Geospatial Indexes)
* **Real-time Server:** Socket.IO
* **Security:** Helmet, CORS, bcryptjs, JSONWebToken (JWT)
* **Media & Emails:** Cloudinary, Multer, Brevo API SDK

---

## 📂 Project Structure

```text
NomadNet/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route logic handlers
│   │   ├── models/           # Mongoose schemas (User, Venue, Message, MarketplaceItem, CheckIn, Status, Notification)
│   │   ├── routes/           # Express routers (/auth, /map, /marketplace, /messages, etc.)
│   │   └── middleware/       # JWT Auth verification, Error Handling
│   ├── .env.example          # Environment skeleton
│   └── server.js             # Primary Entry Point setup with Express & Socket.io
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI widgets (Map, Chat, Cards)
│   │   ├── context/          # React Context (AuthContext, LocationContext, SocketContext)
│   │   ├── pages/            # View components (AuthPage, DashboardPage, VenuePage, Marketplace)
│   │   ├── services/         # API & Socket singleton services
│   │   └── utils/            # Helpers (cloudinary uploader, etc.)
│   ├── .env.example          # Environment skeleton
│   └── vite.config.js        # Vite bundler config
└── README.md
```

---

## 📋 Prerequisites

Ensure you have the following services and tools prepared:
1. **Node.js** (v16.14.0 or newer)
2. **MongoDB** (A local instance on port 27017 or a MongoDB Atlas URI)
3. **Mapbox API Token** (For the interactive map)
4. **Cloudinary Account** (For image uploads - Cloud Name, Key, Secret finding)
5. **Brevo Account** (For transactional emails like passwords resets or welcomes)

---

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Khuzaim123/NomadNet.git
cd NomadNet
```

### 2. Backend Initialization
Open a terminal in the `backend` folder:
```bash
cd backend
npm install
```
Rename `.env.example` to `.env` and fill the variables.
```bash
cp .env.example .env
npm run dev
```
*The API server will run on `http://localhost:39300`.*

### 3. Frontend Initialization
Open a new terminal in the `frontend` folder:
```bash
cd frontend
npm install
```
Rename `.env.example` to `.env` and supply your API/Mapbox keys.
```bash
cp .env.example .env
npm run dev
```
*The Vite frontend will spin up on `http://localhost:5173`.*

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
# Server Runtime
NODE_ENV=development
PORT=39300
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=https://nomad-net.netlify.app,http://localhost:5173

# Database Connection
MONGODB_URI=mongodb://localhost:27017/nomadnet

# Cryptography
JWT_SECRET=your_super_secret_jwt_string

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Brevo Mailing Services
BREVO_API_KEY=your_brevo_api_key
FROM_EMAIL=khuzaimadnana@gmail.com
FROM_NAME=NomadNet
```

### Frontend (`frontend/.env`)
```env
# Internal API Routing
VITE_API_URL=http://localhost:39300

# Third-Party Connections
VITE_MAPBOX_TOKEN=your_mapbox_public_token
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

---

## ⚙️ Core API Endpoints

A quick glance at some of the robust REST endpoints exposed by Express:
* **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
* **Users**: `GET /api/users/profile/:id`, `PUT /api/users/update`
* **Marketplace**: `GET /api/marketplace`, `POST /api/marketplace`, `DELETE /api/marketplace/:id`
* **Venues & Check-ins**: `GET /api/venues`, `POST /api/checkins/venue/:id`
* **Messaging**: `GET /api/conversations`, `GET /api/messages/:conversationId`
* **Geo/Map Views**: `GET /api/map/nearby-users`, `GET /api/map/nearby-venues`

*(Full Postman collection coming soon)*

---

## 👨‍💻 Author

**Khuzaim123**  
📧 Email: [khuzaimadnana@gmail.com](mailto:khuzaimadnana@gmail.com)  
*Built to empower the digital nomad lifestyle.*
