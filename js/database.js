// ==========================================
// database.js
// Firebase Version
// ==========================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// ==========================================
// Collection Names
// ==========================================

const VISITOR_COLLECTION = "visitors";
const PROPERTY_COLLECTION = "properties";
const CATEGORY_COLLECTION = "categories";
const PROPERTY_REQUEST_COLLECTION = "propertyRequests";




// =======================================
// Property Requests
// =======================================

export async function addPropertyRequest(request) {

    await addDoc(

        collection(db, PROPERTY_REQUEST_COLLECTION),

        request

    );

}

export async function getPropertyRequests() {

    const snapshot = await getDocs(
        collection(db, PROPERTY_REQUEST_COLLECTION)
    );

    const requests = [];

    snapshot.forEach(doc => {

        requests.push({

            docId: doc.id,

            ...doc.data()

        });

    });

    return requests;

}

export async function deletePropertyRequest(docId) {

    await deleteDoc(
        doc(db, PROPERTY_REQUEST_COLLECTION, docId)
    );

}
// ==========================================
// Default Data
// ==========================================

const DEFAULT_PROPERTIES = {
    Anchor_Store: "Available",
    Retail_x5F_Area_x5F_1: "Available",
    Retail_x5F_Area_x5F_2: "Available",
    Retail_x5F_Area_x5F_3: "Available",
    Retail_x5F_Area_x5F_4: "Available"
};

const DEFAULT_CATEGORIES = {

    Available: "#22c55e",
    Sold: "#ef4444",
    Reserved: "#f59e0b"

};

// ==========================================
// Initialize Firestore
// ==========================================

export async function initializeDatabase() {

    const propertySnapshot =
        await getDocs(collection(db, PROPERTY_COLLECTION));

    if (propertySnapshot.empty) {

        for (const [id, status] of Object.entries(DEFAULT_PROPERTIES)) {

            await setDoc(

                doc(db, PROPERTY_COLLECTION, id),

                {

                    status

                }

            );

        }

    }

    const categorySnapshot =
        await getDocs(collection(db, CATEGORY_COLLECTION));

    if (categorySnapshot.empty) {

        for (const [name, color] of Object.entries(DEFAULT_CATEGORIES)) {

            await setDoc(

                doc(db, CATEGORY_COLLECTION, name),

                {

                    color

                }

            );

        }

    }

}
// =======================================
// Visitor
// =======================================

export async function addVisitor(name, phone, email, city) {

    const visitor = {

        id: "USER-" + Date.now(),

        name,

        phone,

        email,

        city: city || "",

        status: "Pending",

        accessTime: 5,

        createdAt: Date.now(),

        expiresAt: null

    };

    await addDoc(
        collection(db, VISITOR_COLLECTION),
        visitor
    );

    return visitor;

}

export async function getVisitors() {

    const snapshot = await getDocs(
        collection(db, VISITOR_COLLECTION)
    );

    const visitors = [];

    snapshot.forEach((document) => {

        visitors.push({

            docId: document.id,

            ...document.data()

        });

    });

    return visitors;

}

export async function getVisitor(id) {

    const visitors = await getVisitors();

    return visitors.find(v => v.id === id);

}

// =======================================
// Approve
// =======================================

export async function approveVisitor(id, minutes) {

    const visitors = await getDocs(collection(db, VISITOR_COLLECTION));

    for (const visitorDoc of visitors.docs) {

        if (visitorDoc.data().id === id) {

            await updateDoc(doc(db, VISITOR_COLLECTION, visitorDoc.id), {

                status: "Approved",
                accessTime: minutes,
                expiresAt: Date.now() + minutes * 60 * 1000

            });

            break;

        }

    }

}

// =======================================
// Reject
// =======================================

export async function rejectVisitor(id) {

    const visitors = await getDocs(collection(db, VISITOR_COLLECTION));

    for (const visitorDoc of visitors.docs) {

        if (visitorDoc.data().id === id) {

            await updateDoc(doc(db, VISITOR_COLLECTION, visitorDoc.id), {

                status: "Rejected"

            });

            break;

        }

    }

}

// =======================================
// Delete Visitor
// =======================================

export async function deleteVisitor(id) {

    const visitors = await getDocs(collection(db, VISITOR_COLLECTION));

    for (const visitorDoc of visitors.docs) {

        if (visitorDoc.data().id === id) {

            await deleteDoc(doc(db, VISITOR_COLLECTION, visitorDoc.id));

            break;

        }

    }

}

// =======================================
// Expire
// =======================================

export async function expireVisitor(id) {

    const visitors = await getDocs(collection(db, VISITOR_COLLECTION));

    for (const visitorDoc of visitors.docs) {

        if (visitorDoc.data().id === id) {

            await updateDoc(doc(db, VISITOR_COLLECTION, visitorDoc.id), {

                status: "Expired"

            });

            break;

        }

    }

}
// =======================================
// Properties
// =======================================

export async function getProperties() {

    const snapshot = await getDocs(
        collection(db, PROPERTY_COLLECTION)
    );

    const properties = {};

    snapshot.forEach((document) => {

        properties[document.id] = document.data();

    });

    return properties;

}

export async function updateProperty(
    id,
    status,
    buyerName = "",
    buyerPhone = ""
) {

    await setDoc(
        doc(db, PROPERTY_COLLECTION, id),
        {
            status,
            buyerName,
            buyerPhone
        },
        {
            merge: true
        }
    );

}

// =======================================
// Categories
// =======================================

export async function getCategories() {

    const snapshot = await getDocs(
        collection(db, CATEGORY_COLLECTION)
    );

    const categories = {};

    snapshot.forEach((document) => {

        categories[document.id] = document.data().color;

    });

    return categories;

}

export async function addCategory(name, color) {

    await setDoc(

        doc(db, CATEGORY_COLLECTION, name),

        {
            color
        }

    );

}

export async function deleteCategory(name) {

    await deleteDoc(
        doc(db, CATEGORY_COLLECTION, name)
    );

}

// =======================================
// Expired Visitors
// =======================================

export async function checkExpiredVisitors() {

    const snapshot = await getDocs(
        collection(db, VISITOR_COLLECTION)
    );

    const now = Date.now();

    for (const visitorDoc of snapshot.docs) {

        const visitor = visitorDoc.data();

        if (
            visitor.status === "Approved" &&
            visitor.expiresAt &&
            visitor.expiresAt < now
        ) {

            await updateDoc(

                doc(db, VISITOR_COLLECTION, visitorDoc.id),

                {
                    status: "Expired"
                }

            );

        }

    }

}

export async function syncProperties(propertyIds) {

    const properties = await getProperties();

    for (const id of propertyIds) {

        if (!properties[id]) {

            await updateProperty(id, "Available");

        }

    }

}

// =======================================
// Realtime Properties
// =======================================

export function listenProperties(callback) {

    return onSnapshot(
        collection(db, PROPERTY_COLLECTION),
        (snapshot) => {

            const properties = {};

            snapshot.forEach((document) => {
                properties[document.id] = document.data();
            });

            callback(properties);

        }
    );

}