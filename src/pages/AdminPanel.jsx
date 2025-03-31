import React from 'react';
import './AdminPanel.css';
import { useSelector } from 'react-redux';

const AdminPanel = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <p>Welcome, <strong>{user?.username}</strong>!</p>
      <p>You have administrative access to manage the dataset.</p>

      <div className="admin-actions">
        <p>Coming soon: manage users, delete entries, view logs, etc.</p>
        {/* Example buttons/components that could be implemented later */}
        {/* <button>Review Suggested Edits</button> */}
        {/* <button>Delete All Sites</button> */}
      </div>
    </div>
  );
};

export default AdminPanel;