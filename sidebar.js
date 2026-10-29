document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebarToggleBtn");
    const closeBtn = document.getElementById("closeSidebar");

    if (!sidebar || !toggleBtn || !closeBtn) {
        console.warn("Sidebar elements not found on this page.");
        return;
    }

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("open");
    });

    closeBtn.addEventListener("click", function () {
        sidebar.classList.remove("open");
    });

    document.addEventListener("click", function (event) {
        if (
            window.innerWidth <= 1024 &&
            !sidebar.contains(event.target) &&
            !toggleBtn.contains(event.target)
        ) {
            sidebar.classList.remove("open");
        }
    });
});