import { useAppSelector } from '../app/hooks';
import type { RootState } from '../app/store';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <p>Welcome, <strong>{user?.username}</strong>!</p>
      <p>You have administrative access to manage the dataset.</p>

      <div className="admin-actions">
        <p>Coming soon: manage users, delete entries, view logs, etc.</p>
      </div>
    </div>
  );
};

export default AdminPanel;

