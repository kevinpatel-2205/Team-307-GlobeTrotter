const mysql = require('mysql');
const express = require('express');
const cors = require('cors');

// Create MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "globetrotter"
});

// Test database connection
db.connect((err) => {
    if (err) {
        console.log(' Database connection error:', err.message);
        console.log(' Make sure MySQL is running and the "globetrotter" database exists');
        console.log(' If using XAMPP, start Apache and MySQL from the control panel');
        process.exit(1);
    }
    console.log(' Connected to MySQL database successfully');
});

const app = express();
const PORT = 3002;

// ✅ CORS configuration for your React frontend
app.use(cors({
    origin: 'http://localhost:5175', // Allow only this frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Allow cookies/auth headers if needed
}));

// Handle preflight requests for all routes
app.options('*', cors({
    origin: 'http://localhost:5175',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Test route
app.get("/api/test", (_req, res) => {
    res.json({ message: "API is working!", timestamp: new Date().toISOString() });
});

// Route to get all users
app.get("/api/users", (_req, res) => {
    db.query("SELECT id, full_name, email, avatar_path, created_at FROM users", (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(result);
    });
});

// Route to get user by ID
app.get("/api/users/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT id, full_name, email, avatar_path, created_at FROM users WHERE id = ?", [id],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Database error" });
            }
            if (result.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            res.json(result[0]);
        });
});

// Signup Route
app.post('/api/auth/signup', (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    db.query("SELECT email FROM users WHERE email = ?", [email], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Database error" });
        }
        if (result.length > 0) {
            return res.status(400).json({ error: "User already exists with this email" });
        }

        const passwordHash = Buffer.from(password).toString('base64');

        db.query("INSERT INTO users (full_name, email, password_hash) VALUES (?,?,?)",
            [fullName, email, passwordHash], (err, insertResult) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: "Failed to create user" });
                }
                const token = Buffer.from(`${insertResult.insertId}:${email}:${Date.now()}`).toString('base64');

                res.status(201).json({
                    message: "User created successfully",
                    token: token,
                    user: {
                        id: insertResult.insertId,
                        fullName: fullName,
                        email: email
                    }
                });
            });
    });
});

// Login Route
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    db.query("SELECT id, full_name, email, password_hash FROM users WHERE email = ?", [email],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Database error" });
            }
            if (result.length === 0) {
                return res.status(401).json({ error: "Invalid email or password" });
            }

            const user = result[0];
            const passwordHash = Buffer.from(password).toString('base64');

            if (user.password_hash !== passwordHash) {
                return res.status(401).json({ error: "Invalid email or password" });
            }

            const token = Buffer.from(`${user.id}:${email}:${Date.now()}`).toString('base64');

            res.json({
                message: "Login successful",
                token: token,
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email
                }
            });
        });
});

app.listen(PORT, () => {
    console.log(` GlobeTrotter Server is running on port ${PORT}`);
    console.log(` Server URL: http://localhost:${PORT}`);
    console.log(` API endpoints available at: http://localhost:${PORT}/api/`);
});
