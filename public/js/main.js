document.addEventListener("DOMContentLoaded", () => {
  const userForm = document.getElementById("userForm");
  const userList = document.getElementById("userList");
  const statusMsg = document.getElementById("statusMsg");

  async function checkDB() {
    try {
      const res = await fetch("/api/check-db");
      const data = await res.json();
      if (data.status === "ok") {
        console.log("✅ Database connection OK:", data.time);
      }
    } catch (e) {
      console.error("❌ Database not reachable:", e);
    }
  }

  async function loadUsers() {
    userList.innerHTML = `<p class="text-gray-500 col-span-full text-center animate-pulse">Loading users...</p>`;
    try {
      const res = await fetch("/api/users");
      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Failed to load users.");

      userList.innerHTML = data.users
        .map(
          (u) => `
        <div class="bg-white rounded-xl shadow-md p-5 flex flex-col items-center text-center hover:shadow-lg transition-all duration-200">
          <img src="${u.photo_path}" alt="${u.name}" class="w-24 h-24 rounded-full object-cover border-2 border-primary mb-3 shadow-sm" />
          <h4 class="font-semibold text-gray-800">${u.name}</h4>
          <p class="text-sm text-gray-500">${u.email}</p>
          <p class="text-xs text-gray-400 mt-1">${new Date(
            u.created_at
          ).toLocaleString()}</p>
        </div>`
        )
        .join("");
    } catch (err) {
      console.error(err);
      userList.innerHTML = `<p class="text-red-500 col-span-full text-center">⚠️ Failed to load users.</p>`;
    }
  }

  userForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusMsg.classList.remove("hidden");
    statusMsg.textContent = "Uploading...";
    statusMsg.className =
      "mt-4 text-center text-sm text-blue-500 animate-pulse";

    const formData = new FormData(userForm);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        statusMsg.textContent = "✅ User added successfully!";
        statusMsg.className = "mt-4 text-center text-sm text-green-600";
        userForm.reset();
        loadUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      statusMsg.textContent = `❌ ${err.message}`;
      statusMsg.className = "mt-4 text-center text-sm text-red-500";
    }
  });

  checkDB();
  loadUsers();
});
