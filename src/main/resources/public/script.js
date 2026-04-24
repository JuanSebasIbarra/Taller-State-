document.addEventListener("DOMContentLoaded", () => {
    fetchState();
    fetchLights();
});

let currentEndpoint = "";

// Fetches the current state from the backend
async function fetchState() {
    try {
        const response = await fetch('/api/state');
        const data = await response.json();
        updateUIState(data);
    } catch (error) {
        console.error('Error fetching state:', error);
        document.getElementById('current-status-text').innerText = "Home not responding.";
    }
}

// Fetches all lights from backend
async function fetchLights() {
    try {
        const response = await fetch('/api/lights');
        const data = await response.json();
        renderLights(data);
    } catch (error) {
        console.error('Error fetching lights:', error);
    }
}

// Shows the modal first to confirm interactions
function activateMode(endpoint, modeName) {
    currentEndpoint = endpoint;
    openModal(modeName);
}

// Send actual state change to backend after user finishes with modal
async function applyStateChange() {
    if (!currentEndpoint) return;
    try {
        const response = await fetch(`/api/${currentEndpoint}`, { method: 'POST' });
        const data = await response.json();
        updateUIState(data);

        // Changing modes affects lights, so we must refresh the lights UI
        fetchLights();

        closeModal();
    } catch (error) {
        console.error('Error changing state:', error);
    }
}

// Update the UI styling to match Apple Home active states
function updateUIState(data) {
    document.getElementById('current-status-text').innerText = data.status;

    // Reset all cards
    document.querySelectorAll('.scene-card').forEach(card => card.classList.remove('active-state'));

    // Set active card and theme
    if(data.state === 'HomeState') {
        document.getElementById('card-home').classList.add('active-state');
        setTheme('light');
    }
    else if(data.state === 'AwayState') {
        document.getElementById('card-away').classList.add('active-state');
        setTheme('light');
    }
    else if(data.state === 'NightState') {
        document.getElementById('card-night').classList.add('active-state');
        setTheme('dark');
    }
    else if(data.state === 'VacationState') {
        document.getElementById('card-vacation').classList.add('active-state');
        setTheme('light');
    }
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Render lights in the UI
function renderLights(lights) {
    const grid = document.getElementById('lights-grid');
    grid.innerHTML = '';

    if (lights.length === 0) {
        grid.innerHTML = '<p class="status-summary">No accessories found.</p>';
        return;
    }

    lights.forEach(light => {
        const isActive = light.isOn ? 'active-state' : '';
        const statusText = light.isOn ? 'On' : 'Off';

        const cardHtml = `
            <div class="card light-card ${isActive}" onclick="toggleLight('${light.id}', ${!light.isOn})">
                <button class="delete-btn" onclick="deleteLight(event, '${light.id}')">✕</button>
                <div class="icon-wrapper">💡</div>
                <div>
                    <div class="card-title">${light.name}</div>
                    <div class="card-subtitle">${light.room} · ${statusText}</div>
                </div>
            </div>
        `;

        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// Toggle light ON/OFF
async function toggleLight(id, newState) {
    try {
        await fetch('/api/lights/toggle', {
            method: 'POST',
            body: JSON.stringify({ id: id, state: newState }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchLights();
    } catch (error) {
        console.error("Failed to toggle light", error);
    }
}

// Delete light
async function deleteLight(event, id) {
    event.stopPropagation(); // Prevent toggling the light when clicking delete

    try {
        await fetch('/api/lights', {
            method: 'DELETE',
            body: JSON.stringify({ id: id }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchLights();
    } catch (error) {
        console.error("Failed to delete light", error);
    }
}

// Open modal for adding new light
function openAddLightModal() {
    document.getElementById('add-light-modal').classList.remove('hidden');
}

function closeAddLightModal() {
    document.getElementById('add-light-modal').classList.add('hidden');
    document.getElementById('new-light-room').value = '';
    document.getElementById('new-light-name').value = '';
}

// Add new light
async function submitNewLight() {
    const room = document.getElementById('new-light-room').value;
    const name = document.getElementById('new-light-name').value;

    if (!room || !name) {
        alert("Please fill in both fields");
        return;
    }

    try {
        await fetch('/api/lights', {
            method: 'POST',
            body: JSON.stringify({ room: room, name: name }),
            headers: { 'Content-Type': 'application/json' }
        });
        closeAddLightModal();
        fetchLights();
    } catch (error) {
        console.error("Failed to add light", error);
    }
}

// Modal Logic for Scenes
function openModal(modeName) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const icon = document.getElementById('modal-icon');
    const desc = document.getElementById('modal-desc');

    const lightsToggle = document.getElementById('lights-toggle');
    const doorsToggle = document.getElementById('doors-toggle');
    const tempSlider = document.getElementById('thermostat-slider');
    const tempValue = document.getElementById('temp-value');

    // Customize Modal based on the selected mode
    if (modeName === 'Home') {
        icon.innerText = "🏡";
        title.innerText = "Arrive Home";
        desc.innerText = "Your home will prepare for your arrival.";
        lightsToggle.checked = true;
        doorsToggle.checked = false;
        tempSlider.value = 22;
    } else if (modeName === 'Away') {
        icon.innerText = "🚶";
        title.innerText = "Leave Home";
        desc.innerText = "Securing your home while you are away.";
        lightsToggle.checked = false;
        doorsToggle.checked = true;
        tempSlider.value = 18;
    } else if (modeName === 'Night') {
        icon.innerText = "🌙";
        title.innerText = "Good Night";
        desc.innerText = "Setting the scene for a good night's sleep.";
        lightsToggle.checked = false;
        doorsToggle.checked = true;
        tempSlider.value = 20;
    } else if (modeName === 'Vacation') {
        icon.innerText = "✈️";
        title.innerText = "Vacation";
        desc.innerText = "Entering high security and energy saving mode.";
        lightsToggle.checked = false;
        doorsToggle.checked = true;
        tempSlider.value = 15;
    }

    tempValue.innerText = tempSlider.value + "°C";

    modal.classList.remove('hidden');
}

function closeModal() {
    applyStateChange();
    document.getElementById('modal-overlay').classList.add('hidden');
}
