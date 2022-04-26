import sw from "service-worker?url";
import { sleep } from "../utils";

/**
 * When this resolves, the service worker can intercept requests.
 */
function waitForController() {
    return new Promise((resolve) => {
        if (navigator.serviceWorker.controller) {
            resolve(null);
        } else {
            navigator.serviceWorker.addEventListener("controllerchange", resolve);
        }
    });
}

export async function register() {
    if ("serviceWorker" in navigator) {
        const MAX_RETRY = 3;
        for (let i = 0; i < MAX_RETRY; i++) {
            const registration = await navigator.serviceWorker.register(sw, { scope: "/" });
            try {
                // execute waitForController with a time limit of 100 ms
                await Promise.race([waitForController(), sleep(100, true)]);
                // success
                return;
            } catch (e) {
                // try again
                await registration.unregister();
            }
        }
        throw new Error("Could not initialize the service worker");
    } else {
        throw new Error("Service workers are not supported");
    }
}