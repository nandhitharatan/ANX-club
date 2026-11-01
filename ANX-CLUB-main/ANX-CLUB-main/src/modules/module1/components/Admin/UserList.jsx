import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const UserList = () => {
  const { getAllUsers, setMockUsers, currentUser } = useAuth();
  const users = getAllUsers();
  const [message, setMessage] = useState('');

  const getBadgeClass = (role) => {
    switch(role) {
      case 'Admin': return 'badge-admin';
      case 'Premium Member': return 'badge-premium';
      case 'Mentor': return 'badge-mentor';
      case 'Member': return 'badge-member';
      default: return 'badge-visitor';
    }
  };

  const handleRoleChange = (uid, newRole) => {
    // In a real app, this would be an admin cloud function call
    setMockUsers(prev => {
      const user = prev[uid];
      return {
        ...prev,
        [uid]: { ...user, role: newRole }
      };
    });
    setMessage(`Updated role for user to ${newRole}`);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="glass-panel animate-fade-in">
      <h2 style={{ marginBottom: '2rem' }}>Admin Dashboard: User Management</h2>
      
      {message && (
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Name</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Email</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Joined</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Role</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <td style={{ padding: '1rem' }}>{user.fullName} {user.uid === currentUser.uid && "(You)"}</td>
                <td style={{ padding: '1rem' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>{new Date(user.joinedDate).toLocaleDateString()}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${getBadgeClass(user.role)}`}>{user.role}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                    className="form-input"
                    style={{ width: 'auto', padding: '0.25rem 0.5rem', minWidth: '140px' }}
                    disabled={user.uid === currentUser.uid} // Don't let admin demote themselves easily here
                  >
                    <option value="Visitor">Visitor</option>
                    <option value="Member">Member</option>
                    <option value="Premium Member">Premium Member</option>
                    <option value="Mentor">Mentor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No users found.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
