import {
    getProperties,
    updateProperty,
    getCategories,
    syncProperties
} from "./database.js";

const units = [...document.querySelectorAll("#floorplan .unit")];
const propertyIds = units.map(unit => unit.id);

await syncProperties(propertyIds);

// console.log(units);
const table = document.getElementById("propertyTable");

// ------------------------------

export async function loadProperties() {

    if (!table) return;

    table.innerHTML = "";

    const properties = await getProperties();

    for (const [id, status] of Object.entries(properties)) {

        const row = document.createElement("tr");

        row.innerHTML = `

        <td>${formatName(id)}</td>

        <td>

            <select data-id="${id}"></select>

        </td>

    `;

        const select = row.querySelector("select");

        const categories = await getCategories();

        Object.keys(categories).forEach(category => {

            const option = document.createElement("option");

            option.value = category;

            option.textContent = category;

            if (category === status) {
                option.selected = true;
            }

            select.appendChild(option);

        });

        select.onchange = async () => {

            await updateProperty(id, select.value);

        };

        table.appendChild(row);

    }

}
function formatName(id) {

    return id
        .replace(/_x5F_/g, " ")
        .replace(/_/g, " ");

}

export async function updateFloorColors() {

    const properties = await getProperties();

    document.querySelectorAll(".unit").forEach(unit => {

        const status = properties[unit.id];

        switch (status) {

            // case "Available":
            //     unit.style.fill = "#00C853";
            //     break;

            // case "Reserved":
            //     unit.style.fill = "#FFC107";
            //     break;

            // case "Sold":
            //     unit.style.fill = "#F44336";
            //     break;

            // default:
            //     unit.style.fill = "#BDBDBD";
            case "Available":
                unit.style.fill = "rgba(0, 200, 83, 0.35)";
                break;

            case "Reserved":
                unit.style.fill = "rgba(255, 193, 7, 0.35)";
                break;

            case "Sold":
                unit.style.fill = "rgba(244, 67, 54, 0.35)";
                break;
        }

    });

}