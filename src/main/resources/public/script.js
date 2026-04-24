document.addEventListener("DOMContentLoaded", () => {
    fetchState();
    fetchAccessories();
});

let currentEndpoint = "";
let currentToggleAccId = "";
let currentToggleAccType = "";
let washerCountdownInterval = null;

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
        // Fetch original to update states
        const response = await fetch(`/api/${currentEndpoint}`, { method: 'POST' });
        const data = await response.json();

        // Check each light's toggle switch within the scene modal
        const accRes = await fetch('/api/accessories');
        const accData = await accRes.json();

        for (let acc of accData) {
            // We can now override ALL accessories, not just lights
            const overrideToggle = document.getElementById(`scene-acc-override-${acc.id}`);
            if (overrideToggle) {
                const overrideState = overrideToggle.checked;
                // Only fetch if the state needs to change compared to what the backend just did
                // To be safe and ensure the user's manual override applies, we just send it.
                await fetch('/api/accessories/toggle', {
                    method: 'POST',
                    body: JSON.stringify({ id: acc.id, state: overrideState }),
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        updateUIState(data);
        fetchAccessories();
        closeSceneModal();
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
                    <div class="card-subtitle">${acc.room} · <span id="status-desc-${acc.id}">${statusText}</span></div>
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
    if (type === 'WashingMachine' && isOn) {
        return 'Running';
    }
    return isOn ? 'On' : 'Off';
}


// --- Accessory Toggle Modal Logic ---

function openToggleAccessoryModal(accString) {
    const acc = JSON.parse(accString.replace(/&quot;/g, '"'));
    currentToggleAccId = acc.id;
    currentToggleAccType = acc.type;

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

    toggleWasherTimerOptions(); // Show/hide timer based on type and status

    document.getElementById('toggle-accessory-modal').classList.remove('hidden');
}

function closeToggleAccessoryModal() {
    document.getElementById('toggle-accessory-modal').classList.add('hidden');
    currentToggleAccId = "";
    currentToggleAccType = "";

    // Stop countdown in modal if closed
    if (washerCountdownInterval) {
        clearInterval(washerCountdownInterval);
        washerCountdownInterval = null;
    }
}

function toggleWasherTimerOptions() {
    const timerContainer = document.getElementById('washer-timer-container');
    const countdownContainer = document.getElementById('washer-countdown-container');
    const switchInput = document.getElementById('toggle-acc-switch');

    // Only show timer if it's a Washing Machine AND it's being turned ON
    if (currentToggleAccType === 'WashingMachine') {
        if (switchInput.checked) {
            timerContainer.style.display = 'flex';
            countdownContainer.style.display = 'none'; // hide countdown while setting
        } else {
            timerContainer.style.display = 'none';
            countdownContainer.style.display = 'none';
        }
    } else {
        timerContainer.style.display = 'none';
        countdownContainer.style.display = 'none';
    }
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

        // If it's a washing machine and turned ON, start the timer logic locally for UI feedback
        if (currentToggleAccType === 'WashingMachine' && newState) {
            const minutes = parseInt(document.getElementById('washer-timer-slider').value);
            startWasherTimer(currentToggleAccId, minutes);
        } else if (currentToggleAccType === 'WashingMachine' && !newState) {
            // Stop any running timer for this machine
            const statusSpan = document.getElementById(`status-desc-${currentToggleAccId}`);
            if(statusSpan) statusSpan.innerText = 'Off';
        }

        fetchAccessories();
        closeToggleAccessoryModal();
    } catch (error) {
        console.error("Failed to toggle accessory", error);
    }
}

// Local mock countdown logic for the Washing Machine
function startWasherTimer(accId, minutes) {
    let totalSeconds = minutes * 60;

    // Quick interval just for UI demo purposes (runs much faster than real time for testing)
    // For a real app, this would be handled server-side
    const demoSpeedMultiplier = 60; // 1 second real = 1 minute simulation

    const timerInterval = setInterval(async () => {
        totalSeconds--;

        // Find the card's subtitle to update it dynamically without re-rendering everything
        const statusSpan = document.getElementById(`status-desc-${accId}`);
        if (statusSpan) {
            const m = Math.floor(totalSeconds / 60);
            const s = totalSeconds % 60;
            statusSpan.innerText = `Running (${m}m ${s}s left)`;
        }

        if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            if (statusSpan) statusSpan.innerText = 'Done!';

            // Automatically turn off the washing machine when done
            try {
                await fetch('/api/accessories/toggle', {
                    method: 'POST',
                    body: JSON.stringify({ id: accId, state: false }),
                    headers: { 'Content-Type': 'application/json' }
                });
                // Small delay then refresh
                setTimeout(() => fetchAccessories(), 2000);
            } catch (e) { console.error(e); }
        }
    }, 1000 / demoSpeedMultiplier);
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
async function openModal(modeName) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const icon = document.getElementById('modal-icon');
    const desc = document.getElementById('modal-desc');

    const tempSlider = document.getElementById('thermostat-slider');
    const tempValue = document.getElementById('temp-value');
    const sceneLightsContainer = document.getElementById('scene-lights-container');

    sceneLightsContainer.innerHTML = '<span style="padding: 10px;">Loading accessories...</span>';

    // Customize Modal based on the selected mode
    if (modeName === 'Home') {
        icon.innerText = "🏡";
        title.innerText = "Arrive Home";
        desc.innerText = "Your home will prepare for your arrival.";
        tempSlider.value = 22;
    } else if (modeName === 'Away') {
        icon.innerText = "🚶";
        title.innerText = "Leave Home";
        desc.innerText = "Securing your home while you are away.";
        tempSlider.value = 18;
    } else if (modeName === 'Night') {
        icon.innerText = "🌙";
        title.innerText = "Good Night";
        desc.innerText = "Setting the scene for a good night's sleep.";
        tempSlider.value = 20;
    } else if (modeName === 'Vacation') {
        icon.innerText = "✈️";
        title.innerText = "Vacation";
        desc.innerText = "Entering high security and energy saving mode.";
        tempSlider.value = 15;
    }

    tempValue.innerText = tempSlider.value + "°C";

    // Fetch accessories and populate ALL accessories in the override section
    try {
        const res = await fetch('/api/accessories');
        const accessories = await res.json();

        sceneLightsContainer.innerHTML = '';
        let accCount = 0;

        accessories.forEach(acc => {
            accCount++;

            // Determine default state proposal for this scene
            let proposedState = false;
            if (modeName === 'Home') {
                if (acc.type === 'Door') proposedState = false; // Unlocked
                else proposedState = true; // All others on
            } else if (modeName === 'Away') {
                if (acc.type === 'Door') proposedState = true; // Locked
                else proposedState = false; // Everything off
            } else if (modeName === 'Night') {
                if (acc.type === 'Door') proposedState = true; // Locked
                else if (acc.type === 'Light' && (acc.room === 'Bedroom' || acc.room === 'Outside')) proposedState = true;
                else proposedState = false;
            } else if (modeName === 'Vacation') {
                if (acc.type === 'Door') proposedState = true; // Locked
                else if (acc.type === 'Light' && acc.room === 'Living Room') proposedState = true;
                else proposedState = false;
            }

            const checkedAttr = proposedState ? 'checked' : '';
            const accIcon = getIconForType(acc.type);

            // For doors, explain what checked means
            const extraLabel = acc.type === 'Door' ? '<span style="font-size: 10px; color: var(--green); margin-left: 5px;">(Checked = Locked)</span>' : '';

            const rowHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid rgba(128,128,128,0.1);">
                    <span style="font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <span>${accIcon}</span>
                        ${acc.name}
                        <span style="color: var(--text-secondary); font-size: 12px;">(${acc.room})</span>
                        ${extraLabel}
                    </span>
                    <label class="switch" style="transform: scale(0.8); margin: 0;">
                        <input type="checkbox" id="scene-acc-override-${acc.id}" ${checkedAttr}>
                        <span class="slider round"></span>
                    </label>
                </div>
            `;
            sceneLightsContainer.insertAdjacentHTML('beforeend', rowHtml);
        });

        if (accCount === 0) {
            sceneLightsContainer.innerHTML = '<span style="color: var(--text-secondary); font-size: 14px; padding: 10px;">No accessories available.</span>';
        }
    } catch (e) {
        console.error(e);
        sceneLightsContainer.innerHTML = '<span style="color: red; font-size: 14px; padding: 10px;">Error loading accessories.</span>';
    }

    modal.classList.remove('hidden');
}

function closeSceneModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}
