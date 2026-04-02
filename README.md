# Node.js Backend API 🌐

The secure, high-performance API for the Smart Event Check-In system.

---

## 🛠️ Tech Stack
-   **Framework**: Node.js & Express.
-   **Database**: MongoDB + Mongoose.
-   **Authentication**: JWT (JSON Web Tokens).
-   **Security**: Role-based access control (RBAC) and hashed passwords (crypto).
-   **Logging**: Custom API logs (`api_logs.txt`) for monitoring.

---

## 📂 Project Structure

```
backend/
├── controllers/       # Business Logic (Auth, Events, Registrations, Notifications)
├── models/            # Mongoose Schemas (User, Event, Registration, Notification)
├── routes/            # Express Routes 
├── middleware/        # JWT Authentication & Authorization
├── seed.js            # Initial Database Seeding (Admin & Events)
└── server.js          # Main Entry Point
```

---

## ⚙️ Configuration

Create a `.env` file in the root of the `/backend` folder:

```ini
PORT=3000
MONGODB_URI=mongodb://localhost:27017/SmartEventCheckIn
JWT_SECRET=your_secret_key_here
```

---

## 📝 API Endpoints (Core)

### **Authentication**
-   `POST /api/auth/register`: Create a new User.
-   `POST /api/auth/login`: Authenticate and receive JWT.

### **Events**
-   `GET /api/events`: Fetch all upcoming events.
-   `POST /api/events`: (Admin) Create a new event.
-   `PATCH /api/events/:id`: (Admin) Update event (Triggers smart invalidation).
-   `DELETE /api/events/:id`: (Admin) Remove event.

### **Registrations**
-   `POST /api/registrations/:eventId`: Register for an event.
-   `GET /api/registrations/my-tickets`: Fetch the current user's tickets.
-   `DELETE /api/registrations/:id`: Cancel a ticket.
-   `POST /api/registrations/validate`: (Staff) Scan and validate a QR code.

### **Notifications**
-   `GET /api/notifications`: Retrieve current user's alerts.
-   `PATCH /api/notifications/:id`: Mark a notification as read.

---

## 🚀 Running the Server

1.  `npm install`
2.  `node seed.js` (Optional, ensures you have an admin account).
3.  `npm start`

The API will be available at: `http://localhost:3000`
