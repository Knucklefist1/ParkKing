const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Session håndtering
app.use(session({
    secret: 'hemmeligkode',
    resave: false,
    saveUninitialized: true
}));

// Server statiske filer
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/home.html'));
});


// Importér ruter
const parkingRoutes = require('./routes/parkingRoutes'); 
const authRoutes = require('./routes/authRoutes');

app.use('/api/parking', parkingRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => console.log(`🚀 Server kører på http://localhost:${PORT}`));
