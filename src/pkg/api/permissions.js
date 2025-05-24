const API_BASE = "https://api.yareyare.software/api/v1/";

function getToken() {
  return localStorage.getItem("token");
}

export async function getAllPermissions() {
  const res = await fetch(API_BASE, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error("Failed to fetch permissions");
  return res.json();
}

export async function getPermissionById(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error("Failed to fetch permission by id");
  return res.json();
}

export async function getUserPermissions(userId) {
  const res = await fetch(`${API_BASE}/user/${userId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error("Failed to fetch user permissions");
  return res.json();
}

export async function getGroupPermissions(groupId) {
  const res = await fetch(`${API_BASE}/group/${groupId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error("Failed to fetch group permissions");
  return res.json();
}

export async function createGroupPermission({ resourceType, permissions, folderId, groupId, inherited }) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ resourceType, permissions, folderId, groupId, inherited })
  });
  if (!res.ok) throw new Error("Failed to create group permission");
  return res.json();
}

export async function createMemberPermission({ resourceType, permissions, folderId, accountId, inherited }) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ resourceType, permissions, folderId, accountId, inherited })
  });
  if (!res.ok) throw new Error("Failed to create member permission");
  return res.json();
}