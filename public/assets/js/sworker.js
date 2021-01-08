self.addEventListener("install", e=>{
    e.waitUntil(
        caches.open("static").then(cache=>{
            return cache.addAll(["/assets/css/style.css", "/", "/assets/css/bootstrap.css"]);
        })
    )
});

self.addEventListener("fetch", e=>{
    e.respondwith(
        caches.match(e.request).then(response=>{
            return response || fetch(e.request)
        })
    )
})