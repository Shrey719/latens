importScripts("./config.js")
importScripts("../latens.sw.bundle.js")

self.addEventListener("fetch", (event) => {
    event.respondWith(
        routeLatens(event.request)
    );
});