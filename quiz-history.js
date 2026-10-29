
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://127.0.0.1:8000";

    // --------------------------------------------------
    // ELEMENTS
    // --------------------------------------------------

    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebarToggleBtn");
    const closeBtn = document.getElementById("closeSidebar");
    const searchInput = document.querySelector(".search-box input");
    const exportBtn = document.querySelector(".export-btn");
    const tableBody = document.querySelector(".history-table tbody");

    let attempts = [];
    let filteredAttempts = [];

    // --------------------------------------------------
    // ICONS AND SIDEBAR
    // --------------------------------------------------

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    toggleBtn?.addEventListener("click", () => {
        sidebar?.classList.add("open");
    });

    closeBtn?.addEventListener("click", () => {
        sidebar?.classList.remove("open");
    });

    document.addEventListener("click", event => {
        if (
            window.innerWidth <= 1024 &&
            sidebar &&
            !sidebar.contains(event.target) &&
            toggleBtn &&
            !toggleBtn.contains(event.target) &&
            closeBtn &&
            !closeBtn?.contains(event.target)
        ) {
            sidebar.classList.remove("open");
        }
    });

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    function getToken() {
        try {
            return localStorage.getItem("ai_quiz_token");
        } catch {
            return null;
        }
    }

    async function apiRequest(endpoint) {
        const token = getToken();

        if (!token) {
            throw new Error("Login session not found. Please log in again.");
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const rawText = await response.text();
        let data = {};

        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch {
            throw new Error("Invalid response received from the server.");
        }

        if (response.status === 401 || response.status === 403) {
            throw new Error("Your login session has expired. Please log in again.");
        }

        if (!response.ok) {
            throw new Error(
                data.detail || data.message || `Request failed (${response.status}).`
            );
        }

        return data;
    }

    // --------------------------------------------------
    // HELPERS
    // --------------------------------------------------

    function findElement(selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    }

    function setText(selectors, value) {
        const element = findElement(selectors);
        if (element) element.textContent = value;
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString([], {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function showNotice(message, type = "info") {
        let notice = document.getElementById("historyNotice");

        if (!notice) {
            notice = document.createElement("div");
            notice.id = "historyNotice";

            if (tableBody) {
                tableBody.closest("table")?.before(notice);
            } else {
                document.body.prepend(notice);
            }
        }

        notice.textContent = message;
        notice.style.cssText = `
            padding:12px 16px;
            margin:12px 0;
            border-radius:10px;
            font-size:14px;
            line-height:1.6;
            background:${type === "error" ? "#fee2e2" : "#eff6ff"};
            color:${type === "error" ? "#991b1b" : "#1d4ed8"};
        `;
    }

    // --------------------------------------------------
    // LOAD SUMMARY STATS
    // --------------------------------------------------

    async function loadStats() {
        try {
            const data = await apiRequest("/api/dashboard/stats");

            setText(
                ['[data-stat="total-quizzes"]', "#totalQuizzes"],
                data.total_quizzes ?? 0
            );

            setText(
                ['[data-stat="average-score"]', "#averageScore"],
                `${Number(data.average_score ?? 0).toFixed(1)}%`
            );

            setText(
                ['[data-stat="highest-score"]', "#highestScore"],
                `${Number(data.highest_score ?? 0).toFixed(1)}%`
            );

            setText(
                ['[data-stat="total-attempts"]', "#totalAttempts"],
                data.total_attempts ?? 0
            );
        } catch (error) {
            console.error("Could not load quiz statistics:", error);
            showNotice(error.message, "error");
        }
    }

    // --------------------------------------------------
    // HISTORY TABLE
    // --------------------------------------------------

function renderHistory(items) {
    const tableBody = document.getElementById("historyTableBody");

    if (!tableBody) {
        console.error("historyTableBody not found in HTML.");
        return;
    }

    tableBody.replaceChildren();

    if (!items || items.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 8;
        cell.textContent = "No quiz attempts found yet.";
        cell.style.textAlign = "center";
        cell.style.padding = "28px";

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    items.forEach(attempt => {
        const row = document.createElement("tr");

        const title =
            attempt.quiz_title ||
            attempt.title ||
            attempt.material_title ||
            "Untitled Quiz";

        const total = Number(attempt.total_questions ?? 0);

        // Backend ma score correct answers ni sankhya chhe
        const correct = Number(
            attempt.correct_answers ?? attempt.score ?? 0
        );

        const percentage = Number(
            attempt.percentage ??
            (total > 0 ? (correct / total) * 100 : 0)
        );

        const date = formatDate(
            attempt.submitted_at ||
            attempt.created_at ||
            attempt.date
        );

        const subject =
            attempt.subject ||
            title.match(/java|dbms|python|os|c\+\+/i)?.[0] ||
            "General";

        const values = [
            title,
            subject,
            String(total),
            `${correct} / ${total}`,
            `${percentage.toFixed(1)}%`,
            date,
            "Completed"
        ];

        values.forEach((value, index) => {
            const cell = document.createElement("td");
            cell.textContent = value;

            if (index === 4) {
                cell.style.color =
                    percentage >= 60 ? "#16a34a" : "#dc2626";
                cell.style.fontWeight = "700";
            }

            row.appendChild(cell);
        });

        // 8th column: Action
        const actionCell = document.createElement("td");
        const button = document.createElement("button");

        button.type = "button";
        button.className = "btn-icon";
        button.textContent = "Details";

        button.addEventListener("click", () => {
            window.alert(
                `Quiz: ${title}\n` +
                `Score: ${correct} / ${total}\n` +
                `Percentage: ${percentage.toFixed(1)}%\n` +
                `Date: ${date}`
            );
        });

        actionCell.appendChild(button);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
    });

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

    function showAttemptDetails(attempt) {
        const percentage = Number(attempt.percentage ?? 0);
        const message =
            `${attempt.title || "Quiz"}\n` +
            `Score: ${attempt.score ?? attempt.correct_answers ?? 0} / ${attempt.total_questions ?? 0}\n` +
            `Percentage: ${percentage.toFixed(1)}%\n` +
            `Submitted: ${formatDate(attempt.submitted_at)}`;

        window.alert(message);
    }

    // --------------------------------------------------
    // SEARCH
    // --------------------------------------------------

    function applySearch() {
        const term = (searchInput?.value || "").trim().toLowerCase();

        filteredAttempts = attempts.filter(attempt => {
            const title = String(attempt.title || "").toLowerCase();
            return title.includes(term);
        });

        renderHistory(filteredAttempts);
    }

    searchInput?.addEventListener("input", applySearch);

    // --------------------------------------------------
    // EXPORT ACTUAL HISTORY TO CSV
    // --------------------------------------------------

    function exportCSV() {
        if (!filteredAttempts.length) {
            showNotice("There are no quiz results to export.");
            return;
        }

        const rows = [
            ["Quiz Title", "Score", "Total Questions", "Percentage", "Submitted At"],
            ...filteredAttempts.map(attempt => [
                attempt.title || "Untitled Quiz",
                attempt.score ?? attempt.correct_answers ?? 0,
                attempt.total_questions ?? 0,
                `${Number(attempt.percentage ?? 0).toFixed(1)}%`,
                formatDate(attempt.submitted_at)
            ])
        ];

        const csv = rows.map(row =>
            row.map(value =>
                `"${String(value).replace(/"/g, '""')}"`
            ).join(",")
        ).join("\r\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "quiz-history.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    exportBtn?.addEventListener("click", exportCSV);

    // --------------------------------------------------
    // LOAD REAL HISTORY FROM MONGODB VIA FASTAPI
    // --------------------------------------------------

    async function loadHistory() {
        if (tableBody) {
            tableBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 10;
            cell.textContent = "Loading your quiz history...";
            cell.style.cssText = "text-align:center;padding:28px;";

            row.appendChild(cell);
            tableBody.appendChild(row);
        }

        try {
            const data = await apiRequest("/api/quiz-attempts");

            attempts = Array.isArray(data.attempts) ? data.attempts : [];
            filteredAttempts = [...attempts];

            renderHistory(filteredAttempts);
        } catch (error) {
            console.error("Could not load quiz history:", error);

            if (tableBody) {
                tableBody.replaceChildren();

                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 10;
                cell.textContent = error.message;
                cell.style.cssText =
                    "text-align:center;padding:28px;color:#dc2626;";

                row.appendChild(cell);
                tableBody.appendChild(row);
            }

            showNotice(error.message, "error");
        }
    }

    // --------------------------------------------------
    // BUTTON RIPPLE EFFECT
    // --------------------------------------------------

    document.querySelectorAll(".ripple").forEach(button => {
        button.addEventListener("click", event => {
            const rect = button.getBoundingClientRect();
            const ripple = document.createElement("span");

            ripple.className = "ripple-span";
            ripple.style.left = `${event.clientX - rect.left}px`;
            ripple.style.top = `${event.clientY - rect.top}px`;

            button.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // --------------------------------------------------
    // INITIALIZE PAGE
    // --------------------------------------------------

    loadStats();
    loadHistory();
});
