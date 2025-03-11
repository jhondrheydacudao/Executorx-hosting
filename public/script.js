const express = require("express");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");
const crypto = require("crypto");

const app = express();
const db = new sqlite3.Database("database.sqlite");

app.use(bodyParser.json());
app.use(express.static("public"));

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT, 
        email TEXT, 
        password TEXT, 
        ram INTEGER DEFAULT 4289, 
        cpu INTEGER DEFAULT 20, 
        disk INTEGER DEFAULT 10
    )
`);

function generateUserId() {
    return crypto.randomBytes(8).toString("hex");
}

app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "views", "signup.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "views", "dashboard.html")));

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    const userId = generateUserId();
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
        "INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)", 
        [userId, username, email, hashedPassword], 
        (err) => {
            if (err) return res.status(500).json({ message: "Error creating account" });
            res.json({ message: "Welcome to Executorx Hosting!", userId });
        }
    );
});

app.post("/login", (req, res) => {
    const { identifier, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ? OR email = ?", [identifier, identifier], async (err, user) => {
        if (err || !user) return res.status(401).json({ message: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: "Incorrect password" });

        res.json({ message: "Welcome to Executorx Hosting!", userId: user.id });
    });
});

app.get("/user-resources/:id", (req, res) => {
    const userId = req.params.id;

    db.get("SELECT ram, cpu, disk FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    });
});

app.post("/deploy/:id", (req, res) => {
    const userId = req.params.id;

    db.run("UPDATE users SET ram = 0, cpu = 0, disk = 0 WHERE id = ?", [userId], (err) => {
        if (err) return res.status(500).json({ message: "Deployment failed" });
        res.json({ message: "Server deployed! Resources set to 0." });
    });
});

app.listen(3000, () => console.log("Executorx Hosting is running at http://localhost:3000"));
