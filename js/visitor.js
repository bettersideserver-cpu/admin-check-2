const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
import {
    addVisitor,
    getVisitor,
    getProperties,
    getCategories,
    checkExpiredVisitors,
    initializeDatabase
} from "./database.js";

import {
    updateFloorColors
} from "./property.js";

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

let timerInterval;

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

function hideAll() {

    popup.style.display = "none";
    waiting.style.display = "none";
    verify.style.display = "none";
    expired.style.display = "none";
    floor.style.display = "none";
    timer.style.display = "none";

}

// ==========================
// Registration
// ==========================

visitorForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const visitor = await addVisitor(
        nameInput.value.trim(),
        phoneInput.value.trim(),
        emailInput.value.trim()
    );

    localStorage.setItem(
        "currentVisitor",
        visitor.id
    );

    hideAll();

    waiting.style.display = "flex";

});

// ==========================
// Waiting
// ==========================

async function checkApproval() {

    checkExpiredVisitors();

    const id = localStorage.getItem("currentVisitor");

    if (!id) {

        hideAll();

        popup.style.display = "flex";

        return;

    }

    const visitor = await getVisitor(id);

    if (!visitor) {

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

                if (floor.style.display !== "block") {

                    await openFloor(visitor);

                }

            } else {

                hideAll();

                verify.style.display = "flex";

            }

            break;

        case "Rejected":

            alert("Request Rejected");

            localStorage.clear();

            location.reload();

            break;

        case "Expired":

            hideAll();

            expired.style.display = "flex";

            break;

    }

}

// ==========================
// Verify
// ==========================

verifyBtn.addEventListener("click", async () => {

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

    await openFloor(visitor);

});

// ==========================
// Open Floor
// ==========================

async function openFloor(visitor) {

    hideAll();

    floor.style.display = "block";

    // Load legend
    const categories = await getCategories();

    legend.innerHTML = "";

    Object.entries(categories).forEach(([name, color]) => {

        legend.innerHTML += `
            <div class="legend-item">
                <span class="legend-color" style="background:${color}"></span>
                <span>${name}</span>
            </div>
        `;

    });

    // Color SVG
    await updateFloorColors();

    startTimer(visitor);
}

// ==========================
// Timer
// ==========================

function startTimer(visitor) {

    clearInterval(timerInterval);

    timer.style.display = "block";

    function updateTimer() {

        const left = visitor.expiresAt - Date.now();

        if (left <= 0) {

            clearInterval(timerInterval);

            localStorage.removeItem("verified");

            hideAll();

            expired.style.display = "flex";

            return;

        }

        const m = Math.floor(left / 60000);
        const s = Math.floor((left % 60000) / 1000);

        timer.textContent = `${m}:${String(s).padStart(2, "0")}`;

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
(async () => {

    await initializeDatabase();

    await checkApproval();

    setInterval(async () => {

        await checkApproval();

    }, 1000);

})();

setInterval(async () => {

    properties = await getProperties();
    await updateFloorColors();

}, 200);