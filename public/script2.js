let userId = localStorage.getItem("userId");

async function loadResources() {
    let response = await fetch(`/user-resources/${userId}`);
    let data = await response.json();
    document.getElementById("ram").innerText = data.ram;
    document.getElementById("cpu").innerText = data.cpu;
    document.getElementById("disk").innerText = data.disk;
}

document.getElementById("deploy-button").addEventListener("click", async function() {
    let response = await fetch(`/deploy/${userId}`, { method: "POST" });
    let data = await response.json();
    document.getElementById("message").innerText = data.message;
    loadResources();
});

loadResources();
