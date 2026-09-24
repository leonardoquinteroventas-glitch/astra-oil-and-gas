document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    updateSystemStatus("SYSTEM READY");

    console.log("Astra Procurement Intelligence OS iniciado.");
}

function setupNavigation() {
    const buttons = document.querySelectorAll("[data-page]");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            showPage(button.dataset.page);
        });
    });
}

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });

    const target = document.getElementById(`page-${pageName}`);

    if (target) {
        target.classList.remove("hidden");
    }
}

function updateSystemStatus(status) {
    const element = document.getElementById("systemStatus");

    if (element) {
        element.textContent = status;
    }
}