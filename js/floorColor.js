import { getProperties } from "./database.js";

export async function updateFloorColors() {

    const properties = await getProperties();

    Object.entries(properties).forEach(([id, status]) => {

        const unit = document.getElementById(id);
        if (!unit) return;

        switch (status) {

            case "Available":
                unit.style.fill = "rgba(34,197,94,.6)";
                break;

            case "Sold":
                unit.style.fill = "rgba(239,68,68,.6)";
                break;

            case "Reserved":
                unit.style.fill = "rgba(245,158,11,.6)";
                break;

            default:
                unit.style.fill = "transparent";
        }

    });

}