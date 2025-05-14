document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.username !== "admin") {
      alert("Kun admin har adgang!");
      window.location.href = "index.html";
      return;
    }
  
    const allUsers = JSON.parse(localStorage.getItem("registeredUsers")) || [];
    let history = JSON.parse(localStorage.getItem("reservationHistory")) || [];
  
    const userList = document.getElementById("user-list");
    const reservationTable = document.getElementById("reservation-table");
    const userCount = document.querySelector('.user-count');
    const searchInput = document.getElementById('search-reservations');

    // Update user count
    userCount.textContent = `${allUsers.length} brugere`;
  
    // Render users
    allUsers.forEach(u => {
      const li = document.createElement("li");
      li.textContent = u.username;
      userList.appendChild(li);
    });
  
    // Render reservations
    function renderReservations(reservations) {
      reservationTable.innerHTML = '';
      reservations.forEach((res) => {
        const row = document.createElement("tr");
        const startDate = new Date(res.startTime);
        const endDate = new Date(res.endTime);
        
        row.innerHTML = `
          <td>${res.username}</td>
          <td>${res.locationName}</td>
          <td>${res.spotLabel}</td>
          <td>${formatDate(startDate)}</td>
          <td>${formatDate(endDate)}</td>
          <td>
            <button class="delete-btn" 
              data-username="${res.username}"
              data-location="${res.locationName}"
              data-spot="${res.spotLabel}"
              data-start="${res.startTime}"
              title="Slet reservation">
              ❌
            </button>
          </td>
        `;
        reservationTable.appendChild(row);
      });
    }

    // Initial render
    renderReservations(history);

    // Search functionality
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const filteredHistory = history.filter(res => 
        res.username.toLowerCase().includes(searchTerm) ||
        res.locationName.toLowerCase().includes(searchTerm) ||
        res.spotLabel.toLowerCase().includes(searchTerm)
      );
      renderReservations(filteredHistory);
    });
  
    // Handle deletion
    reservationTable.addEventListener("click", async (e) => {
      if (e.target.classList.contains("delete-btn")) {
        if (!confirm("Er du sikker på at du vil slette denne reservation?")) return;

        const button = e.target;
        const username = button.dataset.username;
        const locationName = button.dataset.location;
        const spotLabel = button.dataset.spot;
        const startTime = button.dataset.start;

        try {
          // First get all parking locations
          const response = await fetch('/api/parking');
          const locations = await response.json();
          
          // Find the location and spot
          const location = locations.find(loc => 
            loc.name.toLowerCase() === locationName.toLowerCase()
          );
          if (!location) {
            throw new Error(`Kunne ikke finde lokationen: ${locationName}`);
          }

          const spot = location.spots.find(s => 
            s.location.toLowerCase() === spotLabel.toLowerCase()
          );
          if (!spot) {
            throw new Error(`Kunne ikke finde pladsen: ${spotLabel}`);
          }

          // Release the spot
          const releaseResponse = await fetch(`/api/parking/${location.id}/${spot.id}/release`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin' })
          });

          if (!releaseResponse.ok) {
            const errorData = await releaseResponse.json();
            throw new Error(errorData.message || 'Fejl ved frigivelse af plads');
          }

          // Remove from history
          const reservationIndex = history.findIndex(res => 
            res.username === username && 
            res.locationName === locationName && 
            res.spotLabel === spotLabel &&
            res.startTime === startTime
          );

          if (reservationIndex !== -1) {
            history = history.filter((_, index) => index !== reservationIndex);
            localStorage.setItem("reservationHistory", JSON.stringify(history));
            
            // Re-render with current search term
            const searchTerm = searchInput.value.toLowerCase();
            const filteredHistory = history.filter(res => 
              res.username.toLowerCase().includes(searchTerm) ||
              res.locationName.toLowerCase().includes(searchTerm) ||
              res.spotLabel.toLowerCase().includes(searchTerm)
            );
            renderReservations(filteredHistory);
          }

          alert('Reservationen er blevet slettet');
        } catch (err) {
          console.error('Error releasing spot:', err);
          alert('Der opstod en fejl: ' + err.message);
        }
      }
    });
});

function formatDate(date) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
  