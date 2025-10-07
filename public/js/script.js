document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('userForm');
  const list = document.getElementById('userList');

  async function loadUsers() {
    list.innerHTML = `<p class="text-gray-400 text-center col-span-full animate-pulse">Loading users...</p>`;
    const res = await fetch('/api/users');
    const data = await res.json();
    if (!data.users.length) {
      list.innerHTML = `<p class="text-gray-500 text-center col-span-full">No users found. Add one!</p>`;
      return;
    }

    list.innerHTML = data.users
      .map(
        (u) => `
      <div class="user-card bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl shadow-lg hover:border-cyan-500 transition-all">
        <div class="flex items-center gap-4">
          <img
            src="${u.photo_path || '/images/default.png'}"
            alt="${u.name}"
            class="user-photo w-16 h-16 object-cover rounded-full border-2 border-cyan-400"
          />
          <div>
            <p class="font-semibold text-lg">${u.name}</p>
            <p class="text-sm text-gray-400">${u.email}</p>
            <p class="text-xs text-gray-500 mt-1">${new Date(u.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.innerText = 'Adding...';

    const res = await fetch('/api/users', { method: 'POST', body: formData });
    const result = await res.json();

    btn.disabled = false;
    btn.innerText = 'Add User';

    if (result.success) {
      form.reset();
      loadUsers();
    } else {
      alert(`❌ Error: ${result.error || 'Something went wrong'}`);
    }
  });

  loadUsers();
});
