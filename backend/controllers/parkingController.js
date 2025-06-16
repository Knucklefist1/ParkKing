const parkingLocations = require('../models/parkingModel');

setInterval(() => {
    const now = new Date();
    parkingLocations.forEach(location => {
        location.spots.forEach(spot => {
            if (spot.status === "Optaget" && spot.reservedUntil) {
                const expiresAt = new Date(spot.reservedUntil);
                if (now >= expiresAt) {
                    console.log(`⏳ Frigiver udløbet plads ${spot.location}`);
                    spot.status = "Ledig";
                    spot.reservedBy = null;
                    spot.reservedUntil = null;
                }
            }
        });
    });
}, 60 * 1000); // Tjek hvert minut

//  Hent alle parkeringslokationer
exports.getAllParkingLocations = (req, res) => {
    res.json(parkingLocations);
};

//  Reserver en plads
exports.reserveParkingSpot = (req, res) => {
    const { locationId, spotId } = req.params;
    const { username, durationMinutes } = req.body;

    const location = parkingLocations.find(loc => loc.id == locationId);
    if (!location) return res.status(404).json({ message: "Lokation ikke fundet" });

    const spot = location.spots.find(s => s.id == spotId);
    if (!spot) return res.status(404).json({ message: "Parkeringsplads ikke fundet" });

    if (spot.status === "Optaget") {
        return res.status(400).json({ message: "Pladsen er allerede optaget" });
    }

    // 🔐 Tjek om brugeren allerede har reserveret i dette område
    const userHasSpotInThisLocation = location.spots.some(s => s.reservedBy === username);
    if (userHasSpotInThisLocation) {
        return res.status(400).json({ message: "Du har allerede reserveret en plads i dette område" });
    }

    //  Reserver og gem udløbstidspunkt
    const expiresAt = new Date(Date.now() + (durationMinutes || 60) * 60000); // fallback til 60 min
    spot.status = "Optaget";
    spot.reservedBy = username;
    spot.reservedUntil = expiresAt.toISOString();

    res.json({ message: `Plads ${spot.location} er nu reserveret til ${expiresAt.toLocaleTimeString()}!`, spot });
};

// Frigør en plads
exports.releaseParkingSpot = (req, res) => {
    const { locationId, spotId } = req.params;
    const { username } = req.body;

    const location = parkingLocations.find(loc => loc.id == locationId);
    if (!location) return res.status(404).json({ message: "Lokation ikke fundet" });

    const spot = location.spots.find(s => s.id == spotId);
    if (!spot) return res.status(404).json({ message: "Parkeringsplads ikke fundet" });

    if (spot.status === "Ledig") {
        return res.status(400).json({ message: "Pladsen er allerede ledig" });
    }

    // Allow admin to release any spot, but regular users can only release their own
    if (username !== 'admin' && spot.reservedBy !== username) {
        return res.status(403).json({ message: "Du må kun frigive din egen plads" });
    }

    // Frigør
    spot.status = "Ledig";
    spot.reservedBy = null;
    spot.reservedUntil = null;

    res.json({ message: `Plads ${spot.location} er nu frigivet!`, spot });
};
