// Simple role manager for admin/staff
import React, { useState } from 'react';

export type Role = 'admin' | 'staff';

export function getUserRole(): Role {
  return (localStorage.getItem('user_role') as Role) || 'staff';
}

export function setUserRole(role: Role) {
  localStorage.setItem('user_role', role);
}

export const RoleManager: React.FC = () => {
  const [role, setRoleState] = useState<Role>(getUserRole());
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setUserRole(e.target.value as Role);
    setRoleState(e.target.value as Role);
  }
  return (
    <div className="mb-4">
      <label className="mr-2">Role:</label>
      <select value={role} onChange={handleChange} className="border px-2 py-1 rounded">
        <option value="admin">Admin</option>
        <option value="staff">Staff</option>
      </select>
    </div>
  );
};
