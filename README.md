# NomadNet 🌍

NomadNet is a comprehensive web platform designed to connect digital nomads and travelers. Built with the robust MERN stack, NomadNet offers an interactive map-based venue explorer, real-time messaging, and a marketplace for community-driven listings. Whether you are looking for co-working spaces, meetups, or buying/selling gear, NomadNet fosters a vibrant community for remote workers worldwide.

## 🚀 Key Features

* **Interactive Map Exploration:** Browse venues and locations globally using an interactive map powered by Mapbox.
* **Real-time Chat capability:** Connect instantly with other community members and discuss listings or venues with WebSockets (Socket.io).
* **Dynamic Marketplace:** Publish, manage, and browse listings for services, gear, and opportunities through a full CRUD interface.
* **Secure Authentication:** Robust user authentication and session management using JWT and bcrypt.
* **Seamless Media Uploads:** Upload and manage profile pictures and listing images seamlessly using Cloudinary.
* **Responsive UI:** Modern, responsive, and intuitive interface built cleanly with React and Tailwind CSS framework ideas.

## 🛠️ Technology Stack

**Frontend:**
* React 19 / Vite
* React-Router-DOM (Routing)
* React-Map-GL & Mapbox (Maps)
* Socket.io-client (Real-time Events)
* Axios (HTTP Requests)
* Lucide React & React Icons (UI Assets)
* Emoji Picker React

**Backend:**
* Node.js & Express.js
* MongoDB & Mongoose (Database)
* Socket.io (WebSocket Server)
* Cloudinary & Multer (Image Storage)
* JWT (JSON Web Tokens Authentication)
* Brevo API / Nodemailer (Email services)

## 📋 Prerequisites

Before setting up the project locally, ensure you have the following installed:
* [Node.js](https://nodejs.org/en/) (v16+ recommended)
* [MongoDB](https://www.mongodb.com/) (Local instance or Atlas Cluster)
* Developer API Keys for [Mapbox](https://www.mapbox.com/), [Cloudinary](https://cloudinary.com/), and [Brevo](https://www.brevo.com/).

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd NomadNet
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory from the provided example:
```bash
cp .env.example .env
```
Update the `.env` file with your specific credentials (MongoDB, JWT Secret, Cloudinary, and Brevo API details).

Run the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory from the provided example:
```bash
cp .env.example .env
```
Ensure you add a valid Mapbox token and Cloudinary Cloud Name.

Run the frontend app:
```bash
npm run dev
```

The application should now be running reliably:
* Frontend: `http://localhost:5173`
* Backend: `http://localhost:39300`

## 👨‍💻 Author

* **Username:** Khuzaim123
* **Email:** khuzaimadnana@gmail.com
