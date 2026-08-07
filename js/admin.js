import {
    getVisitors,
    approveVisitor,
    rejectVisitor,
    deleteVisitor,
    getProperties,
    checkExpiredVisitors,
    initializeDatabase,
    getPropertyRequests,
    deletePropertyRequest
} from "./database.js";
import {
    loadProperties
} from "./property.js";


const propertyDetails = {};

const requestContainers = [

    document.getElementById("requestContainer"),

    document.getElementById("visitorRequestPageContainer")

];

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

    requestContainers.forEach(c => {

        if (c) c.innerHTML = "";

    });

    const visitors = await getVisitors();

    if (visitors.length === 0) {

        requestContainer.innerHTML =
            "<h3>No Visitor Requests</h3>";

        return;

    }

    visitors.forEach(visitor => {
        // console.log("Visitor Object:", visitor);

        const card = document.createElement("div");

        card.className = "request-card";

        card.innerHTML = `

<h3>${visitor.name}</h3>

<p><strong>Phone:</strong> ${visitor.phone}</p>

<p><strong>Email:</strong> ${visitor.email}</p>

<p><strong>City:</strong> ${visitor.city || "-"}</p>

<p><strong>Status:</strong> ${visitor.status}</p>

<select>

    <option value="1">1 Hour</option>
    <option value="6">6 Hours</option>
    <option value="24">24 Hours</option>

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

            // console.log("docId:", visitor.docId);
            // console.log("id:", visitor.id);

            await approveVisitor(
                visitor.docId,
                // Dropdown values are hours (1 / 6 / 24),
                // but approveVisitor expects minutes.
                Number(select.value) * 60
            );

            await refresh();

        };

        // Reject
        card.querySelector(".reject").onclick = async () => {

            await rejectVisitor(visitor.docId);

            await refresh();

        };


        const deleteBtn = card.querySelector(".delete");

        if (deleteBtn) {

            deleteBtn.onclick = async () => {

                if (confirm("Delete this visitor?")) {

                    await deleteVisitor(visitor.docId);

                    await refresh();

                }

            };

        }
        requestContainers.forEach(c => {
            if (!c) return;

            const clone = card.cloneNode(true);

            const select = clone.querySelector("select");

            clone.querySelector(".approve").onclick = async () => {
                await approveVisitor(
                    visitor.docId,
                    Number(select.value) * 60
                );
                await refresh();
            };

            clone.querySelector(".reject").onclick = async () => {
                await rejectVisitor(visitor.docId);
                await refresh();
            };

            const deleteBtn = clone.querySelector(".delete");

            if (deleteBtn) {
                deleteBtn.onclick = async () => {
                    if (confirm("Delete this visitor?")) {
                        await deleteVisitor(visitor.docId);
                        await refresh();
                    }
                };
            }

            c.appendChild(clone);
        });

    });

}


// ===========================

async function refresh() {

    await updateCards();

    await loadVisitors();

    await loadProperties();

    await loadPropertyRequests();

}

// ===========================

(async () => {

    await initializeDatabase();

    await refresh();

})();

// Refresh dashboard counts only
setInterval(async () => {
    await updateCards();
}, 60000);

async function loadPropertyRequests() {

    const table =
        document.getElementById("propertyRequestTable");

    table.innerHTML = "";

    const requests =
        await getPropertyRequests();

    requests.forEach(request => {

        table.innerHTML += `

<tr>

<td>${request.visitorName}</td>

<td>${request.phone}</td>

<td>F${request.floor}</td>

<td>${request.property}</td>

<td>${request.unit}</td>

<td>${new Date(request.requestedAt).toLocaleString()}</td>

<td>

<button
class="reject"
onclick="deleteRequest('${request.docId}')">

Remove

</button>

</td>

</tr>

`;

    });

}
window.deleteRequest = async function (id) {

    if (!confirm("Remove Request?"))
        return;

    await deletePropertyRequest(id);

    loadPropertyRequests();

}