const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const cityInput = document.getElementById("city");
import {
    addVisitor,
    getVisitor,
    getProperties,
    getCategories,
    checkExpiredVisitors,
    initializeDatabase,
    listenProperties
} from "./database.js";

import {
    updateFloorColors
} from "./floorColor.js";

// ==========================
// Elements
// ==========================

const popup = document.getElementById("popup");
const visitorForm = document.getElementById("visitorForm");

const waiting = document.getElementById("waitingScreen");

const verify = document.getElementById("verifyScreen");
const verifyBtn = document.getElementById("verifyBtn");
const verifyPhone = document.getElementById("verifyPhone");

const expired = document.getElementById("expiredScreen");

const floor = document.getElementById("floorWrapper");

const timer = document.getElementById("timer");

const tooltip = document.getElementById("tooltip");

const legend = document.getElementById("legend");

// ==========================
// This script is shared between the building
// overview (index.html) and the individual
// floor pages. Not every element exists on
// every page, so every reference above may be
// null depending on which page loaded it.
// ==========================

let timerInterval;
let pollInterval = null;

await updateFloorColors();
let properties = await getProperties();

document.querySelectorAll(".unit").forEach(unit => {

    unit.addEventListener("mousemove", (e) => {

        tooltip.style.display = "block";

        tooltip.style.left = e.pageX + 15 + "px";
        tooltip.style.top = e.pageY + 15 + "px";

        const status = properties[unit.id] || "Unknown";

        tooltip.innerHTML = `
            <strong>${unit.id.replace(/_x5F_/g, " ").replace(/_/g, " ")}</strong>
            <br>
            Status : ${status}
        `;
    });

    unit.addEventListener("mouseleave", () => {

        tooltip.style.display = "none";

    });

});

// ==========================
// Hide only the modal / overlay screens.
// The building view itself stays visible at
// all times now, the registration form only
// appears as a popup ON TOP of it.
// ==========================

function hideAll() {

    popup?.style && (popup.style.display = "none");
    waiting?.style && (waiting.style.display = "none");
    verify?.style && (verify.style.display = "none");
    expired?.style && (expired.style.display = "none");
    timer?.style && (timer.style.display = "none");

}

function stopPolling() {

    clearInterval(pollInterval);
    pollInterval = null;

}

// ==========================
// Registration
// ==========================

visitorForm?.addEventListener("submit", async (e) => {

    e.preventDefault();

    const visitor = await addVisitor(
        nameInput.value.trim(),
        phoneInput.value.trim(),
        emailInput.value.trim(),
        cityInput?.value.trim()
    );

    localStorage.setItem(
        "currentVisitor",
        visitor.id
    );

    hideAll();

    waiting.style.display = "flex";

    const targetUrl = localStorage.getItem("pendingFloorRedirect");

    if (targetUrl) {

        stopPolling();

        checkFlowStatus(targetUrl);

        pollInterval = setInterval(() => {
            checkFlowStatus(targetUrl);
        }, 1000);

    }

});

// ==========================
// Floor Access Flow
// Triggered when the visitor clicks a floor on
// the building SVG (see script.js). Shows the
// registration / waiting / verify screens as
// needed, then redirects to the requested
// floor page once verified.
// ==========================

async function checkFlowStatus(targetUrl) {

    checkExpiredVisitors();

    const id = localStorage.getItem("currentVisitor");

    if (!id) {

        stopPolling();
        hideAll();
        popup.style.display = "flex";

        return;

    }

    const visitor = await getVisitor(id);

    if (!visitor) {

        localStorage.removeItem("currentVisitor");

        stopPolling();
        hideAll();
        popup.style.display = "flex";

        return;

    }

    switch (visitor.status) {

        case "Pending":

            hideAll();

            waiting.style.display = "flex";

            break;

        case "Approved":

            if (localStorage.getItem("verified")) {

                stopPolling();
                hideAll();

                localStorage.removeItem("pendingFloorRedirect");

                window.location.href = targetUrl;

            } else {

                hideAll();

                verify.style.display = "flex";

            }

            break;

        case "Rejected":

            stopPolling();

            alert("Request Rejected");

            localStorage.removeItem("currentVisitor");
            localStorage.removeItem("verified");

            hideAll();

            popup.style.display = "flex";

            break;

        case "Expired":

            stopPolling();

            hideAll();

            expired.style.display = "flex";

            break;

    }

}

// Called from script.js when a floor on the
// building SVG is clicked.
window.requestFloorAccess = function (targetUrl) {

    if (!popup) {

        // Not on a page that has the registration
        // popup (e.g. an individual floor page) —
        // just navigate directly.
        window.location.href = targetUrl;
        return;

    }

    localStorage.setItem("pendingFloorRedirect", targetUrl);

    stopPolling();

    checkFlowStatus(targetUrl);

    pollInterval = setInterval(() => {
        checkFlowStatus(targetUrl);
    }, 1000);

};

// ==========================
// Verify
// ==========================

verifyBtn?.addEventListener("click", async () => {

    const id = localStorage.getItem("currentVisitor");

    const visitor = await getVisitor(id);

    if (!visitor) return;

    if (verifyPhone.value.trim() != visitor.phone) {

        alert("Wrong Phone Number");

        return;

    }

    localStorage.setItem(

        "verified",

        "true"

    );

    stopPolling();

    hideAll();

    const targetUrl = localStorage.getItem("pendingFloorRedirect");

    if (targetUrl) {

        localStorage.removeItem("pendingFloorRedirect");

        window.location.href = targetUrl;

    } else if (floor) {

        await openFloor(visitor);

    }

});

// ==========================
// Open Floor (used on individual floor pages
// where there is no building overview / popup
// gate, only a timer for the granted access time)
// ==========================

async function openFloor(visitor) {

    hideAll();

    if (floor) {

        floor.style.display = "block";

    }

    // Load legend
    const categories = await getCategories();

    if (legend) {

        legend.innerHTML = "";

        Object.entries(categories).forEach(([name, color]) => {

            legend.innerHTML += `
                <div class="legend-item">
                    <span class="legend-color" style="background:${color}"></span>
                    <span>${name}</span>
                </div>
            `;

        });

    }

    // Color SVG
    await updateFloorColors();

    startTimer(visitor);
}

// ==========================
// Timer
// ==========================

function startTimer(visitor) {

    clearInterval(timerInterval);

    if (timer) {

        timer.style.display = "block";

    }

    function updateTimer() {

        const left = visitor.expiresAt - Date.now();

        if (left <= 0) {

            clearInterval(timerInterval);

            localStorage.removeItem("verified");

            hideAll();

            if (expired) {

                expired.style.display = "flex";

            }

            return;

        }

        const m = Math.floor(left / 60000);
        const s = Math.floor((left % 60000) / 1000);

        if (timer) {

            timer.textContent = `${m}:${String(s).padStart(2, "0")}`;

        }

    }

    // Show immediately
    updateTimer();

    // Then update every second
    timerInterval = setInterval(updateTimer, 1000);

}

// ==========================
// SVG
// ==========================

async function colorSVG() {

    const properties = await getProperties();
    const categories = await getCategories();

    legend.innerHTML = "";

    Object.entries(categories).forEach(([name, color]) => {

        const item = document.createElement("div");

        item.className = "legend-item";

        item.innerHTML =

            `<span class="legend-color"
        style="background:${color}">
        </span>${name}`;

        legend.appendChild(item);

    });

    Object.entries(properties).forEach(([id, status]) => {

        const unit = document.getElementById(id);

        if (!unit) return;

        unit.style.fill =

            categories[status];

        unit.onmousemove = (e) => {

            tooltip.style.display = "block";

            tooltip.style.left = e.clientX + 15 + "px";

            tooltip.style.top = e.clientY + 15 + "px";

            tooltip.innerHTML =

                `<b>${id}</b><br>${status}`;

        };

        unit.onmouseleave = () => {

            tooltip.style.display = "none";

        };

    });

}

// ==========================
// Path back to the building overview.
// Floor pages live at svg/pages/<floor>/<floor>.html,
// three levels below the project root.
// ==========================

const HOME_URL = "../../../index.html";

// ==========================
// Access Guard (individual floor pages only)
// Runs before anything is shown. A visitor must
// have an Approved + verified session with time
// left, or they're sent back to the homepage to
// register / wait / verify. This lets an approved
// visitor freely bounce between the homepage and
// any floor, as many times as they like, until
// their granted time limit runs out.
// ==========================

async function guardFloorPage() {

    // A floor page should never act on a redirect
    // that was meant for the homepage — drop it so
    // it can't cause a stale/duplicated navigation.
    localStorage.removeItem("pendingFloorRedirect");

    checkExpiredVisitors();

    const id = localStorage.getItem("currentVisitor");

    if (!id) {
        window.location.href = HOME_URL;
        return false;
    }

    const visitor = await getVisitor(id);

    if (!visitor || visitor.status === "Rejected") {

        localStorage.removeItem("currentVisitor");
        localStorage.removeItem("verified");

        window.location.href = HOME_URL;
        return false;

    }

    if (visitor.status === "Pending") {
        window.location.href = HOME_URL;
        return false;
    }

    if (!localStorage.getItem("verified")) {
        // Approved but never completed phone verification
        // in this session (e.g. floor URL opened directly).
        window.location.href = HOME_URL;
        return false;
    }

    if (
        visitor.status === "Expired" ||
        (visitor.expiresAt && visitor.expiresAt <= Date.now())
    ) {

        localStorage.removeItem("verified");
        window.location.href = HOME_URL + "?expired=1";
        return false;

    }

    // Approved, verified, and still has time left.
    await openFloor(visitor);

    // Keep watching the clock while they browse this
    // floor — if time runs out mid-visit, kick them
    // back to the homepage automatically.
    clearInterval(pollInterval);

    pollInterval = setInterval(async () => {

        if (visitor.expiresAt && visitor.expiresAt <= Date.now()) {

            stopPolling();

            await checkExpiredVisitors();

            localStorage.removeItem("verified");

            window.location.href = HOME_URL + "?expired=1";

        }

    }, 1000);

    return true;

}

// ==========================
// Initial Load
// The building overview is shown immediately —
// no registration gate on load there. Individual
// floor pages are gated by guardFloorPage() above.
// ==========================

(async () => {

    await initializeDatabase();

    checkExpiredVisitors();

    hideAll();

    if (floor && !popup) {

        // Individual floor page (no registration popup
        // here — that only exists on the homepage) — gate access.
        await guardFloorPage();

        return;

    }

    // Building overview (homepage). If the visitor
    // already has an Expired/Rejected session from a
    // previous visit, or just got redirected back here
    // because their time ran out, let them know instead
    // of staying silent.
    const currentId = localStorage.getItem("currentVisitor");

    if (currentId && popup) {

        const visitor = await getVisitor(currentId);

        if (visitor && visitor.status === "Expired" && expired) {

            hideAll();
            expired.style.display = "flex";

        } else if (visitor && visitor.status === "Rejected") {

            localStorage.removeItem("currentVisitor");
            localStorage.removeItem("verified");

        }

    }

    // If the visitor is already verified & approved
    // and had a pending floor they were headed to
    // (e.g. they reloaded mid-flow), send them on.
    const pendingUrl = localStorage.getItem("pendingFloorRedirect");

    if (pendingUrl && currentId && localStorage.getItem("verified")) {

        const visitor = await getVisitor(currentId);

        if (visitor && visitor.status === "Approved" && visitor.expiresAt > Date.now()) {

            localStorage.removeItem("pendingFloorRedirect");

            window.location.href = pendingUrl;

            return;

        }

    }

    // Visitor is Approved + verified and has no pending
    // floor redirect (e.g. they're just browsing the
    // homepage overview, or came back to it from a floor
    // page). Show the countdown timer here too, same as
    // it shows on individual floor pages, so they always
    // know how much access time is left.
    if (currentId && localStorage.getItem("verified")) {

        const visitor = await getVisitor(currentId);

        if (
            visitor &&
            visitor.status === "Approved" &&
            visitor.expiresAt &&
            visitor.expiresAt > Date.now()
        ) {

            startTimer(visitor);

            clearInterval(pollInterval);

            pollInterval = setInterval(async () => {

                if (visitor.expiresAt && visitor.expiresAt <= Date.now()) {

                    stopPolling();

                    await checkExpiredVisitors();

                    localStorage.removeItem("verified");

                    hideAll();

                    if (expired) {
                        expired.style.display = "flex";
                    }

                }

            }, 1000);

        }

    }

    await updateFloorColors();

})();

listenProperties(async (data) => {

    properties = data;

    await updateFloorColors();

});