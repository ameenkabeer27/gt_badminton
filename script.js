document.addEventListener('DOMContentLoaded', () => {
    loadGroups(); // Load any saved groups on page load
    updateTotalTeams();
});

function createGroups() {
    const numGroups = parseInt(document.getElementById('num-groups').value);
    const container = document.getElementById('groups-container');
    container.innerHTML = ''; // Clear existing groups

    for (let i = 1; i <= numGroups; i++) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group';
        groupDiv.innerHTML = `
            <h3>Group ${String.fromCharCode(64 + i)}</h3> <!-- A, B, C, etc. -->
            <input type="text" placeholder="Team Name" id="team-input-${i}">
            <button onclick="addTeam(${i})">Add Team</button>
            <ul id="team-list-${i}"></ul>
        `;
        container.appendChild(groupDiv);
    }

    localStorage.setItem('numGroups', numGroups); // Save number of groups
    loadTeams(); // Load any saved teams
}

function addTeam(groupIndex) {
    const input = document.getElementById(`team-input-${groupIndex}`);
    const teamName = input.value.trim();
    if (!teamName) return;

    const list = document.getElementById(`team-list-${groupIndex}`);
    const li = document.createElement('li');
    li.textContent = teamName;
    list.appendChild(li);

    input.value = ''; // Clear input

    saveTeam(groupIndex, teamName);
    updateTotalTeams();
}

function saveTeam(groupIndex, teamName) {
    let groups = JSON.parse(localStorage.getItem('groups')) || {};
    if (!groups[groupIndex]) groups[groupIndex] = [];
    groups[groupIndex].push(teamName);
    localStorage.setItem('groups', JSON.stringify(groups));
}

function loadGroups() {
    const savedNum = localStorage.getItem('numGroups');
    if (savedNum) {
        document.getElementById('num-groups').value = savedNum;
        createGroups(); // Recreate groups
    }
}

function loadTeams() {
    const groups = JSON.parse(localStorage.getItem('groups')) || {};
    for (let i = 1; i <= Object.keys(groups).length; i++) {
        const list = document.getElementById(`team-list-${i}`);
        if (list && groups[i]) {
            groups[i].forEach(team => {
                const li = document.createElement('li');
                li.textContent = team;
                list.appendChild(li);
            });
        }
    }
    updateTotalTeams();
}

function updateTotalTeams() {
    const groups = JSON.parse(localStorage.getItem('groups')) || {};
    let total = 0;
    for (let group in groups) {
        total += groups[group].length;
    }
    document.getElementById('total-teams').textContent = total;
}
