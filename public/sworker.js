self.addEventListener("install", e=>{
    e.waitUntil(
        caches.open("static").then(cache=>{
            return cache.addAll(["/assets/css/style.css", "/assets/css/bootstrap.css", "/assets/icons/icon64.png", "/assets/icons/icon128.png", "/assets/icons/icon256.png", "/assets/icons/icon512.png", "/assets/js/script.js"]);
        })
    )
});

self.addEventListener("fetch", e=>{
    e.respondWith(
        caches.match(e.request).then(response=>{
            return response || fetch(e.request)
        })
    )
})