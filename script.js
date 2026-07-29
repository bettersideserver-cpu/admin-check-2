// =============================
// SVG Path Links
// =============================

const floorLinks = {

    floor1: "svg/pages/floor_1/floor_1.html",
    floor2: "svg/pages/floor_2/floor_2.html",
    floor3: "svg/pages/floor_3/floor_3.html",
    floor4: "svg/pages/floor_4/floor_4.html",
    floor5: "svg/pages/floor_5/floor_5.html",
    floor6: "svg/pages/floor_6/floor_6.html",
    floor7: "svg/pages/floor_7/floor_7.html",
    floor8: "svg/pages/floor_8/floor_8.html",
    floor9: "svg/pages/floor_9/floor_9.html",
    floor10: "svg/pages/floor_10/floor_10.html",
    floor11: "svg/pages/floor_11/floor_11.html",
    floor12: "svg/pages/floor_12/floor_12.html",
    floor13: "svg/pages/floor_13/floor_13.html",
    floor14: "svg/pages/floor_14/floor_14.html",
    floor15: "svg/pages/floor_15/floor_15.html",
    floor16: "svg/pages/floor_16/floor_16.html",
    floor17: "svg/pages/floor_17/floor_17.html",
    floor18: "svg/pages/floor_18/floor_18.html",

    // Add more here
    // floor6: "pages/floor6.html",
    // floor7: "pages/floor7.html",

};

// =============================
// Attach Click Events
// =============================

Object.keys(floorLinks).forEach(id => {

    const path = document.getElementById(id);

    if (!path) {
        console.warn(`${id} not found.`);
        return;
    }

    path.addEventListener("click", () => {
        window.location.href = floorLinks[id];
    });

    path.addEventListener("mouseenter", () => {
        path.style.fill = "rgba(255,215,0,.35)";
        path.style.stroke = "#FFD700";
        path.style.strokeWidth = "2";
    });

    path.addEventListener("mouseleave", () => {
        path.style.fill = "transparent";
        path.style.stroke = "transparent";
    });

});