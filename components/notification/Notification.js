var notify = document.getElementById("notif");

showNotification = function (title, message, type) {
  const existingNotification = notify.querySelector(".notification");
  if (existingNotification) {
    notify.removeChild(existingNotification);
  }
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `<strong>${title}</strong><br>${message}`;

  notify.appendChild(notification);
  notify.classList.add("visible");

  setTimeout(() => {
    notify.classList.remove("visible");
  }, 3000);
};
