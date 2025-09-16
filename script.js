document.addEventListener('DOMContentLoaded', () => {
    loadGroups();
    updateTotalTeams();
    loadSemiFinalsAndFinal();
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
        updateDashboardStats();
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
    updateDashboardStats();
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
            <span class="team-names">${fix.team1} vs ${fix.team2}</span>
            <input type="text" placeholder="Score1" value="${fix.score1}" id="score1-${groupIndex}-${idx}">
            <span>-</span>
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

    let stats = {};
    getTeams(groupIndex).forEach(team => {
        stats[team] = { points: 0, scoreWon: 0, scoreAgainst: 0, avgPoints: 0 };
    });
    fixtures.forEach(fix => {
        if (fix.score1 && fix.score2) {
            const s1 = parseInt(fix.score1);
            const s2 = parseInt(fix.score2);
            if (!isNaN(s1) && !isNaN(s2)) {
                stats[fix.team1].scoreWon += s1;
                stats[fix.team1].scoreAgainst += s2;
                stats[fix.team2].scoreWon += s2;
                stats[fix.team2].scoreAgainst += s1;
                if (s1 > s2) stats[fix.team1].points += 2;
                else if (s2 > s1) stats[fix.team2].points += 2;
            }
        }
    });
    Object.keys(stats).forEach(team => {
        const sWon = stats[team].scoreWon;
        const sAgainst = stats[team].scoreAgainst;
        stats[team].avgPoints = sAgainst > 0 ? (sWon / sAgainst).toFixed(4) : "0.0000";
    });

    displayStandings(groupIndex, stats);
    if (document.getElementById('semiFinals-container')) {
        showGenerateSemiFinalsButton();
    }
    updateDashboardStats();
}

function displayStandings(groupIndex, stats) {
    const container = document.getElementById(`standings-${groupIndex}`);
    container.innerHTML = '<h4>Standings</h4><table><thead><tr><th>Team</th><th>Points</th><th>Average Points</th></tr></thead><tbody></tbody></table>';
    const tbody = container.querySelector('tbody');

    const teamsSorted = Object.keys(stats).sort((a, b) => {
        if (stats[b].points !== stats[a].points) {
            return stats[b].points - stats[a].points;
        }
        return parseFloat(stats[b].avgPoints) - parseFloat(stats[a].avgPoints);
    });

    teamsSorted.forEach((team, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${team}</td><td>${stats[team].points}</td><td>${stats[team].avgPoints}</td>`;
        if(index < 2) tr.classList.add('top-two');
        tbody.appendChild(tr);
    });
}

function showGenerateSemiFinalsButton() {
    const semiBtnExists = document.getElementById('generate-semi-btn');
    if (!semiBtnExists) {
        const btn = document.createElement('button');
        btn.textContent = 'Generate Semi Finals';
        btn.id = 'generate-semi-btn';
        btn.className = 'generate-fixtures';
        btn.style = 'margin-bottom:15px;';
        btn.onclick = generateSemiFinals;
        document.getElementById('semiFinals-container').appendChild(btn);
    }
}

function generateSemiFinals() {
    const groups = JSON.parse(localStorage.getItem('groups')) || {};
    const semiFinalsContainer = document.getElementById('semiFinals-container');
    semiFinalsContainer.innerHTML = '';

    if (Object.keys(groups).length < 2) {
        semiFinalsContainer.innerHTML = '<p>Need at least 2 groups for Semi Finals.</p>';
        return;
    }

    function getTopTwoPositions(groupIndex) {
        const stats = {};
        getTeams(groupIndex).forEach(team => {
            stats[team] = { points: 0, scoreWon: 0, scoreAgainst: 0, avgPoints: 0 };
        });
        const fixtures = getFixtures(groupIndex);
        fixtures.forEach(fix => {
            if (fix.score1 && fix.score2) {
                const s1 = parseInt(fix.score1);
                const s2 = parseInt(fix.score2);
                if (!isNaN(s1) && !isNaN(s2)) {
                    stats[fix.team1].scoreWon += s1;
                    stats[fix.team1].scoreAgainst += s2;
                    stats[fix.team2].scoreWon += s2;
                    stats[fix.team2].scoreAgainst += s1;
                    if (s1 > s2) stats[fix.team1].points += 2;
                    else if (s2 > s1) stats[fix.team2].points += 2;
                }
            }
        });
        Object.keys(stats).forEach(team => {
            const sWon = stats[team].scoreWon;
            const sAgainst = stats[team].scoreAgainst;
            stats[team].avgPoints = sAgainst > 0 ? (sWon / sAgainst).toFixed(4) : "0.0000";
        });
        const teamsSorted = Object.keys(stats).sort((a, b) => {
            if (stats[b].points !== stats[a].points) {
                return stats[b].points - stats[a].points;
            }
            return parseFloat(stats[b].avgPoints) - parseFloat(stats[a].avgPoints);
        });
        return teamsSorted.slice(0, 2);
    }

    const groupA = getTopTwoPositions(1);
    const groupB = getTopTwoPositions(2);

    if (groupA.length < 2 || groupB.length < 2) {
        semiFinalsContainer.innerHTML = '<p>Both Group A and Group B need at least two teams with scores to generate Semi Finals.</p>';
        return;
    }

    const semiFinalFixtures = [
        { team1: groupA[0], team2: groupB[1], score1: '', score2: '' },
        { team1: groupB[0], team2: groupA[1], score1: '', score2: '' }
    ];
    localStorage.setItem('semiFinalFixtures', JSON.stringify(semiFinalFixtures));
    displaySemiFinals(semiFinalFixtures);
}

function displaySemiFinals(fixtures) {
    const container = document.getElementById('semiFinals-container');
    container.innerHTML = '<h3>Semi Final Matches</h3>';
    fixtures.forEach((fix, idx) => {
        const div = document.createElement('div');
        div.className = 'fixture';
        div.innerHTML = `
            <span class="team-names">${fix.team1} vs ${fix.team2}</span>
            <input type="text" placeholder="Score1" value="${fix.score1}" id="semi-score1-${idx}">
            <span>-</span>
            <input type="text" placeholder="Score2" value="${fix.score2}" id="semi-score2-${idx}">
        `;
        container.appendChild(div);
    });
    const btn = document.createElement('button');
    btn.textContent = 'Update Semi Final Scores';
    btn.onclick = updateSemiFinalScores;
    container.appendChild(btn);
    document.getElementById('final-container').innerHTML = '';
}

function updateSemiFinalScores() {
    let fixtures = JSON.parse(localStorage.getItem('semiFinalFixtures')) || [];
    fixtures.forEach((fix, idx) => {
        fix.score1 = document.getElementById(`semi-score1-${idx}`).value;
        fix.score2 = document.getElementById(`semi-score2-${idx}`).value;
    });
    localStorage.setItem('semiFinalFixtures', JSON.stringify(fixtures));
    let winners = [];
    fixtures.forEach((fix) => {
        const s1 = parseInt(fix.score1);
        const s2 = parseInt(fix.score2);
        if (!isNaN(s1) && !isNaN(s2)) {
            if (s1 > s2) winners.push(fix.team1);
            else if (s2 > s1) winners.push(fix.team2);
        }
    });
    if (winners.length === 2) {
        generateFinals(winners);
    } else {
        alert('Enter valid scores for both Semi Final matches to generate Final.');
    }
}

function generateFinals(finalists) {
    const container = document.getElementById('final-container');
    container.innerHTML = '<h3>Final Match</h3>';
    const fix = { team1: finalists[0], team2: finalists[1], score1: '', score2: '' };
    localStorage.setItem('finalFixture', JSON.stringify(fix));
    const div = document.createElement('div');
    div.className = 'fixture';
    div.innerHTML = `
        <span class="team-names">${fix.team1} vs ${fix.team2}</span>
        <input type="text" placeholder="Score1" value="${fix.score1}" id="final-score1">
        <span>-</span>
        <input type="text" placeholder="Score2" value="${fix.score2}" id="final-score2">
    `;
    container.appendChild(div);
    const btn = document.createElement('button');
    btn.textContent = 'Update Final Score';
    btn.onclick = updateFinalScore;
    container.appendChild(btn);
}

function updateFinalScore() {
    const final = JSON.parse(localStorage.getItem('finalFixture')) || null;
    if (!final) return;
    final.score1 = document.getElementById('final-score1').value;
    final.score2 = document.getElementById('final-score2').value;
    localStorage.setItem('finalFixture', JSON.stringify(final));
    const s1 = parseInt(final.score1);
    const s2 = parseInt(final.score2);
    let winner = '';
    if (!isNaN(s1) && !isNaN(s2)) {
        if (s1 > s2) winner = final.team1;
        else if (s2 > s1) winner = final.team2;
    }
    const container = document.getElementById('final-container');
    container.innerHTML = '<h3>Final Match</h3>';
    const div = document.createElement('div');
    div.className = 'fixture';
    div.innerHTML = `<span class="team-names">${final.team1} vs ${final.team2}: ${final.score1} - ${final.score2}</span>`;
    container.appendChild(div);
    if (winner) {
        const winnerDiv = document.createElement('div');
        winnerDiv.style = 'margin-top: 10px; font-weight: bold; color: green;';
        winnerDiv.textContent = `Winner: ${winner}`;
        container.appendChild(winnerDiv);
    }
}

function loadSemiFinalsAndFinal() {
    const semiFinalsContainer = document.getElementById('semiFinals-container');
    const finalContainer = document.getElementById('final-container');
    const semiFinalFixtures = JSON.parse(localStorage.getItem('semiFinalFixtures')) || [];
    if(semiFinalFixtures.length > 0) {
        displaySemiFinals(semiFinalFixtures);
    } else {
        semiFinalsContainer.innerHTML = '';
    }
    const finalFixture = JSON.parse(localStorage.getItem('finalFixture')) || null;
    if(finalFixture) {
        const div = document.createElement('div');
        div.className = 'fixture';
        finalContainer.innerHTML = '<h3>Final Match</h3>';
        const fixtureDiv = document.createElement('div');
        fixtureDiv.className = 'fixture';
        fixtureDiv.innerHTML = `
            <span class="team-names">${finalFixture.team1} vs ${finalFixture.team2}</span>
            <input type="text" placeholder="Score1" value="${finalFixture.score1}" id="final-score1">
            <span>-</span>
            <input type="text" placeholder="Score2" value="${finalFixture.score2}" id="final-score2">
        `;
        finalContainer.appendChild(fixtureDiv);
        const btn = document.createElement('button');
        btn.textContent = 'Update Final Score';
        btn.onclick = updateFinalScore;
        finalContainer.appendChild(btn);
    } else {
        finalContainer.innerHTML = '';
    }
}

function clearTeams() {
    localStorage.removeItem('groups');
    localStorage.removeItem('fixtures');
    loadGroups();
    updateTotalTeams();
}

function resetAll() {
    localStorage.clear();
    document.getElementById('groups-container').innerHTML = '';
    document.getElementById('standings-container').innerHTML = '';
    updateTotalTeams();
    clearSemiFinalsAndFinal();
}

function clearSemiFinalsAndFinal() {
    localStorage.removeItem('semiFinalFixtures');
    localStorage.removeItem('finalFixture');
    document.getElementById('semiFinals-container').innerHTML = '';
    document.getElementById('final-container').innerHTML = '';
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

function loadGroups() {
    const savedNum = localStorage.getItem('numGroups');
    if (savedNum) {
        document.getElementById('num-groups').value = savedNum;
        createGroups();
    }
    loadSemiFinalsAndFinal();
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

function updateDashboardStats() {
  // You might be storing your teams differently – adjust if needed
  const teams = JSON.parse(localStorage.getItem('teams')) || [];
  const totalTeams = teams.length;

  // Same for fixtures — if you use a different variable name adjust here
  const fixtures = JSON.parse(localStorage.getItem('fixtures')) || [];
  const totalMatches = fixtures.length;

  // Completed matches: both scores entered
  const completed = fixtures.filter(f => f.score1 !== "" && f.score2 !== "").length;
  const pending = totalMatches - completed;

  // Update DOM
  document.getElementById('total-teams').textContent = totalTeams;
  document.getElementById('total-matches').textContent = totalMatches;
  document.getElementById('completed-matches').textContent = completed;
  document.getElementById('pending-matches').textContent = pending;
}

document.addEventListener('DOMContentLoaded', updateDashboardStats);

