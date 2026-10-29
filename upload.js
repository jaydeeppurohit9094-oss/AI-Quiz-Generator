
/**
 * AI Quiz Generator
 * Real File Upload + FastAPI + Gemini Quiz Generation
 */

document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------------------------
    // CONFIGURATION
    // ---------------------------------------------------------

    const API_BASE_URL = "http://127.0.0.1:8000";
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".pptx", ".txt"];

    // ---------------------------------------------------------
    // DOM ELEMENTS
    // ---------------------------------------------------------

    const fileInput = document.getElementById("fileInput");
    const progressBar = document.getElementById("progressBar");
    const progressLabel = document.getElementById("progressLabel");
    const progressPercent = document.getElementById("progressPercent");

    const valName = document.getElementById("valName");
    const valStatus = document.getElementById("valStatus");
    const valSize = document.getElementById("valSize");
    const valTime = document.getElementById("valTime");
    const valType = document.getElementById("valType");
    const valPages = document.getElementById("valPages");

    const btnRemove = document.getElementById("btnRemove");
    const btnGenerate = document.getElementById("btnGenerate");
    const btnClose = document.getElementById("btnClose");

    const dropzone = document.querySelector(".upload-dropzone");
    const uploadModal = document.querySelector(".upload-modal");

    if (
        !fileInput || !progressBar || !progressLabel ||
        !progressPercent || !valName || !valStatus ||
        !valSize || !valTime || !valType ||
        !btnRemove || !btnGenerate || !uploadModal
    ) {
        console.error("Upload page elements are missing. Check upload.html.");
        return;
    }

    // ---------------------------------------------------------
    // APPLICATION STATE
    // ---------------------------------------------------------

    let selectedFile = null;
    let uploadedMaterialId = null;
    let isUploading = false;
    let isGenerating = false;
    let uploadRequest = null;

    // ---------------------------------------------------------
    // RESULTS / NOTIFICATIONS UI
    // ---------------------------------------------------------

    const resultContainer = document.createElement("section");
    resultContainer.id = "quizResults";
    resultContainer.style.cssText = `
        margin-top: 24px;
        padding: 20px;
        border-radius: 14px;
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(37,99,235,0.15);
        color: #0f172a;
        display: none;
        overflow-wrap: anywhere;
    `;

    const notification = document.createElement("div");
    notification.id = "uploadNotification";
    notification.setAttribute("role", "status");
    notification.setAttribute("aria-live", "polite");
    notification.style.cssText = `
        display: none;
        margin-top: 16px;
        padding: 12px 14px;
        border-radius: 10px;
        font-size: 14px;
        line-height: 1.5;
        overflow-wrap: anywhere;
    `;

    uploadModal.appendChild(notification);
    uploadModal.appendChild(resultContainer);

    function showMessage(message, type = "info") {
        const styles = {
            info: ["#eff6ff", "#1d4ed8"],
            success: ["#ecfdf5", "#047857"],
            error: ["#fef2f2", "#b91c1c"]
        };

        const colors = styles[type] || styles.info;

        notification.textContent = message;
        notification.style.background = colors[0];
        notification.style.color = colors[1];
        notification.style.display = "block";
    }

    function hideMessage() {
        notification.textContent = "";
        notification.style.display = "none";
    }

    function setProgress(percent, label) {
        const safePercent = Math.max(0, Math.min(100, percent));

        progressBar.style.width = `${safePercent}%`;
        progressPercent.textContent = `${Math.round(safePercent)}%`;
        progressLabel.textContent = label;
    }

    function setStatus(message, success = false) {
        valStatus.textContent = message;
        valStatus.classList.toggle("success", success);
    }

    function getToken() {
        try {
            return localStorage.getItem("ai_quiz_token");
        } catch (error) {
            return null;
        }
    }

    async function readResponse(response) {
        const text = await response.text();

        if (!text) return {};

        try {
            return JSON.parse(text);
        } catch {
            return { detail: text };
        }
    }

    function getErrorMessage(data, fallback) {
        const detail = data?.detail || data?.message;

        if (typeof detail === "string") return detail;

        if (Array.isArray(detail)) {
            return detail
                .map(item => item.msg || JSON.stringify(item))
                .join(", ");
        }

        return fallback;
    }

    // ---------------------------------------------------------
    // FILE VALIDATION
    // ---------------------------------------------------------

    function validateFile(file) {
        if (!file) {
            return "Please choose a file first.";
        }

        const filename = file.name.toLowerCase();
        const extension = ALLOWED_EXTENSIONS.find(ext =>
            filename.endsWith(ext)
        );

        if (!extension) {
            return "Only PDF, DOCX, PPTX and TXT files are supported.";
        }

        if (file.size === 0) {
            return "The selected file is empty.";
        }

        if (file.size > MAX_FILE_SIZE) {
            return "File is too large. Maximum size is 100 MB.";
        }

        return null;
    }

    // ---------------------------------------------------------
    // RESET CURRENT SELECTION
    // ---------------------------------------------------------

    function resetSelection() {
        if (uploadRequest) {
            uploadRequest.abort();
            uploadRequest = null;
        }

        selectedFile = null;
        uploadedMaterialId = null;
        isUploading = false;
        isGenerating = false;

        fileInput.value = "";

        valName.textContent = "--";
        valSize.textContent = "--";
        valType.textContent = "--";
        valTime.textContent = "--";

        if (valPages) valPages.textContent = "--";

        setStatus("Waiting for file...");
        setProgress(0, "Waiting for file...");

        btnGenerate.disabled = true;
        btnRemove.disabled = false;

        resultContainer.replaceChildren();
        resultContainer.style.display = "none";
        hideMessage();

        if (dropzone) dropzone.style.display = "";
    }

    // ---------------------------------------------------------
    // REAL FILE UPLOAD
    // XMLHttpRequest provides upload progress events.
    // ---------------------------------------------------------

    function uploadFile(file) {
        return new Promise((resolve, reject) => {
            const token = getToken();

            if (!token) {
                reject(new Error(
                    "Login token not found. Please log in again."
                ));
                return;
            }

            const formData = new FormData();
            formData.append("file", file);

            const xhr = new XMLHttpRequest();
            uploadRequest = xhr;

            xhr.open("POST", `${API_BASE_URL}/api/materials/upload`);
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.timeout = 180000;

            xhr.upload.addEventListener("progress", event => {
                if (event.lengthComputable) {
                    const percent = (event.loaded / event.total) * 100;

                    setProgress(
                        percent,
                        percent >= 100
                            ? "Upload sent. Waiting for server..."
                            : "Uploading file..."
                    );
                }
            });

            xhr.addEventListener("load", () => {
                uploadRequest = null;

                let data = {};

                try {
                    data = JSON.parse(xhr.responseText || "{}");
                } catch {
                    reject(new Error("The server returned an invalid response."));
                    return;
                }

                if (xhr.status < 200 || xhr.status >= 300) {
                    const message = getErrorMessage(
                        data,
                        `Upload failed (HTTP ${xhr.status}).`
                    );

                    if (xhr.status === 401) {
                        reject(new Error(
                            "Your login session is invalid or expired. Please log in again."
                        ));
                    } else {
                        reject(new Error(message));
                    }

                    return;
                }

                resolve(data);
            });

            xhr.addEventListener("error", () => {
                uploadRequest = null;
                reject(new Error(
                    "Cannot connect to FastAPI. Make sure the backend is running."
                ));
            });

            xhr.addEventListener("timeout", () => {
                uploadRequest = null;
                reject(new Error("Upload timed out. Please try again."));
            });

            xhr.addEventListener("abort", () => {
                uploadRequest = null;
                reject(new Error("Upload cancelled."));
            });

            xhr.send(formData);
        });
    }

    // ---------------------------------------------------------
    // FILE SELECTION AND AUTOMATIC UPLOAD
    // ---------------------------------------------------------

    async function handleFile(file) {
        if (isUploading || isGenerating) return;

        hideMessage();

        const validationError = validateFile(file);

        if (validationError) {
            showMessage(validationError, "error");
            fileInput.value = "";
            return;
        }

        resetSelection();

        selectedFile = file;

        valName.textContent = file.name;
        valSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
        valType.textContent = file.name.split(".").pop().toUpperCase();
        valTime.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        if (valPages) {
            valPages.textContent = "Available after processing";
        }

        isUploading = true;
        btnGenerate.disabled = true;
        btnRemove.disabled = true;

        setStatus("Uploading...");
        setProgress(0, "Connecting to server...");

        try {
            const data = await uploadFile(file);
            const material = data.material;

            if (!material || !material.id) {
                throw new Error(
                    "Upload response did not contain a material ID."
                );
            }

            uploadedMaterialId = material.id;

            setProgress(100, "Upload complete");
            setStatus("Uploaded Successfully", true);

            showMessage(
                data.message || "File uploaded successfully. You can now generate a quiz.",
                "success"
            );
        } catch (error) {
            uploadedMaterialId = null;
            setStatus("Upload failed");
            setProgress(0, "Upload failed");

            if (selectedFile === file) {
                showMessage(error.message || "File upload failed.", "error");
            }
        } finally {
            isUploading = false;
            btnRemove.disabled = false;
            btnGenerate.disabled = !uploadedMaterialId;
        }
    }

    fileInput.setAttribute(
        "accept",
        ".pdf,.docx,.pptx,.txt,application/pdf,text/plain"
    );

    fileInput.addEventListener("change", event => {
        const file = event.target.files?.[0];

        if (file) {
            handleFile(file);
        }
    });

    // ---------------------------------------------------------
    // DRAG AND DROP
    // ---------------------------------------------------------

    if (dropzone) {
        dropzone.addEventListener("dragover", event => {
            event.preventDefault();
            dropzone.classList.add("drag-over");
        });

        dropzone.addEventListener("dragleave", event => {
            if (!dropzone.contains(event.relatedTarget)) {
                dropzone.classList.remove("drag-over");
            }
        });

        dropzone.addEventListener("drop", event => {
            event.preventDefault();
            dropzone.classList.remove("drag-over");

            const file = event.dataTransfer?.files?.[0];

            if (file) {
                if (isUploading || isGenerating) return;

                // Use the same handler for drag-and-drop.
                handleFile(file);
            }
        });
    }

    // ---------------------------------------------------------
    // GENERATE QUIZ FROM THE UPLOADED MATERIAL
    // ---------------------------------------------------------

    async function generateQuiz() {
        if (isUploading || isGenerating) return;

        if (!uploadedMaterialId) {
            showMessage(
                "Please upload a file successfully before generating a quiz.",
                "error"
            );
            return;
        }

        const token = getToken();

        if (!token) {
            showMessage(
                "Login token not found. Please log in again.",
                "error"
            );
            return;
        }

        isGenerating = true;
        btnGenerate.disabled = true;
        btnRemove.disabled = true;

        resultContainer.replaceChildren();
        resultContainer.style.display = "none";

        setStatus("Generating quiz...");
        setProgress(100, "Generating questions with AI...");

        showMessage(
            "Gemini is reading your study material and preparing questions. Please wait.",
            "info"
        );

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/materials/${encodeURIComponent(uploadedMaterialId)}/generate-quiz?question_count=5`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const data = await readResponse(response);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Your login session is invalid or expired. Please log in again."
                    );
                }

                throw new Error(
                    getErrorMessage(data, `Quiz generation failed (HTTP ${response.status}).`)
                );
            }

            const quiz = data.quiz;

            if (!quiz || !Array.isArray(quiz.questions)) {
                throw new Error("The server returned an invalid quiz.");
            }

            renderQuiz(quiz);

            setStatus("Quiz Generated Successfully", true);
            setProgress(100, "Quiz generation complete");

            showMessage(
                data.message || "Quiz generated and saved successfully.",
                "success"
            );
        } catch (error) {
            setStatus("Quiz generation failed");

            showMessage(
                error.message || "Could not generate the quiz. Please try again.",
                "error"
            );
        } finally {
            isGenerating = false;
            btnRemove.disabled = false;
            btnGenerate.disabled = !uploadedMaterialId;
        }
    }

    btnGenerate.addEventListener("click", generateQuiz);

    // ---------------------------------------------------------
    // DISPLAY GENERATED QUESTIONS
    // Use textContent to avoid interpreting AI text as HTML.
    // ---------------------------------------------------------

 
function renderQuiz(quiz) {
    resultContainer.replaceChildren();
    resultContainer.style.display = "block";

    // Quiz header
    const heading = document.createElement("h2");
    heading.textContent = quiz.title || "Your Generated Quiz";

    const summary = document.createElement("p");
    summary.textContent =
        `${quiz.questions.length} questions • Select one answer for each question`;

    resultContainer.append(heading, summary);

    // Interactive quiz state
    const questions = quiz.questions;
    const selectedAnswers = new Array(questions.length).fill(null);
    let submitted = false;

    const questionCards = [];

    // Score/result summary
    const scorePanel = document.createElement("div");
    scorePanel.style.cssText = `
        display:none;
        margin:20px 0;
        padding:22px;
        border-radius:16px;
        background:#eef2ff;
        border:1px solid #c7d2fe;
        color:#1e1b4b;
        text-align:center;
    `;

    // Main quiz form
    const quizForm = document.createElement("form");
    
    quizForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (submitted) return;

        const token = getToken();

        if (!token) {
            showMessage("Please log in again. Login token not found.", "error");
            return;
        }

        if (!quiz.id) {
            showMessage("Quiz ID is missing. Please generate the quiz again.", "error");
            return;
        }

        submitted = true;
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/quizzes/${encodeURIComponent(quiz.id)}/submit`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        answers: selectedAnswers
                    })
                }
            );

            console.log("SUBMIT STATUS:", response.status);

const debugResponse = await response.clone().json();
console.log("SUBMIT RESPONSE:", debugResponse);

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(data, `Quiz submission failed (HTTP ${response.status}).`)
                );
            }

            
const score = Number(
    data.correct_count ?? data.score ?? 0
);

const total = Number(
    data.total_questions ?? questions.length
);

const percentage = Number(
    data.percentage ??
    (total > 0 ? (score / total) * 100 : 0)
);

const answered = selectedAnswers.filter(
    answer => answer !== null
).length;


            questions.forEach((question, index) => {
                const card = questionCards[index];
                const options = Array.isArray(question.options)
                    ? question.options
                    : [];

                const correctAnswer = String(
                    question.correct_answer ?? ""
                ).trim();

                const selectedAnswer = selectedAnswers[index];

                const isCorrect =
                    selectedAnswer !== null &&
                    String(options[selectedAnswer]).trim() === correctAnswer;

                card.querySelectorAll(".quiz-option").forEach(
                    (label, optionIndex) => {
                        const optionText = String(
                            options[optionIndex] ?? ""
                        ).trim();

                        const radio = label.querySelector("input");
                        if (radio) radio.disabled = true;

                        label.style.cursor = "default";

                        if (optionText === correctAnswer) {
                            label.style.background = "#dcfce7";
                            label.style.borderColor = "#16a34a";
                            label.style.color = "#166534";
                        } else if (selectedAnswer === optionIndex) {
                            label.style.background = "#fee2e2";
                            label.style.borderColor = "#dc2626";
                            label.style.color = "#991b1b";
                        } else {
                            label.style.opacity = "0.72";
                        }
                    }
                );

                const feedback = card.querySelector(".quiz-feedback");
                feedback.style.display = "block";

                if (selectedAnswer === null) {
                    feedback.textContent =
                        `Not answered. Correct answer: ${correctAnswer}`;
                    feedback.style.background = "#fff7ed";
                    feedback.style.color = "#9a3412";
                } else if (isCorrect) {
                    feedback.textContent = "✓ Correct answer!";
                    feedback.style.background = "#dcfce7";
                    feedback.style.color = "#166534";
                } else {
                    feedback.textContent =
                        `✗ Incorrect. Correct answer: ${correctAnswer}`;
                    feedback.style.background = "#fee2e2";
                    feedback.style.color = "#991b1b";
                }

                const explanation = card.querySelector(".quiz-explanation");
                if (question.explanation && explanation) {
                    explanation.style.display = "block";
                }
            });

            scorePanel.replaceChildren();
            scorePanel.style.display = "block";

            const scoreTitle = document.createElement("h3");
            scoreTitle.textContent = "Quiz Results";

            const scoreNumber = document.createElement("div");
            scoreNumber.textContent = `${score} / ${total}`;
            scoreNumber.style.cssText =
                "font-size:36px;font-weight:800;margin:8px 0;color:" +
                (percentage >= 60 ? "#15803d" : "#4338ca");

            const scoreDetails = document.createElement("p");
            scoreDetails.textContent =
                `${percentage}% score • ${answered} answered • ` +
                `${total - answered} unanswered`;

            const scoreMessage = document.createElement("p");
            scoreMessage.textContent =
                percentage >= 80
                    ? "Excellent work! Keep it up."
                    : percentage >= 60
                        ? "Good effort! Keep practising."
                        : "Keep learning. Try the quiz again!";

            scorePanel.append(
                scoreTitle,
                scoreNumber,
                scoreDetails,
                scoreMessage
            );

            submitButton.textContent = "Quiz Submitted";
            retakeButton.style.display = "inline-block";

            showMessage(
                data.message || "Quiz result saved successfully!",
                "success"
            );

            scorePanel.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        } catch (error) {
            submitted = false;
            submitButton.disabled = false;
            submitButton.textContent = "Submit Quiz";

            showMessage(
                error.message || "Could not save your quiz result.",
                "error"
            );
        }
    });

    // Create each question card
    questions.forEach((question, index) => {
        const card = document.createElement("article");

        card.style.cssText = `
            padding:22px;
            margin:18px 0;
            background:#ffffff;
            border:1px solid #dbe3f0;
            border-left:5px solid #4f46e5;
            border-radius:16px;
            box-shadow:0 5px 16px rgba(15,23,42,0.05);
            box-sizing:border-box;
        `;

        const questionTitle = document.createElement("h3");
        questionTitle.textContent =
            `Question ${index + 1}: ${question.question || ""}`;

        questionTitle.style.cssText = `
            margin:0 0 18px;
            color:#172554;
            font-size:17px;
            line-height:1.7;
        `;

        card.appendChild(questionTitle);

        const options = Array.isArray(question.options)
            ? question.options
            : [];

        options.forEach((option, optionIndex) => {
            const label = document.createElement("label");
            label.className = "quiz-option";

            label.style.cssText = `
                display:flex;
                align-items:flex-start;
                gap:12px;
                padding:14px 15px;
                margin:10px 0;
                border:1px solid #dce5ff;
                border-radius:12px;
                background:#f1f5ff;
                color:#25345b;
                cursor:pointer;
                line-height:1.65;
                transition:background 0.2s,border-color 0.2s;
                overflow-wrap:anywhere;
                box-sizing:border-box;
            `;

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = `quiz_question_${index}`;
            radio.value = String(optionIndex);
            radio.style.cssText = `
                margin-top:5px;
                accent-color:#4f46e5;
                flex-shrink:0;
            `;

            radio.addEventListener("change", () => {
                if (!submitted) {
                    selectedAnswers[index] = optionIndex;
                }
            });

            const optionText = document.createElement("span");
            optionText.textContent =
                `${String.fromCharCode(65 + optionIndex)}. ${option}`;

            label.addEventListener("mouseenter", () => {
                if (!submitted) {
                    label.style.background = "#e0e7ff";
                    label.style.borderColor = "#818cf8";
                }
            });

            label.addEventListener("mouseleave", () => {
                if (!submitted) {
                    label.style.background = "#f1f5ff";
                    label.style.borderColor = "#dce5ff";
                }
            });

            label.append(radio, optionText);
            card.appendChild(label);
        });

        // Feedback hidden until submission
        const feedback = document.createElement("div");
        feedback.className = "quiz-feedback";
        feedback.style.cssText = `
            display:none;
            margin-top:16px;
            padding:12px 14px;
            border-radius:10px;
            font-size:14px;
            font-weight:700;
            line-height:1.6;
            overflow-wrap:anywhere;
        `;

        card.appendChild(feedback);

        // Explanation hidden until submission
        const explanation = document.createElement("div");
        explanation.className = "quiz-explanation";
        explanation.textContent = question.explanation
            ? `Explanation: ${question.explanation}`
            : "";

        explanation.style.cssText = `
            display:none;
            margin-top:12px;
            padding:15px;
            background:#fff7ed;
            color:#7c2d12;
            border:1px solid #fed7aa;
            border-left:4px solid #f59e0b;
            border-radius:10px;
            font-size:14px;
            line-height:1.8;
            overflow-wrap:anywhere;
        `;

        card.appendChild(explanation);

        questionCards.push(card);
        quizForm.appendChild(card);
    });

    // Submit button
    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Submit Quiz";

    submitButton.style.cssText = `
        padding:14px 25px;
        margin:10px 10px 10px 0;
        border:0;
        border-radius:12px;
        background:linear-gradient(135deg,#4f46e5,#4338ca);
        color:#ffffff;
        font-size:15px;
        font-weight:700;
        cursor:pointer;
        box-shadow:0 5px 14px rgba(79,70,229,0.2);
    `;

    // Retake button
    const retakeButton = document.createElement("button");
    retakeButton.type = "button";
    retakeButton.textContent = "Retake Quiz";
    retakeButton.style.cssText = `
        display:none;
        padding:14px 25px;
        margin:10px 0;
        border:1px solid #c7d2fe;
        border-radius:12px;
        background:#eef2ff;
        color:#3730a3;
        font-size:15px;
        font-weight:700;
        cursor:pointer;
    `;

    retakeButton.addEventListener("click", () => {
        selectedAnswers.fill(null);
        submitted = false;

        quizForm.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
            radio.disabled = false;
        });

        questionCards.forEach(card => {
            card.querySelectorAll(".quiz-option").forEach(label => {
                label.style.background = "#f1f5ff";
                label.style.borderColor = "#dce5ff";
                label.style.color = "#25345b";
                label.style.opacity = "1";
                label.style.cursor = "pointer";
            });

            const feedback = card.querySelector(".quiz-feedback");
            feedback.textContent = "";
            feedback.style.display = "none";

            const explanation = card.querySelector(".quiz-explanation");
            explanation.style.display = "none";
        });

        scorePanel.replaceChildren();
        scorePanel.style.display = "none";

        submitButton.disabled = false;
        submitButton.textContent = "Submit Quiz";
        retakeButton.style.display = "none";

        quizForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
        margin-top:20px;
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:8px;
    `;

    buttonContainer.append(submitButton, retakeButton);

    quizForm.appendChild(buttonContainer);

    resultContainer.append(scorePanel, quizForm);

    resultContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


    // ---------------------------------------------------------
    // REMOVE CURRENT FILE SELECTION
    // This clears the page selection; it does not delete the
    // previously uploaded file from MongoDB/server storage.
    // ---------------------------------------------------------

    btnRemove.addEventListener("click", () => {
        if (isGenerating) return;

        if (isUploading && uploadRequest) {
            uploadRequest.abort();
        }

        resetSelection();
    });

    // ---------------------------------------------------------
    // CLOSE / RETURN TO DASHBOARD
    // ---------------------------------------------------------

    if (btnClose) {
        btnClose.addEventListener("click", () => {
            window.location.href = "deshboard.html";
        });
    }

    // ---------------------------------------------------------
    // SIDEBAR MOBILE CONTROLS
    // sidebar.js may also manage these controls; avoid adding
    // duplicate listeners if that file is already handling them.
    // ---------------------------------------------------------

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    console.log("AI Quiz Generator upload module initialized.");
});


/* =========================================
   SIDEBAR MOBILE TOGGLE
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebarToggleBtn");
    const closeBtn = document.getElementById("closeSidebar");

    if (!sidebar || !toggleBtn || !closeBtn) {
        console.error("Sidebar elements not found!");
        return;
    }

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("open");
    });

    closeBtn.addEventListener("click", function () {
        sidebar.classList.remove("open");
    });

    // Close sidebar when clicking outside it on mobile
    document.addEventListener("click", function (event) {
        if (window.innerWidth <= 1024) {
            if (
                !sidebar.contains(event.target) &&
                !toggleBtn.contains(event.target)
            ) {
                sidebar.classList.remove("open");
            }
        }
    });
});
