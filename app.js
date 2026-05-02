
let groups = {
  A: {
    teams: ["Brazil", "Germany", "Serbia", "Cameroon"],
    matches: [
      { home: "Brazil",  away: "Germany",  score1: null, score2: null },
      { home: "Serbia",  away: "Cameroon", score1: null, score2: null },
      { home: "Brazil",  away: "Serbia",   score1: null, score2: null },
      { home: "Germany", away: "Cameroon", score1: null, score2: null },
      { home: "Brazil",  away: "Cameroon", score1: null, score2: null },
      { home: "Germany", away: "Serbia",   score1: null, score2: null },
    ]
  },
  B: {
    teams: ["Argentina", "France", "Mexico", "Poland"],
    matches: [
      { home: "Argentina", away: "France",  score1: null, score2: null },
      { home: "Mexico",    away: "Poland",  score1: null, score2: null },
      { home: "Argentina", away: "Mexico",  score1: null, score2: null },
      { home: "France",    away: "Poland",  score1: null, score2: null },
      { home: "Argentina", away: "Poland",  score1: null, score2: null },
      { home: "France",    away: "Mexico",  score1: null, score2: null },
    ]
  },
  C: {
    teams: ["England", "Spain", "USA", "Iran"],
    matches: [
      { home: "England", away: "Spain", score1: null, score2: null },
      { home: "USA",     away: "Iran",  score1: null, score2: null },
      { home: "England", away: "USA",   score1: null, score2: null },
      { home: "Spain",   away: "Iran",  score1: null, score2: null },
      { home: "England", away: "Iran",  score1: null, score2: null },
      { home: "Spain",   away: "USA",   score1: null, score2: null },
    ]
  },
  D: {
    teams: ["Portugal", "Netherlands", "Uruguay", "South Korea"],
    matches: [
      { home: "Portugal",    away: "Netherlands", score1: null, score2: null },
      { home: "Uruguay",     away: "South Korea", score1: null, score2: null },
      { home: "Portugal",    away: "Uruguay",     score1: null, score2: null },
      { home: "Netherlands", away: "South Korea", score1: null, score2: null },
      { home: "Portugal",    away: "South Korea", score1: null, score2: null },
      { home: "Netherlands", away: "Uruguay",     score1: null, score2: null },
    ]
  }
};

let groupLocked  = false;
let currentPhase = "groups";

let round16Matches = [];
let quarterMatches = [];
let finalMatches   = [];

let round16Locked = false;
let quarterLocked = false;
let finalLocked   = false;

let champion = null;


// Landing Page

function startTournament() {
  document.getElementById("landingPage").classList.add("d-none");
  document.getElementById("tournamentPage").classList.remove("d-none");
  showGroups();
}

function toEnglishNumbers(str) {
  if (!str) return "";
  return String(str).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}


//localStorage
function saveData() {
  let data = {
    groups, groupLocked, currentPhase,
    round16Matches, quarterMatches, finalMatches,
    round16Locked, quarterLocked, finalLocked,
    champion,
  };
  localStorage.setItem("wc2026", JSON.stringify(data));
}

function loadData() {
  let saved = localStorage.getItem("wc2026");
  if (!saved) return false;

  let data       = JSON.parse(saved);
  groups         = data.groups;
  groupLocked    = data.groupLocked;
  currentPhase   = data.currentPhase;
  round16Matches = data.round16Matches;
  quarterMatches = data.quarterMatches;
  finalMatches   = data.finalMatches;
  round16Locked  = data.round16Locked;
  quarterLocked  = data.quarterLocked;
  finalLocked    = data.finalLocked;
  champion       = data.champion;
  return true;
}

// Calculate group ranking

function getStandings(groupName) {
  let group = groups[groupName];
  let stats = {};


  group.teams.forEach(team => {
    stats[team] = { team, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, mp: 0 };
  });

  group.matches.forEach(match => {
    if (match.score1 === null || match.score2 === null) return;

    let s1   = parseInt(match.score1, 10);
    let s2   = parseInt(match.score2, 10);
    let home = match.home;
    let away = match.away;

    stats[home].mp++;
    stats[away].mp++;
    stats[home].gf += s1;
    stats[home].ga += s2;
    stats[away].gf += s2;
    stats[away].ga += s1;

    if (s1 > s2) {

      stats[home].pts += 3;
      stats[home].w++;
      stats[away].l++;
    } else if (s2 > s1) {

      stats[away].pts += 3;
      stats[away].w++;
      stats[home].l++;
    } else {
      // parity
      stats[home].pts += 1;
      stats[home].d++;
      stats[away].pts += 1;
      stats[away].d++;
    }
  });

  let result = Object.values(stats);
  result.sort((a, b) => {
    let gd_a = a.gf - a.ga;
    let gd_b = b.gf - b.ga;
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (gd_b  !== gd_a)  return gd_b - gd_a;
    return b.gf - a.gf;
  });

  return result;
}


function updateGroupTable(gName) {
  let standings = getStandings(gName);
  let tbody     = document.getElementById("table-body-" + gName);
  if (!tbody) return;

  let html = "";
  standings.forEach((s, i) => {
    let gd        = s.gf - s.ga;
    let gdText    = gd >= 0 ? "+" + gd : gd;
    let rowClass  = i < 2 ? "qualified-row" : "";
    let rankClass = "rank-" + (i + 1);

    html += `
      <tr class="${rowClass}">
        <td><span class="team-rank ${rankClass}">${i + 1}</span> ${s.team}</td>
        <td>${s.mp}</td>
        <td>${s.w}</td>
        <td>${s.l}</td>
        <td>${gdText}</td>
        <td class="pts-cell">${s.pts}</td>
      </tr>`;
  });

  tbody.innerHTML = html;

  let tags = document.getElementById("group-tags-" + gName);
  if (tags) {
    tags.innerHTML = standings.map((s, i) =>
      `<span class="group-team-tag rank-tag-${i+1}">${s.team}</span>`
    ).join("");
  }
}


// View full page

function showGroups() {
  let html = "";

  //Group cards
  html += '<div class="row g-3">';
  ["A", "B", "C", "D"].forEach(gName => {
    html += buildGroupCard(gName);
  });
  html += '</div>';

  // Termination button or lock badge
  if (!groupLocked) {
    html += `
      <div class="text-center mt-4 mb-4">
        <button class="btn-finish" onclick="finishGroups()">🔒 Finish Group Stage</button>
      </div>`;
  } else {
    html += `
      <div class="text-center mt-4 mb-4">
        <span class="phase-locked-badge">🔒 Group Stage Locked</span>
      </div>`;
  }


//knockout rounds

  if (groupLocked) {
    html += `<hr class="gold-divider">${showKnockout()}`;
  }

  document.getElementById("app").innerHTML = html;
  addInputListeners();

  ["A", "B", "C", "D"].forEach(g => updateGroupTable(g));
}


function buildGroupCard(gName) {
  let group = groups[gName];

  // Sorting table
  let tableHTML = `
    <table class="standings-table">
      <thead>
        <tr>
          <th>Team</th><th>MP</th><th>W</th><th>L</th><th>GD</th><th>Pts</th>
        </tr>
      </thead>
      <tbody id="table-body-${gName}"></tbody>
    </table>`;

  // Specify the lock and unlock status
  let isLocked     = groupLocked;
  let isOpen       = !isLocked;
  
  // Build classes
  let toggleClass  = isLocked ? 'matches-toggle locked' : 'matches-toggle';
  let bodyClass    = isLocked ? 'matches-body' : 'matches-body';
  let iconClass    = isLocked ? 'bi bi-lock-fill matches-toggle-icon' : 'bi bi-chevron-up matches-toggle-icon';
  let labelText    = isLocked ? 'Matches (Locked)' : 'Matches';
  
  if (isOpen) {
    toggleClass += ' open';
    bodyClass += ' open';
  }

  let matchesRows = "";
  group.matches.forEach((match, idx) => {
    matchesRows += buildGroupMatchRow(gName, idx, match);
  });

  let clickHandler = isLocked ? '' : `onclick="toggleMatches('matches-body-${gName}', this)"`;
  
  let matchesHTML = `
    <div class="${toggleClass}" id="toggle-${gName}" ${clickHandler}>
      <span class="matches-toggle-label">
        <i class="bi bi-calendar3"></i> ${labelText}
      </span>
      <i class="${iconClass}"></i>
    </div>
    <div class="${bodyClass}" id="matches-body-${gName}">
      ${matchesRows}
    </div>`;

  return `
    <div class="col-lg-6 col-12">
      <div class="group-card">
        <div class="group-card-header">
          <div class="group-letter">G${gName}</div>
          <div class="group-header-center">
            <p class="group-card-title mb-0">Group ${gName}</p>
            <span class="group-stage-badge">Group Stage</span>
          </div>
          <div class="group-teams-list" id="group-tags-${gName}">
            ${getStandings(gName).map((s, i) => `<span class="group-team-tag rank-tag-${i+1}">${s.team}</span>`).join("")}
          </div>
        </div>
        <div class="group-card-body">${tableHTML}${matchesHTML}</div>
      </div>
    </div>`;
}

// Buildh row in groups
function buildGroupMatchRow(gName, idx, match) {
  let scoreHTML;

  if (groupLocked) {

    scoreHTML = `
      <div class="score-display">
        <div class="score-box">${match.score1 !== null ? match.score1 : "-"}</div>
        <span class="score-vs">—</span>
        <div class="score-box">${match.score2 !== null ? match.score2 : "-"}</div>
      </div>`;
  } else {

    let val1 = match.score1 !== null ? match.score1 : "";
    let val2 = match.score2 !== null ? match.score2 : "";

    scoreHTML = `
      <div class="score-group">
        <input type="text" inputmode="numeric" pattern="[0-9]*"
          class="score-input" placeholder="0"
          data-group="${gName}" data-match="${idx}" data-side="score1"
          value="${val1}">
        <span class="score-vs">VS</span>
        <input type="text" inputmode="numeric" pattern="[0-9]*"
          class="score-input" placeholder="0"
          data-group="${gName}" data-match="${idx}" data-side="score2"
          value="${val2}">
      </div>`;
  }

  return `
    <div class="match-row">
      <span class="match-team home">${match.home}</span>
      ${scoreHTML}
      <span class="match-team away">${match.away}</span>
    </div>`;
}


// Open and close 

function toggleMatches(bodyId, toggleEl) {
  let body = document.getElementById(bodyId);
  if (!body) return;


  body.classList.toggle("open");
  toggleEl.classList.toggle("open");
}

// Bind input field events

function addInputListeners() {
  //Group fields
  document.querySelectorAll(".score-input[data-group]").forEach(input => {
    input.addEventListener("input", function() {
      let clean = toEnglishNumbers(this.value).replace(/[^0-9]/g, "");
      this.value = clean;

      let g    = this.dataset.group;
      let m    = parseInt(this.dataset.match, 10);
      let side = this.dataset.side;

      groups[g].matches[m][side] = clean === "" ? null : parseInt(clean, 10);
      saveData();
      updateGroupTable(g);
    });
  });

//knockout fields
  document.querySelectorAll(".score-input[data-round]").forEach(input => {
    input.addEventListener("input", function() {
      let clean = toEnglishNumbers(this.value).replace(/[^0-9]/g, "");
      this.value = clean;

      let round = this.dataset.round;
      let m     = parseInt(this.dataset.match, 10);
      let side  = this.dataset.side;
      let val   = clean === "" ? null : parseInt(clean, 10);

      if (round === "round16") round16Matches[m][side] = val;
      if (round === "quarter") quarterMatches[m][side] = val;
      if (round === "final")   finalMatches[m][side]   = val;

      saveData();
    });
  });
}


// End of group stage

function finishGroups() {

  let allDone = true;
  ["A", "B", "C", "D"].forEach(g => {
    groups[g].matches.forEach(match => {
      if (match.score1 === null || match.score2 === null) allDone = false;
    });
  });

  if (!allDone) {
    alert("⚠️ Please enter all match results first!");
    return;
  }

  let wA = getStandings("A")[0].team;
  let rA = getStandings("A")[1].team;
  let wB = getStandings("B")[0].team;
  let rB = getStandings("B")[1].team;
  let wC = getStandings("C")[0].team;
  let rC = getStandings("C")[1].team;
  let wD = getStandings("D")[0].team;
  let rD = getStandings("D")[1].team;


  round16Matches = [
    { home: wA, away: rB, score1: null, score2: null },
    { home: wB, away: rA, score1: null, score2: null },
    { home: wC, away: rD, score1: null, score2: null },
    { home: wD, away: rC, score1: null, score2: null },
  ];

  groupLocked  = true;
  currentPhase = "round16";
  saveData();
  showGroups();
  alert("✅ Group Stage finished! Enter Quarter-final results.");
}

//knockout show

function showKnockout() {
  let html = '<h2 class="section-title">⚡ Knockout Rounds</h2>';

  // Quarter-final
  if (round16Matches.length > 0) {
    html += buildCollapsibleKnockout("Quarter-final", "round16", round16Matches, round16Locked,
      round16Locked ? "" : '<div class="text-center mb-4"><button class="btn-finish" onclick="finishRound16()">🔒 Finish Quarter-final</button></div>'
    );
  }

  // Semi Finals
  if (quarterMatches.length > 0) {
    html += buildCollapsibleKnockout("Semi-finals", "quarter", quarterMatches, quarterLocked,
      quarterLocked ? "" : '<div class="text-center mb-4"><button class="btn-finish" onclick="finishQuarter()">🔒 Finish Semi-finals</button></div>'
    );
  }

  // The Final 
  if (finalMatches.length > 0) {
    html += buildCollapsibleKnockout("🏆 The Final", "final", finalMatches, finalLocked,
      finalLocked ? "" : '<div class="text-center mb-4"><button class="btn-finish" onclick="finishFinal()">🏆 Announce Champion!</button></div>'
    );
  }

  return html;
}

//close 
function buildCollapsibleKnockout(title, roundName, matches, locked, actionBtn) {
  let isOpen   = !locked;
  let openClass = isOpen ? "open" : "";

  let matchesOnly = buildKnockoutMatchesOnly(roundName, matches, locked);


  let winnersHTML = "";
  if (locked) {
    let winners = getWinners(matches);
    winnersHTML = `
      <div class="ko-winners-strip">
        ${winners.map(w => `<span class="ko-winner-pill">✓ ${w}</span>`).join("")}
      </div>`;
  }

  let lockIcon = locked
    ? '<i class="bi bi-lock-fill" style="color:var(--gold);font-size:0.85rem;"></i>'
    : '<i class="bi bi-chevron-up knockout-chevron"></i>';

  return `
    <div class="knockout-section mb-3">
      <div class="knockout-collapse-header ${openClass} ${locked ? 'locked' : ''}" onclick="toggleKnockoutSection('ko-body-${roundName}', this)">
        <div class="knockout-collapse-left">
          <span class="knockout-round-badge">${title}</span>
          ${locked ? '<span class="ko-locked-tag">🔒 Locked</span>' : ""}
          ${winnersHTML}
        </div>
        ${lockIcon}
      </div>
      <div class="knockout-collapse-body ${openClass}" id="ko-body-${roundName}">
        <div class="row g-3 justify-content-center mt-1">
          ${matchesOnly}
        </div>
        ${actionBtn}
      </div>
    </div>`;
}

function buildKnockoutMatchesOnly(roundName, matches, locked) {
  let html = "";
  matches.forEach((match, i) => {
    html += `
      <div class="col-lg-5 col-12">
        <div class="knockout-match-card">
          <div class="match-label">Match ${i + 1}</div>
          ${buildKnockoutMatchRow(roundName, i, match, locked)}
        </div>
      </div>`;
  });
  return html;
}

function toggleKnockoutSection(bodyId, headerEl) {
  if (headerEl.classList.contains("locked")) return;
  let body = document.getElementById(bodyId);
  if (!body) return;
  body.classList.toggle("open");
  headerEl.classList.toggle("open");
  let chevron = headerEl.querySelector(".knockout-chevron");
  if (chevron) chevron.style.transform = body.classList.contains("open") ? "" : "rotate(180deg)";
}


function buildKnockoutMatchRow(roundName, idx, match, locked) {
  let scoreHTML;

  if (locked) {
    scoreHTML = `
      <div class="score-display">
        <div class="score-box">${match.score1 !== null ? match.score1 : "-"}</div>
        <span class="score-vs">—</span>
        <div class="score-box">${match.score2 !== null ? match.score2 : "-"}</div>
      </div>`;
  } else {
    let val1 = match.score1 !== null ? match.score1 : "";
    let val2 = match.score2 !== null ? match.score2 : "";

    scoreHTML = `
      <div class="score-group">
        <input type="text" inputmode="numeric" pattern="[0-9]*"
          class="score-input" placeholder="0"
          data-round="${roundName}" data-match="${idx}" data-side="score1"
          value="${val1}">
        <span class="score-vs">VS</span>
        <input type="text" inputmode="numeric" pattern="[0-9]*"
          class="score-input" placeholder="0"
          data-round="${roundName}" data-match="${idx}" data-side="score2"
          value="${val2}">
      </div>`;
  }

  return `
    <div class="match-row">
      <span class="match-team home">${match.home}</span>
      ${scoreHTML}
      <span class="match-team away">${match.away}</span>
    </div>`;
}


//
function roundIsComplete(matches) {
  for (let match of matches) {
    if (match.score1 === null || match.score2 === null) {
      alert("⚠️ Please enter all match results!");
      return false;
    }
    if (parseInt(match.score1, 10) === parseInt(match.score2, 10)) {
      alert("⚽ No draws in knockout! There must be a winner.");
      return false;
    }
  }
  return true;
}

// winner of each match
function getWinners(matches) {
  return matches.map(match =>
    parseInt(match.score1, 10) > parseInt(match.score2, 10) ? match.home : match.away
  );
}

function makeNextMatches(winners) {
  let next = [];
  for (let i = 0; i < winners.length; i += 2) {
    next.push({ home: winners[i], away: winners[i + 1], score1: null, score2: null });
  }
  return next;
}

function finishRound16() {
  if (!roundIsComplete(round16Matches)) return;
  // 4 فائزين → 2 مباريات في Semi Finals
  quarterMatches = makeNextMatches(getWinners(round16Matches));
  round16Locked  = true;
  currentPhase   = "quarter";
  saveData();
  showGroups();
  alert("✅ Moving to Semi-finals!");
}

function finishQuarter() {
  if (!roundIsComplete(quarterMatches)) return;


  finalMatches  = makeNextMatches(getWinners(quarterMatches));
  quarterLocked = true;
  currentPhase  = "final";
  saveData();
  showGroups();
  alert("✅ Moving to The Final!");
}

function finishFinal() {
  if (!roundIsComplete(finalMatches)) return;

  let m    = finalMatches[0];
  champion = parseInt(m.score1, 10) > parseInt(m.score2, 10) ? m.home : m.away;
  finalLocked  = true;
  currentPhase = "done";
  saveData();
  showGroups();
  showChampion();
}


// Hero

function showChampion() {
  document.getElementById("championName").textContent = champion;

  let banner = document.getElementById("championBanner");
  if (banner) {
    document.getElementById("championBannerName").textContent = champion;
    banner.style.display = "block";
  }

  document.getElementById("championModalTrigger").click();
}


//Restart

function resetTournament() {
  if (confirm("Are you sure? All results will be deleted!")) {
    localStorage.removeItem("wc2026");
    location.reload();
  }
}

// page opens


let loaded = loadData();

if (loaded) {

  startTournament();
  showGroups();
} else {

  groupLocked  = false;
  currentPhase = "groups";
}


if (currentPhase === "done" && champion) {
  let banner = document.getElementById("championBanner");
  if (banner) {
    document.getElementById("championBannerName").textContent = champion;
    banner.style.display = "block";
  }
  setTimeout(showChampion, 500);
}

