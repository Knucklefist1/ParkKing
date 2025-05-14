let reservationInProgress = false;
let currentSlide = 0;
let countdownInterval;
let hasExpiredAlerted = false; // For at undgå gentagne alerts

function showSlide(index) {
    const slides = document.querySelectorAll('.parking-slide');
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
}

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Du skal være logget ind for at få adgang til parkering.");
        window.location.href = "login.html";
        return;
    }

    checkLoginStatus();
    fetchParkingLocations();

    document.getElementById('prev-area').onclick = () => {
        currentSlide = (currentSlide - 1 + document.querySelectorAll('.parking-slide').length) % document.querySelectorAll('.parking-slide').length;
        showSlide(currentSlide);
    };

    document.getElementById('next-area').onclick = () => {
        currentSlide = (currentSlide + 1) % document.querySelectorAll('.parking-slide').length;
        showSlide(currentSlide);
    };
});

function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem("user"));
    const loginLink = document.getElementById("login-link");
    const logoutBtn = document.getElementById("logout-btn");
    const warning = document.getElementById("login-warning");

    if (user) {
        if (loginLink) loginLink.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline-block";
        if (warning) warning.style.display = "none";
    } else {
        if (loginLink) loginLink.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (warning) warning.style.display = "block";
    }
}

function fetchParkingLocations() {
    fetch('/api/parking')
        .then(response => response.json())
        .then(data => {
            const user = JSON.parse(localStorage.getItem("user"));
            const carousel = document.getElementById('parking-carousel');
            carousel.innerHTML = '';

            const userReservedSpot = data.flatMap(loc => loc.spots).find(s => s.reservedBy === user.username);

            data.forEach((location, index) => {
                const isWork = location.name.toLowerCase() === "arbejde";
                const slide = document.createElement('div');
                slide.classList.add('parking-slide');
                if (index === 0) slide.classList.add('active');

                const wrapper = document.createElement('div');
                wrapper.classList.add('parking-area-wrapper');

                const section = document.createElement('div');
                section.classList.add('parking-area');
                section.innerHTML = `
                    <h2>${location.name}</h2>
                    <p>Ledige: <span class="ledige-${location.id}"></span> | Optagede: <span class="optagede-${location.id}"></span></p>
                    <div class="parking-road"></div>
                    <div class="parking-grid ${isWork ? "work" : "home"}" id="grid-${location.id}"></div>
                    <div class="parking-road"></div>
                `;

                wrapper.appendChild(section);
                slide.appendChild(wrapper);
                carousel.appendChild(slide);

                renderParkingSpots(location, isWork, user, userReservedSpot);
            });

            if (countdownInterval) clearInterval(countdownInterval);
            startLiveCountdowns();
        });
}

function renderParkingSpots(location, isWork, user, userReservedSpot) {
    const grid = document.getElementById(`grid-${location.id}`);
    let ledige = 0;
    let optagede = 0;

    grid.innerHTML = '';

    const topRow = document.createElement('div');
    topRow.classList.add('parking-row');
    const bottomRow = document.createElement('div');
    bottomRow.classList.add('parking-row');
    const midRoad = document.createElement('div');
    midRoad.classList.add('parking-road');

    location.spots.forEach((spot, index) => {
        const div = document.createElement('div');
        div.classList.add('parking-spot', isWork ? 'work' : 'home');

        const isMine = spot.reservedBy === user.username;
        const isTakenByOthers = spot.status === "Optaget" && !isMine;

        if (spot.status === "Ledig") {
            div.classList.add("available");
            ledige++;
        } else {
            div.classList.add("reserved");
            optagede++;
        }

        if (isMine) div.classList.add("is-mine");

        div.id = `spot-${location.id}-${spot.id}`;
        div.setAttribute("data-label", spot.location);
        div.dataset.location = spot.location;
        div.dataset.reservedUntil = spot.reservedUntil || "";
        div.dataset.locationId = location.id;
        div.dataset.spotId = spot.id;
        div.dataset.startTime = spot.reservedFrom || "";

        const overlay = document.createElement("div");
        overlay.classList.add("overlay-label");
        overlay.innerHTML = `<strong>${spot.location}</strong>`;
        div.appendChild(overlay);

        if (spot.status === "Optaget") {
            const img = document.createElement("img");
            img.src = "images/Caricon.png";
            img.alt = "Bil";
            img.classList.add("car-icon");
            div.appendChild(img);
        }

        div.title = isMine ? "Du har reserveret denne plads" : (spot.reservedBy ? `Reserveret af: ${spot.reservedBy}` : "Klik for at reservere");

        const isDisabled = (userReservedSpot && !isMine) || isTakenByOthers;
        if (isDisabled) {
            div.classList.add("disabled");
        } else {
            div.onclick = () => toggleReservation(location.id, spot.id);
        }

        const halfway = Math.ceil(location.spots.length / 2);
        if (index < halfway) {
            topRow.appendChild(div);
        } else {
            bottomRow.appendChild(div);
        }

        if (isMine && spot.reservedUntil) {
            const sidebar = document.getElementById("reservation-details");
            const expiresAt = new Date(spot.reservedUntil);
            const now = new Date();
            const minutesLeft = Math.max(0, Math.floor((expiresAt - now) / 60000));

            sidebar.innerHTML = `
                <p><strong>Lokation:</strong> ${location.name}</p>
                <p><strong>Plads:</strong> ${spot.location}</p>
                <p><strong>Udløber om:</strong> <span id="live-countdown">${minutesLeft} min</span></p>
            `;
        }
    });

    grid.appendChild(topRow);
    grid.appendChild(midRoad);
    grid.appendChild(bottomRow);

    document.querySelector(`.ledige-${location.id}`).innerText = ledige;
    document.querySelector(`.optagede-${location.id}`).innerText = optagede;
}

function startLiveCountdowns() {
    setInterval(() => {
        const now = new Date();
        const user = JSON.parse(localStorage.getItem("user"));
        const countdownDisplay = document.getElementById("live-countdown");

        if (!user || !countdownDisplay) return;

        const reservedSpot = document.querySelector(`.parking-spot.is-mine`);

        if (reservedSpot) {
            const reservedUntil = reservedSpot.dataset.reservedUntil;
            if (!reservedUntil) return;

            const expiresAt = new Date(reservedUntil);
            const diff = Math.floor((expiresAt - now) / 1000);

            if (diff <= 0 && !hasExpiredAlerted) {
                countdownDisplay.innerText = "Udløbet";
                alert("Din reservation er udløbet!");
                hasExpiredAlerted = true;

                updateReservationDetails("Ingen aktiv reservation");
                releaseReservedSpot(reservedSpot);
            } else if (diff > 0) {
                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                countdownDisplay.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
            }
        }
    }, 1000);
}

function updateReservationDetails(message) {
    const reservationDetails = document.getElementById("reservation-details");
    if (reservationDetails) {
        reservationDetails.innerHTML = `<p>${message}</p>`;
    }
}

function releaseReservedSpot(spot) {
    const locationId = spot.dataset.locationId;
    const spotId = spot.dataset.spotId;
    const startTime = spot.dataset.startTime;

    if (!locationId || !spotId) {
        console.error("LocationId eller SpotId mangler!");
        return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    const endTime = new Date().toISOString();
    const history = JSON.parse(localStorage.getItem("reservationHistory")) || [];

    history.push({
        username: user.username,
        locationName: spot.closest(".parking-area").querySelector("h2").textContent,
        spotLabel: spot.dataset.label,
        startTime: startTime || new Date().toISOString(),
        endTime
    });

    localStorage.setItem("reservationHistory", JSON.stringify(history));

    fetch(`/api/parking/${locationId}/${spotId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
    })
    .then(res => res.json())
    .then(data => {
        console.log('Pladsen er nu frigivet:', data);
        fetchParkingLocations();
    })
    .catch(err => console.error('Fejl ved frigivelse af plads:', err));
}

function toggleReservation(locationId, spotId) {
    if (reservationInProgress) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const spotDiv = document.getElementById(`spot-${locationId}-${spotId}`);
    const isReserved = spotDiv.classList.contains("reserved");
    const endpoint = isReserved ? "release" : "reserve";

    const timeInput = document.getElementById("reservation-time");
    let durationMinutes = null;
    let endTime = null;

    if (!isReserved) {
        const selectedTime = timeInput.value;
        if (!selectedTime) {
            alert("Vælg et sluttidspunkt for reservationen!");
            return;
        }

        const now = new Date();
        const [hour, minute] = selectedTime.split(":").map(Number);
        endTime = new Date(now);
        endTime.setHours(hour, minute, 0, 0);

        if (endTime <= now) {
            endTime.setDate(endTime.getDate() + 1);
        }

        durationMinutes = Math.ceil((endTime - now) / 60000);
    }

    reservationInProgress = true;

    fetch(`/api/parking/${locationId}/${spotId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: user.username,
            ...(durationMinutes && { durationMinutes })
        })
    })
    .then(res => {
        if (!res.ok) return res.json().then(data => { throw new Error(data.message); });
        return res.json();
    })
    .then(() => {
        // Hvis det var en reservation, gem historik
        if (!isReserved) {
            const now = new Date();
            const locationName = document.querySelector(`#grid-${locationId}`)?.closest(".parking-area")?.querySelector("h2")?.innerText || "Ukendt";
            const spotLabel = spotDiv.getAttribute("data-label");

            const history = JSON.parse(localStorage.getItem("reservationHistory")) || [];
            history.push({
                username: user.username,
                locationName,
                spotLabel,
                startTime: now.toISOString(),
                endTime: endTime.toISOString()
            });
            localStorage.setItem("reservationHistory", JSON.stringify(history));
        }

        fetchParkingLocations(); // Genindlæs visning

        if (endpoint === "release") {
            updateReservationDetails("Ingen aktiv reservation");
        }
    })
    .catch(err => {
        alert("❌ Fejl: " + err.message);
    })
    .finally(() => {
        reservationInProgress = false;
    });
}
