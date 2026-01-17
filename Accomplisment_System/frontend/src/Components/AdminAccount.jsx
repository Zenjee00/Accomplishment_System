import './AdminAccount.css';

import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

import UserRoleChart from './UserRoleChart';

function AdminAccount() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [newAdmin, setNewAdmin] = useState({
        email: '',
        password: '',
        employeeID: '',
        firstName: '',
        lastName: '',
        department: '',
        role: 'admin',
        failed_attempts: 0,
        lock_until: null
    });
    const [employeeCount, setEmployeeCount] = useState(0);
    const [moderatorCount, setModeratorCount] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [adminLogs, setAdminLogs] = useState([]); // New state for admin activity logs

    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        const fetchRoleStats = async () => {
            try {
                const response = await axios.get('http://localhost:5000/user-role-stats');
                const stats = response.data;
                const employeeCount = stats.find(stat => stat.role === 'employee')?.count || 0;
                const moderatorCount = stats.find(stat => stat.role === 'moderator')?.count || 0;
                setEmployeeCount(employeeCount);
                setModeratorCount(moderatorCount);
            } catch (error) {
                console.error('Error fetching role stats:', error);
            }
        };

        fetchRoleStats();
        const intervalId = setInterval(fetchRoleStats, 5000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const fetchAdminLogs = async () => {
            try {
                const response = await axios.get('http://localhost:5000/admin-logs');
                setAdminLogs(response.data);
            } catch (error) {
                console.error('Error fetching admin logs:', error);
            }
        };
    
        fetchAdminLogs();
    }, []);

    const fetchData = (term) => {
        axios.get(`http://localhost:5000/search/users?term=${term}`)
            .then(response => {
                setUsers(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching the users!', error);
            });
    };

    const fetchReports = (userId) => {
        if (userId) {
            axios.get(`http://localhost:5000/reports?employeeId=${userId}`)
                .then(response => {
                    setReports(response.data);
                })
                .catch(error => {
                    console.error('There was an error fetching the reports for the selected employee!', error);
                });
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchClick = () => {
        fetchData(searchTerm);
    };

    const handleEdit = (user) => {
        console.log('Editing user:', user); // Debugging log
        setEditingUser(user);
        setEditFormData(user);
        fetchReports(user.id);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;

        setEditFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleEmployeeIDClick = () => {
        const rolePrefix = editFormData.role === 'moderator' ? '3' : '1';
        const randomNumber = Math.floor(1000 + Math.random() * 9000).toString().slice(1); // Generates a 4-digit random number
        const newEmployeeID = rolePrefix + randomNumber;

        setEditFormData(prevState => ({
            ...prevState,
            employeeID: newEmployeeID,
            employeeIDReadOnly: true
        }));
    };

    const handleNewAdminIDClick = () => {
        const rolePrefix = '5';
        const randomNumber = Math.floor(1000 + Math.random() * 9000).toString().slice(1); // Generates a 4-digit random number
        const newEmployeeID = rolePrefix + randomNumber;

        setNewAdmin(prevState => ({
            ...prevState,
            employeeID: newEmployeeID,
            employeeIDReadOnly: true
        }));
    };

    const handleUpdateUser = () => {
        if (!editFormData.id) {
            alert("User ID is required.");
            return;
        }

        axios.put('http://localhost:5000/users/edit', editFormData)
            .then(response => {
                console.log('User updated successfully:', response.data);
                alert('User updated successfully!');
                fetchData(searchTerm);
                setEditingUser(null);
                setEditFormData({});

                // Navigate based on the role
                if (editFormData.role === 'employee') {
                    navigate('/useraccount');
                } else if (editFormData.role === 'moderator') {
                    navigate('/modsaccount');
                }
            })
            .catch(error => {
                let errorMessage = "An error occurred while updating the user. Please try again.";

                if (error.response) {
                    errorMessage = error.response.data.message || errorMessage;
                } else if (error.request) {
                    errorMessage = "No response from the server. Please check your internet connection.";
                } else {
                    errorMessage = error.message || errorMessage;
                }

                alert(errorMessage);
                console.error('Error updating user:', error);
            });
    };

    const handleDelete = (userId) => {
        axios.delete(`http://localhost:5000/users/${userId}`)
            .then(response => {
                console.log('User deleted successfully:', response.data);
                alert('User deleted successfully!');
                fetchData(searchTerm);
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                if (error.response) {
                    console.log("Server response:", error.response.data);
                    alert(error.response.data.message || "Error deleting user. Please try again.");
                } else {
                    alert("Error deleting user. Please try again.");
                }
            });
    };

    const handleLogout = () => {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('employeeId');
        alert('Logged out successfully');
        window.location.href = '/#';
    };

    const handleAddAdminChange = (e) => {
        const { name, value } = e.target;
        setNewAdmin(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const addAdmin = () => {
        axios.post('http://localhost:5000/users/admin', newAdmin)
            .then(response => {
                console.log('Admin added successfully:', response.data);
                alert('Admin added successfully!');
                setNewAdmin({
                    email: '',
                    password: '',
                    employeeID: '',
                    firstName: '',
                    lastName: '',
                    department: '',
                    role: 'admin',
                    failed_attempts: 0,
                    lock_until: null
                });
                fetchData(searchTerm);
            })
            .catch(error => {
                console.error('Error adding admin:', error);
                alert("Error adding admin. Please try again.");
            });
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="admin-container">
            <h2>Hello, Admin</h2>

            {/* Top Bar */}
            <div className="top-bar">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <button onClick={handleSearchClick}>Search</button>
                <button onClick={handleLogout}>Logout</button>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="top-section">
                    {/* Add Admin Form */}
                    <div className="addadmin-container">
                        <h3>Add Admin</h3>
                        <form onSubmit={(e) => e.preventDefault()} className="minimal-form">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={newAdmin.email}
                                onChange={handleAddAdminChange}
                            />
                            <div className="password-input">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={newAdmin.password}
                                    onChange={handleAddAdminChange}
                                />
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={showPassword}
                                        onChange={toggleShowPassword}
                                    />
                                    Show Password
                                </label>
                            </div>
                            <input
                                type="text"
                                name="employeeID"
                                placeholder="Employee ID"
                                value={newAdmin.employeeID}
                                onChange={handleAddAdminChange}
                                onClick={handleNewAdminIDClick}
                                readOnly={newAdmin.employeeIDReadOnly}
                            />
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First Name"
                                value={newAdmin.firstName}
                                onChange={handleAddAdminChange}
                            />
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last Name"
                                value={newAdmin.lastName}
                                onChange={handleAddAdminChange}
                            />
                            <input
                                type="text"
                                name="department"
                                placeholder="Department"
                                value={newAdmin.department}
                                onChange={handleAddAdminChange}
                            />
                            <button type="button" onClick={addAdmin}>Add Admin</button>
                        </form>
                    </div>

                    {/* Users List */}
                    <div className="users-container">
                        <div className="users-list">
                            <h3>Users List</h3>
                            <div className="users-table-wrapper"> {/* Scrollable wrapper */}
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>Employee ID</th>
                                            <th>First Name</th>
                                            <th>Last Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Department</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length > 0 ? (
                                            users.map(user => (
                                                <tr key={user.id}>
                                                    <td>{user.employeeID}</td>
                                                    <td>{user.firstName}</td>
                                                    <td>{user.lastName}</td>
                                                    <td>{user.email}</td>
                                                    <td>{user.role}</td>
                                                    <td>{user.department}</td>
                                                    <td>
                                                        <button onClick={() => handleEdit(user)}>Edit</button>
                                                        <button onClick={() => handleDelete(user.id)}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7">No users found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bottom-section">
                    {/* Edit User Form */}
                    <div className="edit-container">
                        <h3>Edit User</h3>
                        {editingUser && (
                            <div>
                                <form onSubmit={(e) => e.preventDefault()} className="minimal-form">
                                    <input
                                        type="text"
                                        name="id"
                                        placeholder="User ID"
                                        value={editFormData.id || ''}
                                        onChange={handleEditChange}
                                        disabled
                                    />
                                    <input
                                        type="text"
                                        name="employeeID"
                                        placeholder="Employee ID"
                                        value={editFormData.employeeID || ''}
                                        onChange={handleEditChange}
                                        onClick={handleEmployeeIDClick}
                                        readOnly={editFormData.employeeIDReadOnly}
                                    />
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="First Name"
                                        value={editFormData.firstName || ''}
                                        onChange={handleEditChange}
                                    />
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Last Name"
                                        value={editFormData.lastName || ''}
                                        onChange={handleEditChange}
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        value={editFormData.email || ''}
                                        onChange={handleEditChange}
                                    />
                                    <select
                                        name="role"
                                        value={editFormData.role || ''}
                                        onChange={handleEditChange}
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="moderator">Moderator</option>
                                    </select>
                                    <input
                                        type="text"
                                        name="department"
                                        placeholder="Department"
                                        value={editFormData.department || ''}
                                        onChange={handleEditChange}
                                    />
                                    <button type="button" onClick={handleUpdateUser}>Update</button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Chart */}
                    <div className="chart-container">
                        <h3>User Role Statistics</h3>
                        <UserRoleChart employeeCount={employeeCount} moderatorCount={moderatorCount} />
                    </div>

                    {/* Admin Activity Logs */}
                    <div className="admin-logs-container">
                        <h3>Admin Activity Logs</h3>
                        <div className="admin-logs-table-wrapper"> {/* Scrollable wrapper */}
                            <table className="admin-logs-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Admin</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adminLogs.length > 0 ? (
                                        adminLogs.map(log => (
                                            <tr key={log.id}>
                                                <td>{new Date(log.timestamp).toLocaleString()}</td>
                                                <td>{log.admin_email}</td>
                                                <td>{log.action}</td>
                                                <td className="log-details">{log.details}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4">No logs found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default AdminAccount;