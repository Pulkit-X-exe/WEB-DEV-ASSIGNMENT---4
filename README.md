# Secure Connect and Communication Platform

## Project Description
Secure Connect and Communication Platform is a backend project built using Node.js, Express.js, MongoDB, and Socket.io. It allows users to register an account, log in securely, access protected routes using JSON Web Tokens (JWT), create and manage personal notes, and communicate in real time using Socket.io chat. It also uses Node.js EventEmitter for event-driven console notifications when users register or create notes.

## Technologies Used
- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Token (jsonwebtoken)
- bcrypt
- Socket.io
- dotenv
- Node.js EventEmitter (built-in)
- Postman (for API testing)

## Features
- User registration with password hashing using bcrypt
- Duplicate email prevention
- User login with JWT token generation
- Custom JWT authentication middleware to protect private routes
- Role-Based Access Control (RBAC) with user and admin roles
- Complete CRUD operations for personal notes (Create, Read, Update, Delete)
- Notes privacy: users can only see, update, and delete their own notes
- Real-time communication using Socket.io (connection, chatMessage, disconnect)
- Event-driven notifications using Node.js EventEmitter (triggers on user signup and note creation)
- Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)

## Folder Structure
```
secure-connect/
│
├── config/
│   └── db.js
│
├── models/
│   ├── User.js
│   └── Note.js
│
├── routes/
│   ├── auth.js
│   └── notes.js
│
├── middleware/
│   └── auth.js
│
├── server.js
├── events.js
├── test-auth.js
├── test-notes.js
├── test-chat.js
├── Secure Connect Lab 4.postman_collection.json
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Installation Steps
1. Clone the repository:
```bash
git clone https://github.com/Pulkit-X-exe/WEB-DEV-ASSIGNMENT---4.git
cd WEB-DEV-ASSIGNMENT---4
```

2. Install dependencies:
```bash
npm install
```

## Environment Variables Setup
Create a `.env` file in the root directory with the following variables (refer to `.env.example`):
```env
PORT=5000
MONGO_URL=mongodb://localhost:27017/secure_connect
JWT_SECRET=mysecretkey123
```

## How to Start the Server
Make sure MongoDB is running on your system, then start the server:
```bash
npm start
```
or
```bash
node server.js
```

Expected console output:
```text
Server is running on port 5000
MongoDB connected successfully
```

## API Endpoints

### Authentication
- `POST /signup` - Register a new user (fields: `name`, `email`, `password`)
- `POST /login` - Log in and receive a JWT token (fields: `email`, `password`)
- `GET /admin` - Admin-only route (requires JWT with admin role)

### Notes (Protected - Requires Bearer Token)
- `POST /notes` - Create a new note (fields: `title`, `content`)
- `GET /notes` - Get all notes for the logged-in user
- `GET /notes/:id` - Get a specific note by ID
- `PUT /notes/:id` - Update a note by ID (fields: `title`, `content`)
- `DELETE /notes/:id` - Delete a note by ID

## How to Test Using Postman
1. Open Postman.
2. Click **Import** and select `Secure Connect Lab 4.postman_collection.json`.
3. Set the `baseUrl` variable to `http://localhost:5000` (or the port defined in your `.env`).
4. Run the **Signup** request under Authentication to register a new user.
5. Run the **Login** request under Authentication to receive a token.
6. Copy the returned token into the collection variable `token` or pass it in the Authorization header: `Bearer <token>`.
7. Test the **Notes** endpoints:
   - Create Note
   - Get All Notes (copy a note's `_id` into the `noteId` variable)
   - Get Note By ID
   - Update Note
   - Delete Note
8. Test the **Authorization** endpoints:
   - Access without token -> returns 401 Access denied
   - Access with invalid token -> returns 401 Invalid token
   - Access admin route as normal user -> returns 403 Access denied: Admins only

## How to Test Real-Time Chat (Socket.io)
You can test the Socket.io real-time chat in two ways:

1. Using the included test client script:
```bash
node test-chat.js
```
Expected output:
```text
User connected
Message received: Hello from client
User disconnected
```

2. Using Postman WebSocket / Socket.io request:
   - Click **New** -> **Socket.IO**.
   - Set URL: `ws://localhost:5000`.
   - Click **Connect** (Server console displays: `User connected`).
   - Listen for event: `chatMessage`.
   - Send event: `chatMessage` with message string `"Hello"`.
   - Click **Disconnect** (Server console displays: `User disconnected`).
