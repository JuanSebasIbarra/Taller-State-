document.addEventListener("DOMContentLoaded", () => {
    fetchState();
    fetchAccessories();
});

let currentEndpoint = "";
let currentToggleAccId = "";

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

// Fetches all accessories from backend
async function fetchAccessories() {
    try {
        const response = await fetch('/api/accessories');
        const data = await response.json();
        renderAccessories(data);
    } catch (error) {
        console.error('Error fetching accessories:', error);
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

        // Changing modes affects accessories, so we must refresh the UI
        fetchAccessories();

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

// Render accessories in the UI
function renderAccessories(accessories) {
    const grid = document.getElementById('accessories-grid');
    grid.innerHTML = '';

    if (accessories.length === 0) {
        grid.innerHTML = '<p class="status-summary">No accessories found.</p>';
        return;
    }

    accessories.forEach(acc => {
        const isActive = acc.isOn ? 'active-state' : '';
        const statusText = getStatusText(acc.type, acc.isOn);
        const icon = getIconForType(acc.type);
        const cardClass = getCardClass(acc.type);

        // Convert the object to a string safely to pass into inline onclick
        const accJson = JSON.stringify(acc).replace(/"/g, '&quot;');

        const cardHtml = `
            <div class="card accessory-card ${cardClass} ${isActive}" onclick="openToggleAccessoryModal('${accJson}')">
                <button class="delete-btn" onclick="deleteAccessory(event, '${acc.id}')">✕</button>
                <div class="icon-wrapper">${icon}</div>
                <div>
                    <div class="card-title">${acc.name}</div>
                    <div class="card-subtitle">${acc.room} · ${statusText}</div>
                </div>
            </div>
        `;

        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function getIconForType(type) {
    switch (type) {
        case 'Light': return '💡';
        case 'WashingMachine': return '🧺';
        case 'Kitchen': return '🍳';
        case 'Door': return '🚪';
        default: return '🔌';
    }
}

function getCardClass(type) {
    switch (type) {
        case 'Light': return 'acc-light';
        case 'WashingMachine': return 'acc-washingmachine';
        case 'Kitchen': return 'acc-kitchen';
        case 'Door': return 'acc-door';
        default: return 'acc-light';
    }
}

function getStatusText(type, isOn) {
    if (type === 'Door') {
        return isOn ? 'Locked' : 'Unlocked';
    }
    return isOn ? 'On' : 'Off';
}


// --- Accessory Toggle Modal Logic ---

function openToggleAccessoryModal(accString) {
    const acc = JSON.parse(accString.replace(/&quot;/g, '"'));
    currentToggleAccId = acc.id;

    document.getElementById('toggle-acc-name').innerText = acc.name;
    document.getElementById('toggle-acc-room').innerText = acc.room;
    document.getElementById('toggle-acc-icon').innerText = getIconForType(acc.type);

    const statusLabel = document.getElementById('toggle-acc-status-text');
    const switchInput = document.getElementById('toggle-acc-switch');

    if (acc.type === 'Door') {
        statusLabel.innerText = "Lock Door";
    } else {
        statusLabel.innerText = "Power";
    }

    switchInput.checked = acc.isOn;

    document.getElementById('toggle-accessory-modal').classList.remove('hidden');
}

function closeToggleAccessoryModal() {
    document.getElementById('toggle-accessory-modal').classList.add('hidden');
    currentToggleAccId = "";
}

async function applyAccessoryToggle() {
    if (!currentToggleAccId) return;

    const switchInput = document.getElementById('toggle-acc-switch');
    const newState = switchInput.checked;

    try {
        await fetch('/api/accessories/toggle', {
            method: 'POST',
            body: JSON.stringify({ id: currentToggleAccId, state: newState }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchAccessories();
        closeToggleAccessoryModal();
    } catch (error) {
        console.error("Failed to toggle accessory", error);
    }
}


// Delete accessory
async function deleteAccessory(event, id) {
    event.stopPropagation(); // Prevent toggling the accessory when clicking delete

    try {
        await fetch('/api/accessories', {
            method: 'DELETE',
            body: JSON.stringify({ id: id }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchAccessories();
    } catch (error) {
        console.error("Failed to delete accessory", error);
    }
}

// Add new accessory modal logic
function openAddAccessoryModal() {
    document.getElementById('add-accessory-modal').classList.remove('hidden');
}

function closeAddAccessoryModal() {
    document.getElementById('add-accessory-modal').classList.add('hidden');
    document.getElementById('new-acc-room').value = '';
    document.getElementById('new-acc-name').value = '';
    document.getElementById('new-acc-type').value = 'Light';
}

// Submit new accessory
async function submitNewAccessory() {
    const type = document.getElementById('new-acc-type').value;
    const room = document.getElementById('new-acc-room').value;
    const name = document.getElementById('new-acc-name').value;

    if (!room || !name) {
        alert("Please fill in all fields");
        return;
    }

    try {
        await fetch('/api/accessories', {
            method: 'POST',
            body: JSON.stringify({ type: type, room: room, name: name }),
            headers: { 'Content-Type': 'application/json' }
        });
        closeAddAccessoryModal();
        fetchAccessories();
    } catch (error) {
        console.error("Failed to add accessory", error);
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
        doorsToggle.checked = false; // doors unlocked
        tempSlider.value = 22;
    } else if (modeName === 'Away') {
        icon.innerText = "🚶";
        title.innerText = "Leave Home";
        desc.innerText = "Securing your home while you are away.";
        lightsToggle.checked = false;
        doorsToggle.checked = true; // doors locked
        tempSlider.value = 18;
    } else if (modeName === 'Night') {
        icon.innerText = "🌙";
        title.innerText = "Good Night";
        desc.innerText = "Setting the scene for a good night's sleep.";
        lightsToggle.checked = false;
        doorsToggle.checked = true; // doors locked
        tempSlider.value = 20;
    } else if (modeName === 'Vacation') {
        icon.innerText = "✈️";
        title.innerText = "Vacation";
        desc.innerText = "Entering high security and energy saving mode.";
        lightsToggle.checked = false;
        doorsToggle.checked = true; // doors locked
        tempSlider.value = 15;
    }

    tempValue.innerText = tempSlider.value + "°C";

    modal.classList.remove('hidden');
}

function closeModal() {
    applyStateChange();
    document.getElementById('modal-overlay').classList.add('hidden');
}
