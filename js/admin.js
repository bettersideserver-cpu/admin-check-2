import {
    getVisitors,
    approveVisitor,
    rejectVisitor,
    deleteVisitor,
    getProperties,
    checkExpiredVisitors,
    initializeDatabase
} from "./database.js";
import { loadProperties } from "./property.js";

const requestContainer = document.getElementById("requestContainer");

const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");
const expiredCount = document.getElementById("expiredCount");
const propertyCount = document.getElementById("propertyCount");

// ===========================
// Dashboard
// ===========================

async function updateCards() {

    await checkExpiredVisitors();

    const visitors = await getVisitors();

    pendingCount.textContent =
        visitors.filter(v => v.status === "Pending").length;

    approvedCount.textContent =
        visitors.filter(v => v.status === "Approved").length;

    expiredCount.textContent =
        visitors.filter(v => v.status === "Expired").length;

    propertyCount.textContent =
        Object.keys(await getProperties()).length;

}

// ===========================
// Visitors
// ===========================

async function loadVisitors() {

    requestContainer.innerHTML = "";

    const visitors = await getVisitors();

    if (visitors.length === 0) {

        requestContainer.innerHTML =
            "<h3>No Visitor Requests</h3>";

        return;

    }

    visitors.forEach(visitor => {

        const card = document.createElement("div");

        card.className = "request-card";

        card.innerHTML = `

<h3>${visitor.name}</h3>

<p><strong>Phone:</strong> ${visitor.phone}</p>

<p><strong>Email:</strong> ${visitor.email}</p>

<p><strong>Status:</strong> ${visitor.status}</p>

<select>

    <option value="5">5 Minutes</option>
    <option value="10">10 Minutes</option>
    <option value="15">15 Minutes</option>
    <option value="30">30 Minutes</option>
    <option value="60">1 Hour</option>

</select>

<br><br>

<button class="approve">Approve</button>

<button class="reject">Reject</button>

${visitor.status === "Expired" || visitor.status === "Rejected"
                ?
                `<button class="delete">Delete</button>`
                :
                ""
            }

`;

        const select = card.querySelector("select");


        // Approve
        card.querySelector(".approve").onclick = async () => {

            await approveVisitor(
                visitor.id,
                Number(select.value)
            );

            await refresh();

        };

        // Reject
        card.querySelector(".reject").onclick = async () => {

            await rejectVisitor(visitor.id);

            await refresh();

        };


        const deleteBtn = card.querySelector(".delete");

        if (deleteBtn) {

            deleteBtn.onclick = async () => {

                if (confirm("Delete this visitor?")) {

                    await deleteVisitor(visitor.id);

                    await refresh();

                }

            };

        }
        requestContainer.appendChild(card);

    });

}


// ===========================

async function refresh() {

    await updateCards();

    await loadVisitors();

    await loadProperties();

}

// ===========================

(async () => {

    await initializeDatabase();

    await refresh();

})();

// Refresh dashboard counts only
setInterval(async () => {

    await updateCards();

}, 5000);