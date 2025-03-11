const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const db = new sqlite3.Database("database.db");

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    ram INTEGER DEFAULT 4289,
    cpu INTEGER DEFAULT 20,
    disk INTEGER DEFAULT 10
)`);

// Random user ID generator
const generateUserId = () => Math.random().toString(36).substr(2, 8);

// Nodemailer setup (replace with your email credentials)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: "your-email@gmail.com", pass: "your-password" }
});

// Serve HTML files
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "views/signup.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "views/login.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "views/dashboard.html")));

// User signup
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUserId();

    db.run("INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)",
        [userId, username, email, hashedPassword],
        (err) => {
            if (err) return res.status(400).json({ message: "User already exists" });

            // Send welcome email
            transporter.sendMail({
                from: "your-email@gmail.com",
                to: email,
                subject: "Welcome to Executorx Hosting!",
                text: `Hello ${username}, your account has been created!`
            });

            res.json({ message: "Account created", userId });
        });
});

// User login
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ? OR email = ?", [username, username], async (err, user) => {
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        res.json({ message: "Login successful", userId: user.id });
    });
});

// Get user resources
app.get("/user-resources/:userId", (req, res) => {
    const { userId } = req.params;
    db.get("SELECT ram, cpu, disk FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    });
});

// Deploy server (set resources to 0)
app.post("/deploy/:userId", (req, res) => {
    const { userId } = req.params;
    db.run("UPDATE users SET ram = 0, cpu = 0, disk = 0 WHERE id = ?", [userId], function (err) {
        if (err) return res.status(500).json({ message: "Error deploying server" });
        res.json({ message: "Server deployed! Resources set to 0." });
    });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
