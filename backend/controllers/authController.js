const bcrypt = require('bcryptjs');
const users = require('../models/userModel');
const session = require('express-session');

// Login bruger
exports.login = async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);

    if (!user) {
        return res.status(400).json({ message: "Bruger ikke fundet" });
    }

    // Tjek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Forkert adgangskode" });
    }

    // Opret session
    req.session.user = user;
    res.json({ message: "Login succesfuldt!", user });
};

// Log ud bruger
exports.logout = (req, res) => {
    req.session.destroy();
    res.json({ message: "Du er nu logget ud!" });
};



// Registrer ny bruger
exports.signup = async (req, res) => {
    const { username, password } = req.body;

    // Tjek om brugeren allerede findes
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(400).json({ message: "Brugernavn er allerede taget" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Opret bruger
    const newUser = { id: users.length + 1, username, password: hashedPassword };
    users.push(newUser);

    res.json({ message: "Bruger oprettet!", user: newUser });
};
