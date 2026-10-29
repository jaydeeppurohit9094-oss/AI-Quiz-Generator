/**
 * AI Quiz Generator — Performance Module
 * Modular frontend scripts handling dynamic data, canvas chart rendering,
 * donut visualizations, animations, and responsive interactions.
 */

// Centralized state container (API-ready for backend integration)
const performanceStore = {
  "7d": {
    averageScore: 82,
    quizzesCompleted: 35,
    questionsCorrect: 428,
    bestScore: 96,
    scoreDiff: "+5.4% from last week",
    quizDiff: "+6 this week",
    accuracyVal: "80%",
    breakdown: { correct: 428, wrong: 92, skipped: 15 },
    quizScores: [
      { quiz: "Quiz 1", score: 68 },
      { quiz: "Quiz 2", score: 74 },
      { quiz: "Quiz 3", score: 71 },
      { quiz: "Quiz 4", score: 80 },
      { quiz: "Quiz 5", score: 78 },
      { quiz: "Quiz 6", score: 86 },
      { quiz: "Quiz 7", score: 82 },
      { quiz: "Quiz 8", score: 92 }
    ],
    subjects: [
      { name: "Java", percentage: 92 },
      { name: "DBMS", percentage: 88 },
      { name: "Cyber Security", percentage: 88 },
      { name: "Computer Networks", percentage: 84 },
      { name: "Operating System", percentage: 73 }
    ],
    strengths: [
      { topic: "Java Basics", score: 94 },
      { topic: "DBMS Queries", score: 91 },
      { topic: "Computer Networks", score: 88 }
    ],
    improvements: [
      { topic: "Operating System", score: 68 },
      { topic: "Data Structures", score: 71 },
      { topic: "Cyber Security", score: 74 }
    ],
    recentQuizzes: [
      { name: "Java Unit 1 Quiz", subject: "Java", score: 92, accuracy: 90, questions: 20, date: "Aug 21, 2026", status: "Excellent" },
      { name: "DBMS Quiz", subject: "DBMS", score: 85, accuracy: 83, questions: 25, date: "Aug 20, 2026", status: "Good" },
      { name: "Operating System Quiz", subject: "Operating System", score: 72, accuracy: 70, questions: 20, date: "Aug 19, 2026", status: "Needs Work" },
      { name: "Computer Networks Quiz", subject: "Computer Networks", score: 88, accuracy: 86, questions: 25, date: "Aug 18, 2026", status: "Good" }
    ]
  },
  "30d": {
    averageScore: 78,
    quizzesCompleted: 112,
    questionsCorrect: 1420,
    bestScore: 98,
    scoreDiff: "+8.1% from last month",
    quizDiff: "+24 this month",
    accuracyVal: "76%",
    breakdown: { correct: 1420, wrong: 380, skipped: 60 },
    quizScores: [
      { quiz: "Q1", score: 60 },
      { quiz: "Q5", score: 67 },
      { quiz: "Q10", score: 72 },
      { quiz: "Q15", score: 75 },
      { quiz: "Q20", score: 82 },
      { quiz: "Q25", score: 88 },
      { quiz: "Q30", score: 92 }
    ],
    subjects: [
      { name: "Java", percentage: 89 },
      { name: "DBMS", percentage: 84 },
      { name: "Cyber Security", percentage: 80 },
      { name: "Computer Networks", percentage: 79 },
      { name: "Operating System", percentage: 69 }
    ],
    strengths: [
      { topic: "OOP Concepts", score: 92 },
      { topic: "Relational Algebra", score: 89 },
      { topic: "Routing Protocols", score: 85 }
    ],
    improvements: [
      { topic: "Memory Management", score: 62 },
      { topic: "Trees & Graphs", score: 66 },
      { topic: "Cryptography", score: 70 }
    ],
    recentQuizzes: [
      { name: "Java Fundamentals", subject: "Java", score: 94, accuracy: 92, questions: 30, date: "Aug 15, 2026", status: "Excellent" },
      { name: "SQL Indexing", subject: "DBMS", score: 79, accuracy: 75, questions: 20, date: "Aug 12, 2026", status: "Average" }
    ]
  },
  "3m": {
    averageScore: 75,
    quizzesCompleted: 260,
    questionsCorrect: 3100,
    bestScore: 98,
    scoreDiff: "+12.3% overall",
    quizDiff: "+75 this quarter",
    accuracyVal: "74%",
    breakdown: { correct: 3100, wrong: 920, skipped: 180 },
    quizScores: [
      { quiz: "M1-1", score: 55 },
      { quiz: "M1-4", score: 62 },
      { quiz: "M2-1", score: 70 },
      { quiz: "M2-4", score: 78 },
      { quiz: "M3-1", score: 84 },
      { quiz: "M3-4", score: 90 }
    ],
    subjects: [
      { name: "Java", percentage: 86 },
      { name: "DBMS", percentage: 82 },
      { name: "Cyber Security", percentage: 76 },
      { name: "Computer Networks", percentage: 74 },
      { name: "Operating System", percentage: 65 }
    ],
    strengths: [
      { topic: "Java Syntax", score: 90 },
      { topic: "Entity Relations", score: 86 }
    ],
    improvements: [
      { topic: "Deadlocks & Threads", score: 58 },
      { topic: "Dynamic Programming", score: 62 }
    ],
    recentQuizzes: [
      { name: "Midterm Prep Quiz", subject: "Computer Networks", score: 82, accuracy: 80, questions: 40, date: "Jul 22, 2026", status: "Good" }
    ]
  },
  "all": {
    averageScore: 79,
    quizzesCompleted: 420,
    questionsCorrect: 5400,
    bestScore: 100,
    scoreDiff: "+15.8% all time",
    quizDiff: "Total 420 runs",
    accuracyVal: "78%",
    breakdown: { correct: 5400, wrong: 1200, skipped: 240 },
    quizScores: [
      { quiz: "Start", score: 50 },
      { quiz: "Q100", score: 65 },
      { quiz: "Q200", score: 74 },
      { quiz: "Q300", score: 83 },
      { quiz: "Q420", score: 92 }
    ],
    subjects: [
      { name: "Java", percentage: 90 },
      { name: "DBMS", percentage: 86 },
      { name: "Cyber Security", percentage: 82 },
      { name: "Computer Networks", percentage: 80 },
      { name: "Operating System", percentage: 71 }
    ],
    strengths: [
      { topic: "Core Java", score: 93 },
      { topic: "SQL Queries", score: 89 }
    ],
    improvements: [
      { topic: "Process Scheduling", score: 64 },
      { topic: "Graph Algorithms", score: 68 }
    ],
    recentQuizzes: [
      { name: "Comprehensive Revision", subject: "Operating System", score: 76, accuracy: 72, questions: 50, date: "Jun 10, 2026", status: "Average" }
    ]
  }
};

/* ==========================================================================
   State & Canvas Chart Controller
   ========================================================================== */
class PerformanceApp {
  constructor() {
    this.currentRange = "7d";
    this.currentData = null;
    this.canvas = document.getElementById("scoreChart");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.tooltip = document.getElementById("chartTooltip");
    this.chartPoints = [];
    this.animationProgress = 0;
    this.animFrameId = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderAll();
    window.addEventListener("resize", () => this.resizeAndDrawChart());
  }

  setupEventListeners() {
    // Time filter change
    const timeFilter = document.getElementById("timeFilterSelect");
    if (timeFilter) {
  timeFilter.addEventListener("change", async (e) => {
    this.currentRange = e.target.value;
    await this.renderAll();
  });
}

    // Mobile Sidebar toggle
    const mobileBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    if (mobileBtn && sidebar && backdrop) {
      mobileBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        backdrop.classList.toggle("active");
      });

      backdrop.addEventListener("click", () => {
        sidebar.classList.remove("open");
        backdrop.classList.remove("active");
      });
    }

    // Chart Tooltip Hover Listener
    if (this.canvas) {
      this.canvas.addEventListener("mousemove", (e) => this.handleChartHover(e));
      this.canvas.addEventListener("mouseleave", () => {
        if (this.tooltip) this.tooltip.style.opacity = "0";
      });
    }
  }


async renderAll() {
  const content = document.getElementById("performanceContent");
  const empty = document.getElementById("emptyState");

  try {
    if (content) content.classList.add("hidden");
    if (empty) {
      empty.classList.remove("hidden");
      empty.textContent = "Loading your performance...";
    }

    // JWT token શોધો
    const tokenKeys = [
      "ai_quiz_token",
      "access_token",
      "token",
      "jwt_token"
    ];

    let token = null;

    for (const key of tokenKeys) {
      const value = localStorage.getItem(key);
      if (value && value.split(".").length === 3) {
        token = value;
        break;
      }
    }

    // બીજા localStorage keys માં token હોય તો પણ શોધો
    if (!token) {
      for (let i = 0; i < localStorage.length; i++) {
        const value = localStorage.getItem(localStorage.key(i));
        if (value && value.split(".").length === 3) {
          token = value;
          break;
        }
      }
    }

    if (!token) {
      throw new Error(
        "Login token મળ્યો નથી. ફરી login કરીને Performance page ખોલો."
      );
    }

    const response = await fetch(
      `http://127.0.0.1:8000/api/performance?period=${this.currentRange}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error("Login session expired. ફરી login કરો.");
      }

      throw new Error(
        errorData.detail || `API Error: ${response.status}`
      );
    }

    const apiData = await response.json();

    this.currentData = apiData;

    if (apiData.quizzes_completed === 0) {
      if (content) content.classList.add("hidden");
      if (empty) {
        empty.classList.remove("hidden");
        empty.textContent =
          "હજુ કોઈ completed quiz નથી. પહેલાં quiz complete કરો.";
      }
      return;
    }

    if (content) content.classList.remove("hidden");
    if (empty) empty.classList.add("hidden");

    const recent = [...(apiData.recent_quizzes || [])].reverse();

    const data = {
      averageScore: apiData.average_score ?? 0,
      quizzesCompleted: apiData.quizzes_completed ?? 0,
      questionsCorrect: apiData.questions_correct ?? 0,
      bestScore: apiData.best_score ?? 0,
      accuracyVal: `${apiData.accuracy ?? 0}%`,
      breakdown: {
        correct: apiData.questions_correct ?? 0,
        wrong: apiData.questions_wrong ?? 0,
        skipped: apiData.questions_skipped ?? 0
      },
      quizScores: recent.map((quiz, index) => ({
        quiz: `Quiz ${index + 1}`,
        score: Number(quiz.percentage) || 0
      })),
      recentQuizzes: (apiData.recent_quizzes || []).map(quiz => {
        const score = Number(quiz.percentage) || 0;
        const questions = Number(quiz.question_count) || 0;
        const correct = Number(quiz.correct_count) || 0;

        let status = "Needs Work";
        if (score >= 90) status = "Excellent";
        else if (score >= 80) status = "Good";
        else if (score >= 70) status = "Average";

        const submittedDate = quiz.submitted_at
          ? new Date(quiz.submitted_at).toLocaleDateString()
          : "—";

        return {
          name: quiz.title || "Untitled Quiz",
          subject: "—",
          score,
          accuracy: questions
            ? Math.round((correct / questions) * 100)
            : 0,
          questions,
          date: submittedDate,
          status
        };
      })
    };

    this.updateStatsCards(data);
    this.renderDonut(data);
    this.renderTable(data.recentQuizzes);
    this.triggerChartAnimation(data.quizScores);

    // હાલ backend આ data આપતું નથી.
    // તેથી જૂના demo subject/topic numbers બતાવવાના નથી.
    this.renderSubjects([]);
    this.renderStrengthsAndImprovements([], []);

  } catch (error) {
    console.error("Performance API error:", error);

    if (content) content.classList.add("hidden");

    if (empty) {
      empty.classList.remove("hidden");
      empty.textContent = error.message ||
        "Performance data load થઈ શક્યો નથી.";
    }
  }
}

 
updateStatsCards(data) {
  document.getElementById("valAvgScore").textContent =
    `${data.averageScore}%`;

  document.getElementById("valAvgScoreComp").textContent =
    "Selected period";

  document.getElementById("valQuizzesCompleted").textContent =
    data.quizzesCompleted;

  document.getElementById("valQuizzesCompletedSub").textContent =
    "Completed attempts";

  document.getElementById("valQuestionsCorrect").textContent =
    data.questionsCorrect;

  document.getElementById("valQuestionsAccuracy").textContent =
    `${data.accuracyVal} accuracy`;

  document.getElementById("valBestScore").textContent =
    `${data.bestScore}%`;
}

 
renderDonut(data) {
  const correct = data.breakdown.correct;
  const wrong = data.breakdown.wrong;
  const skipped = data.breakdown.skipped;
  const total = correct + wrong + skipped;

  const correctPct = total ? (correct / total) * 100 : 0;
  const wrongPct = total ? (wrong / total) * 100 : 0;

  const ring = document.getElementById("donutRing");

  if (ring) {
    ring.style.background = total
      ? `conic-gradient(
          var(--success-green) 0% ${correctPct}%,
          var(--danger-red) ${correctPct}% ${correctPct + wrongPct}%,
          var(--warning-orange) ${correctPct + wrongPct}% 100%
        )`
      : "#334155";
  }

  document.getElementById("donutAccuracyVal").textContent =
    data.accuracyVal;

  document.getElementById("legendCorrect").textContent = correct;
  document.getElementById("legendWrong").textContent = wrong;
  document.getElementById("legendSkipped").textContent = skipped;
}


  renderSubjects(subjects) {
    const container = document.getElementById("subjectProgressList");
    if (!container) return;

    container.innerHTML = subjects.map(s => `
      <div class="subject-item">
        <div class="subject-header-data">
          <span>${s.name}</span>
          <span>${s.percentage}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar-fill" data-percentage="${s.percentage}"></div>
        </div>
      </div>
    `).join("");

    // Trigger smooth fill animation
    setTimeout(() => {
      container.querySelectorAll(".progress-bar-fill").forEach(bar => {
        bar.style.width = `${bar.getAttribute("data-percentage")}%`;
      });
    }, 50);
  }

  renderStrengthsAndImprovements(strengths, improvements) {
    const sContainer = document.getElementById("strengthsList");
    const iContainer = document.getElementById("improvementsList");

    if (sContainer) {
      sContainer.innerHTML = strengths.map(item => `
        <div class="topic-row">
          <span>${item.topic}</span>
          <span class="topic-score-badge badge-green">${item.score}%</span>
        </div>
      `).join("");
    }

    if (iContainer) {
      iContainer.innerHTML = improvements.map(item => `
        <div class="topic-row">
          <span>${item.topic}</span>
          <span class="topic-score-badge badge-warning">${item.score}%</span>
        </div>
      `).join("");
    }
  }

  renderTable(quizzes) {
    const tbody = document.getElementById("recentQuizTableBody");
    if (!tbody) return;

    tbody.innerHTML = quizzes.map(q => {
      const badgeClass = this.getStatusBadgeClass(q.status);
      return `
        <tr>
          <td><strong>${q.name}</strong></td>
          <td>${q.subject}</td>
          <td>${q.score}%</td>
          <td>${q.accuracy}%</td>
          <td>${q.questions}</td>
          <td>${q.date}</td>
          <td><span class="status-badge ${badgeClass}">${q.status}</span></td>
        </tr>
      `;
    }).join("");
  }

  getStatusBadgeClass(status) {
    switch (status) {
      case "Excellent": return "badge-status-excellent";
      case "Good": return "badge-status-good";
      case "Average": return "badge-status-average";
      default: return "badge-status-needs-work";
    }
  }

  /* ==========================================================================
     Canvas Chart Implementation
     ========================================================================== */
  triggerChartAnimation(scores) {
    if (!this.canvas) return;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    this.animationProgress = 0;
    const startTime = performance.now();
    const duration = 800; // ms

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      this.animationProgress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic formula
      const easeProgress = 1 - Math.pow(1 - this.animationProgress, 3);

      this.drawScoreChart(scores, easeProgress);

      if (this.animationProgress < 1) {
        this.animFrameId = requestAnimationFrame(animate);
      }
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

  resizeAndDrawChart() {
  if (this.currentData) {
    const recent = [...(this.currentData.recent_quizzes || [])].reverse();

    const scores = recent.map((quiz, index) => ({
      quiz: `Quiz ${index + 1}`,
      score: Number(quiz.percentage) || 0
    }));

    this.drawScoreChart(scores, 1);
  }
}
  drawScoreChart(scores, progress = 1) {
    if (!this.canvas || !this.ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 30, bottom: 40, left: 45 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    this.ctx.clearRect(0, 0, width, height);

    // Draw Grid Lines & Y-Axis Labels
    const yGridCount = 5;
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = "#94A3B8";
    this.ctx.font = "11px Inter, sans-serif";
    this.ctx.textAlign = "right";

    for (let i = 0; i <= yGridCount; i++) {
      const yVal = Math.round((100 / yGridCount) * i);
      const yPos = padding.top + chartHeight - (chartHeight * (yVal / 100));

      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, yPos);
      this.ctx.lineTo(width - padding.right, yPos);
      this.ctx.stroke();

      this.ctx.fillText(`${yVal}%`, padding.left - 10, yPos + 4);
    }

    if (scores.length === 0) return;

    // Calculate Point Coordinates
    this.chartPoints = [];
    const stepX = chartWidth / (scores.length - 1 || 1);

    scores.forEach((item, index) => {
      const x = padding.left + index * stepX;
      const targetY = padding.top + chartHeight - (chartHeight * (item.score / 100));
      // Base calculation on animated height
      const startY = padding.top + chartHeight;
      const currentY = startY - ((startY - targetY) * progress);

      this.chartPoints.push({ x, y: currentY, rawScore: item.score, quiz: item.quiz });
    });

    // Draw Gradient Area Fill under Curve
    const gradient = this.ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.35)");
    gradient.addColorStop(1, "rgba(124, 58, 237, 0.0)");

    this.ctx.beginPath();
    this.ctx.moveTo(this.chartPoints[0].x, padding.top + chartHeight);

    this.chartPoints.forEach((pt, i) => {
      if (i === 0) {
        this.ctx.lineTo(pt.x, pt.y);
      } else {
        const prev = this.chartPoints[i - 1];
        const cx = (prev.x + pt.x) / 2;
        this.ctx.bezierCurveTo(cx, prev.y, cx, pt.y, pt.x, pt.y);
      }
    });

    this.ctx.lineTo(this.chartPoints[this.chartPoints.length - 1].x, padding.top + chartHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Draw Smooth Line Stroke
    this.ctx.beginPath();
    this.chartPoints.forEach((pt, i) => {
      if (i === 0) {
        this.ctx.moveTo(pt.x, pt.y);
      } else {
        const prev = this.chartPoints[i - 1];
        const cx = (prev.x + pt.x) / 2;
        this.ctx.bezierCurveTo(cx, prev.y, cx, pt.y, pt.x, pt.y);
      }
    });

    this.ctx.strokeStyle = "#3B82F6";
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = "rgba(59, 130, 246, 0.6)";
    this.ctx.shadowBlur = 10;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0; // reset shadow

    // Draw Points & X-Axis Labels
    this.chartPoints.forEach((pt) => {
      // Outer Circle Glow
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = "#1E293B";
      this.ctx.fill();
      this.ctx.strokeStyle = "#60A5FA";
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      // X Label
      this.ctx.fillStyle = "#94A3B8";
      this.ctx.textAlign = "center";
      this.ctx.fillText(pt.quiz, pt.x, height - padding.bottom + 20);
    });
  }

  handleChartHover(e) {
    if (!this.chartPoints.length || !this.tooltip) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find closest data point within threshold
    let closest = null;
    let minDistance = 25;

    this.chartPoints.forEach(pt => {
      const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
      if (dist < minDistance) {
        minDistance = dist;
        closest = pt;
      }
    });

    if (closest) {
      this.tooltip.innerHTML = `<strong>${closest.quiz}</strong><br>Score: <span style="color:#60A5FA;">${closest.rawScore}%</span>`;
      this.tooltip.style.left = `${closest.x}px`;
      this.tooltip.style.top = `${closest.y}px`;
      this.tooltip.style.opacity = "1";
    } else {
      this.tooltip.style.opacity = "0";
    }
  }
}

// Instantiate on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new PerformanceApp();
});