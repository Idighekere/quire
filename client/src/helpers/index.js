import { departments } from "@/constants";

/** Resolve a department shortName ("CVE", any case) or URL slug ("civil-engineering") to its full name. */
export const getDepartmentsFullName = (shortNameOrSlug) => {
    if (!shortNameOrSlug) return shortNameOrSlug;
    const needle = String(shortNameOrSlug);
    const dept = departments.find(
        (d) => d.shortName.toUpperCase() === needle.toUpperCase() || d.slug === needle.toLowerCase(),
    );
    return dept ? dept.name : shortNameOrSlug;
}


const saveToLocalStorage = (key, value) => {
    try {
        const serializedValue = JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
    } catch (error) {
        console.error("Error saving to local storage", error);
    }
};

const getFromLocalStorage = (key) => {
    try {
        const serializedValue = localStorage.getItem(key);
        if (serializedValue === null) {
            return null;
        }
        return JSON.parse(serializedValue);
    } catch (error) {
        console.error("Error getting from local storage", error);
        return null;
    }
};

const removeFromLocalStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error("Error removing from local storage", error);
    }
};

/** Format a byte count ("1048576", 1048576) as "1 MB". Returns "" when unknown. */
export const formatFileSize = (bytes) => {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n < 0) return "";
    if (n < 1024) return `${n} B`;
    const units = ["KB", "MB", "GB", "TB"];
    let value = n / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
};

const extractDriveFileId = (url) => {
    if (!url) return null;
    const regex = /(?:(?:drive|docs)\.google\.com\/(?:a\/[^/]+\/)?(?:file\/d\/|open\?id=|uc\?id=|thumbnail\?id=|document\/d\/|spreadsheets\/d\/|presentation\/d\/))([a-zA-Z0-9_-]{10,})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

export { saveToLocalStorage, getFromLocalStorage, removeFromLocalStorage, extractDriveFileId };
