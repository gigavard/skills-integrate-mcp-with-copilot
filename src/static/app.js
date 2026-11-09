document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const filtersForm = document.getElementById("filters-form");
  const activityFilter = document.getElementById("activity-filter");
  const studentEmailFilter = document.getElementById("student-email-filter");
  const clearFiltersButton = document.getElementById("clear-filters");
  let activityOptionsPopulated = false;

  // Fetch the activity directory or a filtered participation report.
  async function fetchActivities() {
    try {
      const params = new URLSearchParams();
      if (activityFilter.value) {
        params.set("activity_name", activityFilter.value);
      }
      if (studentEmailFilter.value.trim()) {
        params.set("student_email", studentEmailFilter.value.trim());
      }

      const query = params.toString();
      const response = await fetch(`/activities${query ? `?${query}` : ""}`);
      const activities = await response.json();

      if (!response.ok) {
        activitiesList.innerHTML = `<p class="empty-state">${activities.detail || "Unable to load reports."}</p>`;
        return;
      }

      // Clear loading message
      activitiesList.innerHTML = "";

      const entries = Object.entries(activities);
      if (entries.length === 0) {
        const emptyMessage = studentEmailFilter.value.trim()
          ? "No activities found for this student."
          : "No activities match these filters.";
        activitiesList.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
        return;
      }

      if (!activityOptionsPopulated) {
        entries.forEach(([name]) => {
          const activityOption = new Option(name, name);
          activityFilter.appendChild(activityOption);
          activitySelect.appendChild(new Option(name, name));
        });
        activityOptionsPopulated = true;
      }

      const isFilteredReport = Boolean(activityFilter.value || studentEmailFilter.value.trim());

      // Populate activities list
      entries.forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participantCount = details.participant_count;
        const spotsLeft = details.spots_remaining;

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${isFilteredReport ? "" : `<button class="delete-btn" data-activity="${name}" data-email="${email}" aria-label="Unregister ${email}">❌</button>`}</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Participants:</strong> ${participantCount} / ${details.max_participants}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  filtersForm.addEventListener("submit", (event) => {
    event.preventDefault();
    fetchActivities();
  });

  clearFiltersButton.addEventListener("click", () => {
    filtersForm.reset();
    fetchActivities();
  });

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
