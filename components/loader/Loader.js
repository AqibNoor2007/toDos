const loaderContainer = document.createElement("div");
loaderContainer.id = "loader-container";
loaderContainer.style.display = "none";

const loader = document.createElement("div");
loader.id = "loader";

loaderContainer.appendChild(loader);
document.body.appendChild(loaderContainer);

function showLoader() {
  loaderContainer.style.display = "flex";
}

function hideLoader() {
  loaderContainer.style.display = "none";
}
