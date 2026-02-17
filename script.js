// Get all needed DOM elements
const form = document.getElementById("checkInForm"); // Corrected form ID
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const checkInButton = document.getElementById("checkInBtn");
const attendeeCountElement = document.getElementById("attendeeCount");
const progressBar = document.querySelector(".progress-bar");
const greetingElement = document.getElementById("greeting");
const attendeeListElement = document.getElementById("attendeeList");

// Track attendance
let count = 0;
const maxCount = 50;
const attendanceCountStorageKey = "attendanceCount";
const teamCountsStorageKey = "teamCounts";
const attendeeListStorageKey = "attendeeList";
const attendanceStorageVersionKey = "attendanceStorageVersion";
const currentAttendanceStorageVersion = "2";
let attendeeList = [];

// Function to update the attendee count
function updateAttendeeCount() {
  attendeeCountElement.textContent = count;
}

// Function to update the progress bar
function updateProgressBar() {
  const progressPercentage = Math.min((count / maxCount) * 100, 100);
  progressBar.style.width = `${progressPercentage}%`;
}

function lockCheckInForm() {
  nameInput.disabled = true;
  teamSelect.disabled = true;
  checkInButton.disabled = true;
}

function getTeamCount(team) {
  const teamElement = document.querySelector(`.team-card.${team}`);
  if (!teamElement) {
    return 0;
  }

  const teamCountElement = teamElement.querySelector(".team-count");
  return parseInt(teamCountElement.textContent, 10) || 0;
}

function setTeamCount(team, teamCount) {
  const teamElement = document.querySelector(`.team-card.${team}`);
  if (!teamElement) {
    return;
  }

  const teamCountElement = teamElement.querySelector(".team-count");
  teamCountElement.textContent = teamCount;
}

function saveAttendanceData() {
  const teamCounts = {
    water: getTeamCount("water"),
    zero: getTeamCount("zero"),
    power: getTeamCount("power"),
  };

  localStorage.setItem(attendanceCountStorageKey, String(count));
  localStorage.setItem(teamCountsStorageKey, JSON.stringify(teamCounts));
  localStorage.setItem(attendeeListStorageKey, JSON.stringify(attendeeList));
}

function initializeAttendanceStorage() {
  const savedVersion = localStorage.getItem(attendanceStorageVersionKey);

  if (savedVersion !== currentAttendanceStorageVersion) {
    localStorage.removeItem(attendanceCountStorageKey);
    localStorage.removeItem(teamCountsStorageKey);
    localStorage.removeItem(attendeeListStorageKey);
    localStorage.setItem(
      attendanceStorageVersionKey,
      currentAttendanceStorageVersion,
    );
  }
}

function renderAttendeeList() {
  attendeeListElement.innerHTML = "";

  if (attendeeList.length === 0) {
    attendeeListElement.innerHTML = '<li class="attendee-empty">No attendees yet.</li>';
    return;
  }

  attendeeList.forEach(function (attendee) {
    const attendeeItem = document.createElement("li");
    attendeeItem.className = "attendee-item";
    attendeeItem.textContent = `${attendee.name} — ${attendee.team}`;
    attendeeListElement.appendChild(attendeeItem);
  });
}

function loadAttendanceData() {
  const savedCount = parseInt(localStorage.getItem(attendanceCountStorageKey), 10);
  if (!isNaN(savedCount)) {
    count = Math.min(savedCount, maxCount);
  }

  const savedTeamCounts = localStorage.getItem(teamCountsStorageKey);
  if (savedTeamCounts) {
    try {
      const teamCounts = JSON.parse(savedTeamCounts);
      setTeamCount("water", teamCounts.water || 0);
      setTeamCount("zero", teamCounts.zero || 0);
      setTeamCount("power", teamCounts.power || 0);
    } catch (error) {
      setTeamCount("water", 0);
      setTeamCount("zero", 0);
      setTeamCount("power", 0);
    }
  }

  const savedAttendeeList = localStorage.getItem(attendeeListStorageKey);
  if (savedAttendeeList) {
    try {
      attendeeList = JSON.parse(savedAttendeeList);
    } catch (error) {
      attendeeList = [];
    }
  }

  updateAttendeeCount();
  updateProgressBar();
  renderAttendeeList();

  if (count >= maxCount) {
    displayWinningTeam();
    lockCheckInForm();
  }
}

// Function to display a greeting message
function displayGreeting(name, team) {
  greetingElement.textContent = `Welcome, ${name} from ${team}!`;
  greetingElement.classList.add("success-message");
  greetingElement.style.display = "block";
}

// Function to update the team's count
function updateTeamCount(team) {
  const teamCount = getTeamCount(team) + 1;
  setTeamCount(team, teamCount);
}

// Function to add a glow effect to the team card
function highlightTeamCard(team) {
  const teamElement = document.querySelector(`.team-card.${team}`);
  if (teamElement) {
    teamElement.classList.add("highlight"); // Add the highlight class

    // Remove the highlight class after a short delay
    setTimeout(() => {
      teamElement.classList.remove("highlight");
    }, 1000);

    // Add a pulse effect to the team count
    const teamCountElement = teamElement.querySelector(".team-count");
    if (teamCountElement) {
      teamCountElement.classList.add("pulse");
      setTimeout(() => {
        teamCountElement.classList.remove("pulse");
      }, 1000);
    }
  }
}

// Function to display the winning team when check-in is complete
function displayWinningTeam() {
  const teamCounts = {};
  const teamCards = document.querySelectorAll(".team-card");

  // Collect team counts from the DOM
  teamCards.forEach(function (card) {
    const teamName = card.querySelector(".team-name").textContent.trim();
    const teamCount =
      parseInt(card.querySelector(".team-count").textContent, 10) || 0;
    teamCounts[teamName] = teamCount;
  });

  // Find the team with the highest count
  let winningTeam = "";
  let highestCount = 0; // Renamed to avoid conflict with global maxCount
  for (const team in teamCounts) {
    if (teamCounts[team] > highestCount) {
      highestCount = teamCounts[team];
      winningTeam = team;
    }
  }

  // Display the winning team message
  if (winningTeam && count >= maxCount) {
    greetingElement.textContent = `The winning team is ${winningTeam} with ${highestCount} attendees!`;
    greetingElement.classList.add("success-message");
    greetingElement.style.display = "block";
  }
}

// Function to handle form submission
function handleFormSubmit(event) {
  event.preventDefault(); // Prevent form from submitting normally

  if (count >= maxCount) {
    greetingElement.textContent = "Check-in is now closed. Maximum attendance reached.";
    greetingElement.classList.add("success-message");
    greetingElement.style.display = "block";
    lockCheckInForm();
    return;
  }

  const name = nameInput.value;
  const team = teamSelect.value;
  const teamName = teamSelect.options[teamSelect.selectedIndex].text;

  count++;

  updateAttendeeCount();
  updateProgressBar();
  displayGreeting(name, teamName);
  updateTeamCount(team);
  attendeeList.push({
    name: name,
    team: teamName,
  });
  renderAttendeeList();
  saveAttendanceData();
  highlightTeamCard(team); // Highlight the team card

  // Check if attendance is full and display the winning team
  if (count >= maxCount) {
    displayWinningTeam();
    lockCheckInForm();
  }

  // Reset the form for the next attendee
  form.reset();
}

initializeAttendanceStorage();
loadAttendanceData();

// Attach the event listener to the form
form.addEventListener("submit", handleFormSubmit);
