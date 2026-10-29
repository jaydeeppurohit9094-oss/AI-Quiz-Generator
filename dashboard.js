
const API_BASE_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", async () => {
    // ------------------------------------------
    // 1. Authentication
    // ------------------------------------------
    const token = localStorage.getItem("ai_quiz_token");
    const savedUser = localStorage.getItem("ai_quiz_user");

    if (!token || !savedUser) {
        window.location.replace("login.html");
        return;
    }

    let user;

    try {
        user = JSON.parse(savedUser);
    } catch {
        localStorage.removeItem("ai_quiz_user");
        localStorage.removeItem("ai_quiz_token");
        window.location.replace("login.html");
        return;
    }

    const name = user.name || "Student";

    const welcomeHeading = document.getElementById("welcomeHeading");
    const dashboardUserName = document.getElementById("dashboardUserName");
    const userAvatar = document.getElementById("userAvatar");

    if (welcomeHeading) welcomeHeading.textContent = `Welcome back, ${name}`;
    if (dashboardUserName) dashboardUserName.textContent = name;

    if (userAvatar) {
        userAvatar.src =
            "https://ui-avatars.com/api/?name=" +
            encodeURIComponent(name) +
            "&background=2563EB&color=fff";
        userAvatar.alt = `${name}'s Avatar`;
    }

    // ------------------------------------------
    // 2. API Helper
    // ------------------------------------------
    async function apiRequest(endpoint, options = {}) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            localStorage.removeItem("ai_quiz_token");
            localStorage.removeItem("ai_quiz_user");
            window.location.replace("login.html");
            throw new Error("Session expired. Please log in again.");
        }

        if (!response.ok) {
            throw new Error(
                data.detail || data.message || "Request failed. Please try again."
            );
        }

        return data;
    }

    // ------------------------------------------
    // 3. Toast Messages
    // ------------------------------------------
    function showToast(message, type = "success") {
        const container = document.getElementById("toast-container");
        if (!container) {
            alert(message);
            return;
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            padding: 12px 20px;
            margin: 10px 0;
            border-radius: 8px;
            background: ${type === "error" ? "#EF4444" :
                type === "info" ? "#3B82F6" : "#10B981"};
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,.15);
        `;

        // Use textContent so server messages are not treated as HTML.
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 4000);
    }

    // ------------------------------------------
    // 4. Current Date
    // ------------------------------------------
    const dateElement = document.getElementById("currentDate");

    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    // ------------------------------------------
    // 5. Mobile Sidebar
    // ------------------------------------------
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const closeSidebar = document.getElementById("closeSidebar");

    menuToggle?.addEventListener("click", () => {
        sidebar?.classList.add("active");
    });

    closeSidebar?.addEventListener("click", () => {
        sidebar?.classList.remove("active");
    });

    // ------------------------------------------
    // 6. Theme Toggle
    // ------------------------------------------
    const themeToggle = document.getElementById("themeToggle");

    function applyTheme(theme) {
        document.body.classList.toggle("dark-theme", theme === "dark");

        if (themeToggle) {
            themeToggle.innerHTML = theme === "dark"
                ? '<i class="fa-solid fa-sun"></i>'
                : '<i class="fa-solid fa-moon"></i>';
        }
    }

    applyTheme(localStorage.getItem("theme") || "light");

    themeToggle?.addEventListener("click", () => {
        const nextTheme = document.body.classList.contains("dark-theme")
            ? "light"
            : "dark";

        localStorage.setItem("theme", nextTheme);
        applyTheme(nextTheme);
    });

    // ------------------------------------------
    // 7. Dashboard Statistics from Backend
    // ------------------------------------------
    const statValues = document.querySelectorAll(".stat-value");
    const statStatuses = document.querySelectorAll(".stat-status");

    function animateValue(element, target, suffix = "") {
        const duration = 800;
        const startTime = performance.now();

        element.textContent = `0${suffix}`;

        function update(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const current = Math.round(target * progress);

            element.textContent = `${current}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    async function loadDashboardData() {
        try {
            const [materialsData, quizzesData] = await Promise.all([
                apiRequest("/api/materials"),
                apiRequest("/api/quizzes")
            ]);

            const materials = materialsData.materials || [];
            const quizzes = quizzesData.quizzes || [];

            if (statValues[0]) {
                animateValue(statValues[0], materials.length);
            }

            if (statValues[1]) {
                animateValue(statValues[1], quizzes.length);
            }

            // These metrics are not yet provided by the backend.
            if (statValues[2]) statValues[2].textContent = "—";
            if (statValues[3]) statValues[3].textContent = "—";

            if (statStatuses[0]) {
                statStatuses[0].textContent = "Uploaded study materials";
            }

            if (statStatuses[1]) {
                statStatuses[1].textContent = "AI-generated quizzes";
            }

            if (statStatuses[2]) {
                statStatuses[2].textContent = "Available after quiz attempts";
            }

            if (statStatuses[3]) {
                statStatuses[3].textContent = "Study tracking not available yet";
            }
        } catch (error) {
            console.error("Dashboard data error:", error);
            showToast(error.message || "Could not load dashboard data.", "error");
        }
    }

    // ------------------------------------------
    // 8. Upload Modal
    // ------------------------------------------
    const uploadModal = document.getElementById("upload-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const uploadButton = document.querySelector(".hero-actions .btn-upload");

    const dropZone = document.getElementById("modal-drop-zone");
    const fileInput = document.getElementById("modal-file-input");
    const chooseFileButton = document.getElementById("modal-btn-choose-file");

    const progressContainer = document.getElementById("upload-progress-container");
    const progressBar = document.getElementById("progress-bar");
    const uploadPercentage = document.getElementById("upload-percentage");
    const uploadingFileName = document.getElementById("uploading-file-name");

    const fileInfoCard = document.getElementById("file-info-card");
    const btnRemove = document.getElementById("btn-remove");
    const btnGenerate = document.getElementById("btn-generate");

    let uploadedMaterialId = null;
    let uploadInProgress = false;
    let generationInProgress = false;

    function openModal() {
        uploadModal?.classList.remove("hidden");
    }

    function closeModal() {
        uploadModal?.classList.add("hidden");
    }

    uploadButton?.addEventListener("click", openModal);
    closeModalBtn?.addEventListener("click", closeModal);

    window.addEventListener("click", (event) => {
        if (event.target === uploadModal) closeModal();
    });

    chooseFileButton?.addEventListener("click", () => {
        fileInput?.click();
    });

    function resetUploadUI() {
        uploadedMaterialId = null;

        if (fileInput) fileInput.value = "";

        fileInfoCard?.classList.add("hidden");
        progressContainer?.classList.add("hidden");
        dropZone?.classList.remove("hidden");
        btnRemove?.classList.add("hidden");

        if (btnGenerate) {
            btnGenerate.disabled = true;
            btnGenerate.innerHTML =
                '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Quiz';
        }

        if (progressBar) progressBar.style.width = "0%";
        if (uploadPercentage) uploadPercentage.textContent = "0%";
    }

    function displayFileInfo(file, material) {
        fileInfoCard?.classList.remove("hidden");
        btnRemove?.classList.remove("hidden");
        dropZone?.classList.add("hidden");

        document.getElementById("info-name").textContent = file.name;
        document.getElementById("info-size").textContent =
            `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

        document.getElementById("info-type").textContent =
            file.name.split(".").pop().toUpperCase();

        document.getElementById("info-time").textContent =
            new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

        // Page count is not returned by the current upload API.
        document.getElementById("info-pages").textContent = "Not available";

        uploadedMaterialId = material.id;

        if (btnGenerate) btnGenerate.disabled = false;
    }

    // ------------------------------------------
    // 9. Real File Upload API
    // ------------------------------------------
    async function handleFileUpload(file) {
        if (!file || uploadInProgress || generationInProgress) return;

        const allowedExtensions = ["pdf", "docx", "pptx", "txt"];
        const extension = file.name.split(".").pop().toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            showToast("Only PDF, DOCX, PPTX and TXT files are supported.", "error");
            if (fileInput) fileInput.value = "";
            return;
        }

        if (file.size === 0) {
            showToast("The selected file is empty.", "error");
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            showToast("Maximum file size is 100 MB.", "error");
            return;
        }

        uploadInProgress = true;
        uploadedMaterialId = null;

        dropZone?.classList.add("hidden");
        fileInfoCard?.classList.add("hidden");
        progressContainer?.classList.remove("hidden");

        if (uploadingFileName) {
            uploadingFileName.textContent = `Uploading ${file.name}...`;
        }

        if (uploadPercentage) uploadPercentage.textContent = "Uploading...";
        if (progressBar) progressBar.style.width = "30%";
        if (btnGenerate) btnGenerate.disabled = true;

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Do not manually set Content-Type for FormData.
            const result = await apiRequest("/api/materials/upload", {
                method: "POST",
                body: formData
            });

            if (!result.material?.id) {
                throw new Error("Upload succeeded but material ID was not returned.");
            }

            if (progressBar) progressBar.style.width = "100%";
            if (uploadPercentage) uploadPercentage.textContent = "100%";

            displayFileInfo(file, result.material);

            showToast("File uploaded successfully!", "success");
            await loadDashboardData();
        } catch (error) {
            console.error("Upload error:", error);
            resetUploadUI();
            showToast(error.message || "File upload failed.", "error");
        } finally {
            uploadInProgress = false;
        }
    }

    fileInput?.addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (file) handleFileUpload(file);
    });

    dropZone?.addEventListener("dragover", (event) => {
        event.preventDefault();
    });

    dropZone?.addEventListener("drop", (event) => {
        event.preventDefault();

        const file = event.dataTransfer?.files?.[0];
        if (file) handleFileUpload(file);
    });

    btnRemove?.addEventListener("click", () => {
        if (uploadInProgress || generationInProgress) return;

        resetUploadUI();
        showToast("Selected file cleared. The uploaded file remains in your account.", "info");
    });

    // ------------------------------------------
    // 10. Real AI Quiz Generation API
    // ------------------------------------------
    btnGenerate?.addEventListener("click", async () => {
        if (!uploadedMaterialId || generationInProgress) {
            showToast("Please upload a file first.", "error");
            return;
        }

        generationInProgress = true;
        btnGenerate.disabled = true;
        btnGenerate.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Generating Quiz...';

        showToast("AI is reading your material and generating questions...", "info");

        try {
            const result = await apiRequest(
                `/api/materials/${encodeURIComponent(uploadedMaterialId)}/generate-quiz?question_count=5`,
                { method: "POST" }
            );

            if (!result.quiz?.id) {
                throw new Error("Quiz generation response did not include a quiz ID.");
            }

            showToast(
                `Quiz generated successfully! ${result.quiz.question_count} questions saved.`,
                "success"
            );

            closeModal();
            resetUploadUI();

            await loadDashboardData();
        } catch (error) {
            console.error("Quiz generation error:", error);
            showToast(error.message || "Quiz generation failed.", "error");
        } finally {
            generationInProgress = false;

            if (btnGenerate) {
                btnGenerate.disabled = !uploadedMaterialId;
                btnGenerate.innerHTML =
                    '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Quiz';
            }
        }
    });

    // ------------------------------------------
    // 11. Logout
    // ------------------------------------------
    document.querySelector(".footer-btn.logout")?.addEventListener("click", (event) => {
        event.preventDefault();

        localStorage.removeItem("ai_quiz_token");
        localStorage.removeItem("ai_quiz_user");
        localStorage.removeItem("ai_quiz_student_email");

        window.location.replace("login.html");
    });

    // ------------------------------------------
    // 12. Load Dashboard
    // ------------------------------------------
    await loadDashboardData();
});

window.addEventListener("pageshow", () => {
    if (
        window.location.pathname.endsWith("deshboard.html") &&
        (!localStorage.getItem("ai_quiz_token") ||
         !localStorage.getItem("ai_quiz_user"))
    ) {
        window.location.replace("login.html");
    }
});
