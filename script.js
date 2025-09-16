document.addEventListener('DOMContentLoaded', () => {
    loadGroups();
    updateTotalTeams();
});

function createGroups() {
    const numGroups = parseInt(document.getElementById('num-groups').value);
    const container = document.getElementById('groups-container');
    container.innerHTML = '';

    for (let i = 1; i <= numGroups; i++) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group';
        groupDiv.innerHTML = `
            <h3 id="group-heading-${i}">Group ${String.fromCharCode(64 + i)}</h3>
            <input type="text" name="group-name" placeholder="Enter Group Name (e.g., Group Elite)" id="group-name-${i}" oninput="saveAndUpdateGroupName(${i}, this.value)">
            <input type="text" placeholder="Team Name" id="team-input-${i}">
            <button onclick="addTeam(${i})">Add Team</button>
            <ul id="team-list-${i}"></ul>
            <button class="generate-fixtures" onclick="generateFixtures(${i})">Generate Fixtures</button>
            <div id="fixtures-${i}"></div>
            <button class="update-scores" onclick="updateScores(${i})">Update Scores</button>
            <div class="group-standings" id="standings-${i}"></div>
        `;
        container.appendChild(groupDiv);
    }

    localStorage.setItem('numGroups', numGroups);
    loadGroupNamesAndTeams();
}

function saveAndUpdateGroupName(groupIndex, name) {
    let groupNames = JSON.parse(localStorage.getItem('groupNames')) || {};
    groupNames[groupIndex] = name;
    localStorage.setItem('groupNames', JSON.stringify(groupNames));

    const heading = document.getElementById(`group-heading-${groupIndex}`);
    if (heading) {
        heading.textContent = name || `Group ${String.fromCharCode(64 + groupIndex)}`;
    }
}

function addTeam(groupIndex) {
    const input = document.getElementById(`team-input-${groupIndex}`);
    const teamName = input.value.trim();
    if (!teamName) return;

    const list = document.getElementById(`team-list-${groupIndex}`);
    const li = document.createElement('li');
    li.textContent = teamName;
    list.appendChild(li);

    input.value = '';
    saveTeam(groupIndex, teamName);
    updateTotalTeams();
}

function saveTeam(groupIndex, teamName) {
    let groups = JSON.parse(localStorage.getItem('groups')) || {};
    if (!groups[groupIndex]) groups[groupIndex] = [];
    groups[groupIndex].push(teamName);
    localStorage.setItem('groups', JSON.stringify(groups));
}

function generateFixtures(groupIndex) {
    const teams = getTeams(groupIndex);
    if (teams.length < 2) {
        alert('Need at least 2 teams to generate fixtures.');
        return;
    }

    let fixtures = [];
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            fixtures.push({ team1: teams[i], team2: teams[j], score1: '', score2: '' });
        }
    }

    // Randomize order
    fixtures = fixtures.sort(() => Math.random() - 0.5);

    saveFixtures(groupIndex, fixtures);
    displayFixtures(groupIndex, fixtures);
}

function displayFixtures(groupIndex, fixtures) {
    const container = document.getElementById(`fixtures-${groupIndex}`);
    container.innerHTML = '<h4>Fixtures</h4>';
    fixtures.forEach((fix, idx) => {
        const div = document.createElement('div');
        div.className = 'fixture';
        div.innerHTML = `
            ${fix.team1} vs ${fix.team2}: 
            <input type="text" placeholder="Score1" value="${fix.score1}" id="score1-${groupIndex}-${idx}">
            -
            <input type="text" placeholder="Score2" value="${fix.score2}" id="score2-${groupIndex}-${idx}">
        `;
        container.appendChild(div);
    });
}

function updateScores(groupIndex) {
    let fixtures = getFixtures(groupIndex);
    fixtures.forEach((fix, idx) => {
        fix.score1 = document.getElementById(`score1-${groupIndex}-${idx}`).value;
        fix.score2 = document.getElementById(`score2-${groupIndex}-${idx}`).value;
    });
    saveFixtures(groupIndex, fixtures);

    // Calculate points
    let points = {};
    getTeams(groupIndex).forEach(team => points[team] = 0);

    fixtures.forEach(fix => {
        if (fix.score1 && fix.score2) {
            const s1 = parseInt(fix.score1);
            const s2 = parseInt(fix.score2);
            if (!isNaN(s1) && !isNaN(s2)) {
                if (s1 > s2) points[fix.team1] += 2;
                else if (s2 > s1) points[fix.team2] += 2;
            }
        }
    });

    displayStandings(groupIndex, points);
}

function displayStandings(groupIndex, points) {
    const container = document.getElementById(`standings-${groupIndex}`);
    container.innerHTML = '<h4>Standings</h4><table><thead><tr><th>Team</th><th>Points</th></tr></thead><tbody></tbody></table>';
    const tbody = container.querySelector('tbody');

    Object.keys(points).sort((a, b) => points[b] - points[a]).forEach(team => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${team}</td><td>${points[team]}</td>`;
        tbody.appendChild(tr);
    });
}

function getTeams(groupIndex) {
    const groups = JSON.parse(localStorage.getItem('groups')) || {};
    return groups[groupIndex] || [];
}

function saveFixtures(groupIndex, fixtures) {
    let allFixtures = JSON.parse(localStorage.getItem('fixtures')) || {};
    allFixtures[groupIndex] = fixtures;
    localStorage.setItem('fixtures', JSON.stringify(allFixtures));
}

function getFixtures(groupIndex) {
    const allFixtures = JSON.parse(localStorage.getItem('fixtures')) || {};
    return allFixtures[groupIndex] || [];
}

function clearTeams() {
    localStorage.removeItem('groups');
    localStorage.removeItem('fixtures');
    loadGroups(); // Reload to clear displays
    updateTotalTeams();
}

function resetAll() {
    localStorage.clear();
    document.getElementById('groups-container').innerHTML = '';
    document.getElementById('standings-container').innerHTML = '';
    updateTotalTeams();
}

function loadGroups() {
    const savedNum = localStorage.getItem('numGroups');
    if (savedNum) {
        document.getElementById('num-groups').value = savedNum;
        createGroups();
    }
}

function loadGroupNamesAndTeams() {
    const groupNames = JSON.parse(localStorage.getItem('groupNames')) || {};
    const groups = JSON.parse(localStorage.getItem('groups')) || {};

    for (let i = 1; i <= Object.keys(groupNames).length; i++) {
        const nameInput = document.getElementById(`group-name-${i}`);
        if (nameInput && groupNames[i]) {
            nameInput.value = groupNames[i];
            saveAndUpdateGroupName(i, groupNames[i]);
        }

        const list = document.getElementById(`team-list-${i}`);
        if (list && groups[i]) {
            groups[i].forEach(team => {
                const li = document.createElement('li');
                li.textContent = team;
                list.appendChild(li);
            });
        }

        const fixtures = getFixtures(i);
        if (fixtures.length > 0) displayFixtures(i, fixtures);
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
