async function loadconfig() {
  const response = await fetch("config.json");
  const config = await response.json();

  document.title = config.title;
  document.getElementById("title").innerText = config.title;
  document.getElementById("subtitle").innerText = config.subtitle;

  const iconsDiv = document.getElementById("icons");

  config.links.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    const icon = document.createElement("i");
    icon.className = link.icon;
    icon.classList.add("icon");

    a.appendChild(icon);
    iconsDiv.appendChild(a);
  });
}

loadconfig();
