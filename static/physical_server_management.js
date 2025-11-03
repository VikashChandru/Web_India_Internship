let formMode = 'add';
let selectedSid = null;

// On page load
window.onload = () => fetchServers();

// Fetch all servers
function fetchServers() {
  fetch('/api/servers')
    .then(res => res.json())
    .then(data => {
      if (data.success) renderServerTable(data.servers);
    })
    .catch(err => console.error("Fetch servers error:", err));
}

// Render servers to table
function renderServerTable(servers) {
  const tbody = document.getElementById("serverTableBody");
  tbody.innerHTML = "";
  servers.forEach(server => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="radio" name="selectedServer" value="${server.id}" onclick="selectServer('${server.id}')"></td>
      <td>${server.id}</td>
      <td>${server.server_name}</td>
      <td>${server.type}</td>
      <td>${server.cpu}</td>
      <td>${server.ram}</td>
      <td>${server.disk_space}</td>
      <td>${server.created_by}</td>
      <td>${server.uptime}</td>
      <td><button class="btn btn-sm btn-info">Logs</button></td>
    `;
    tbody.appendChild(row);
  });
  selectedSid = null;
}

// Select server for update/delete
function selectServer(id) {
  selectedSid = id;
}

// Open Add or Update form
function openForm(mode) {
  formMode = mode;
  document.getElementById("formTitle").textContent = mode === 'add' ? "Add Server" : "Update Server";
  document.getElementById("overlay").style.display = "block";
  document.getElementById("formPopup").style.display = "block";
  clearForm();

  const sidInput = document.getElementById("sid");
  const typeInput = document.getElementById("type");
  typeInput.value = "Physical";
  typeInput.readOnly = true;

  if (mode === 'add') {
    sidInput.readOnly = true;
    fetchNextSid();
  } else {
    if (!selectedSid) {
      alert("Please select a server to update.");
      closeForm();
      return;
    }
    sidInput.readOnly = true;
    const selectedRow = [...document.querySelectorAll('input[name="selectedServer"]')]
      .find(radio => radio.checked).closest('tr');
    document.getElementById("sid").value = selectedRow.cells[1].textContent;
    document.getElementById("name").value = selectedRow.cells[2].textContent;
    typeInput.value = selectedRow.cells[3].textContent;
    document.getElementById("cpu").value = selectedRow.cells[4].textContent;
    document.getElementById("ram").value = selectedRow.cells[5].textContent;
    document.getElementById("disk").value = selectedRow.cells[6].textContent;
    document.getElementById("assigned").value = selectedRow.cells[7].textContent;
    document.getElementById("uptime").value = selectedRow.cells[8].textContent;
  }
}

// Fetch next available server ID
async function fetchNextSid() {
  try {
    const res = await fetch('/api/servers/next-id');
    const data = await res.json();
    document.getElementById("sid").value = data.nextId || "";
  } catch (err) {
    console.error("Failed to fetch next server ID:", err);
  }
}

// Clear form input fields
function clearForm() {
  const inputs = document.querySelectorAll("#formPopup input");
  inputs.forEach(input => {
    if (input.id !== "type") input.value = "";
    input.disabled = false;
    input.readOnly = false;
  });
  document.getElementById("type").value = "Physical";
}

// Close form popup
function closeForm() {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("formPopup").style.display = "none";
  clearForm();
}

// Submit form (Add/Update)
function submitForm() {
  const sid = document.getElementById("sid")?.value;
  const name = document.getElementById("name")?.value;
  const type = document.getElementById("type")?.value;
  const cpu = document.getElementById("cpu")?.value;
  const ram = document.getElementById("ram")?.value;
  const disk = document.getElementById("disk")?.value;
  const assigned = document.getElementById("assigned")?.value || "Unassigned";
  const uptime = document.getElementById("uptime")?.value || "0h";

  if (!name?.trim() || !cpu?.trim() || !ram?.trim()) {
    alert("Please fill in at least Name, CPU, and RAM.");
    return;
  }

  const payload = {
    server_name: name,
    type,
    cpu,
    ram,
    disk_space: disk,
    created_by: assigned,
    uptime
  };

  const url = formMode === 'add' ? '/api/servers' : `/api/servers/${sid}`;
  const method = formMode === 'add' ? 'POST' : 'PUT';

  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(`${formMode === 'add' ? "Added" : "Updated"} server successfully.`);
        fetchServers();
        closeForm();
      } else {
        alert("Server Error: " + (data.message || "Operation failed."));
      }
    })
    .catch(err => {
      console.error("Submit error:", err);
      alert("A network or server error occurred.");
    });
}

// Delete selected server
function deleteSelected() {
  if (!selectedSid) {
    alert("Please select a server to delete.");
    return;
  }
  if (!confirm(`Are you sure you want to delete server ID ${selectedSid}?`)) return;

  fetch(`/api/servers/${selectedSid}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Deleted server successfully.");
        fetchServers();
        selectedSid = null;
      } else {
        alert("Delete failed: " + (data.message || "Unknown error"));
      }
    })
    .catch(err => {
      console.error("Delete error:", err);
      alert("Failed to delete server.");
    });
}

// Filter table by S_ID or Name
function filterServers() {
  const input = document.getElementById("serverSearchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#serverTable tbody tr");
  rows.forEach(row => {
    const sid = row.cells[1].textContent.toLowerCase();
    const name = row.cells[2].textContent.toLowerCase();
    row.style.display = (sid.includes(input) || name.includes(input)) ? "" : "none";
  });
}

// Alert on high CPU or RAM usage
function checkUsage() {
  const rows = document.querySelectorAll("#serverTable tbody tr");
  rows.forEach(row => {
    const name = row.cells[2].textContent;
    const cpu = parseInt(row.cells[4].textContent.replace("%", ""), 10);
    const ram = parseInt(row.cells[5].textContent.replace("%", ""), 10);
    if (cpu >= 80) alert(`${name}: High CPU usage (${cpu}%)`);
    if (ram >= 80) alert(`${name}: High RAM usage (${ram}%)`);
  });
}
