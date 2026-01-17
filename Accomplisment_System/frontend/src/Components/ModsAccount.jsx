import './ModsAccount.css';

import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

import ModsAccountChart from './ModsAccountChart';

const ModsAccount = () => {
    const [logs, setLogs] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [declinedCount, setDeclinedCount] = useState(0);
    const [clickedReports, setClickedReports] = useState({}); // Track clicked reports

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await axios.get('http://localhost:5000/reports');
                setLogs(response.data);
                updateCounts(response.data);
                // Initialize clickedReports state based on fetched data
                const initialClickedReports = response.data.reduce((acc, log) => {
                    if (log.status === 'approved' || log.status === 'declined') {
                        acc[log.id] = true;
                    }
                    return acc;
                }, {});
                setClickedReports(initialClickedReports);
            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        };

        fetchReports();
    }, []);

    const updateCounts = (logs) => {
        const pending = logs.filter(log => log.status === 'pending').length;
        const approved = logs.filter(log => log.status === 'approved').length;
        const declined = logs.filter(log => log.status === 'declined').length;

        setPendingCount(pending);
        setApprovedCount(approved);
        setDeclinedCount(declined);
    };

    const handleApprove = async (reportId) => {
        try {
            await axios.put(`http://localhost:5000/reports/${reportId}/approve`);
            alert('Report approved');
            const updatedLogs = logs.map(log => log.id === reportId ? { ...log, status: 'approved' } : log);
            setLogs(updatedLogs);
            updateCounts(updatedLogs);
            setClickedReports(prevState => ({ ...prevState, [reportId]: true })); // Mark report as clicked
        } catch (error) {
            console.error('Error approving report:', error);
            alert('Failed to approve report');
        }
    };

    const handleReject = async (reportId) => {
        try {
            await axios.put(`http://localhost:5000/reports/${reportId}/reject`);
            alert('Report rejected');
            const updatedLogs = logs.map(log => log.id === reportId ? { ...log, status: 'declined' } : log);
            setLogs(updatedLogs);
            updateCounts(updatedLogs);
            setClickedReports(prevState => ({ ...prevState, [reportId]: true })); // Mark report as clicked
        } catch (error) {
            console.error('Error rejecting report:', error);
            alert('Failed to reject report');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('authToken');
        alert('Logged out successfully');
        window.location.href = '/#';
    };

    return (
        <div className="container">
            <h1>Moderator Dashboard</h1>
            <div className="mods-account">
                {/* Left Column: Employee Reports (Scrollable) */}
                <div className="employee-reports">
                    <h2>Employee Reports</h2>
                    <div className="employee-logs">
                        {logs.map((log) => (
                            <div className={`employee-log ${clickedReports[log.id] && log.status !== 'declined' ? 'blurred' : ''}`} key={log.id}>
                                <div className="employee-header">
                                    <div className="employee-avatar" />
                                    <span>{log.name}</span>
                                </div>
                                <div className="employee-message">
                                    <p>{log.report}</p>
                                </div>
                                <div className="employee-actions">
                                    <button
                                        className="action-btn approve"
                                        onClick={() => handleApprove(log.id)}
                                        disabled={clickedReports[log.id]}
                                    >
                                        ✔️ Approve
                                    </button>
                                    <button
                                        className="action-btn reject"
                                        onClick={() => handleReject(log.id)}
                                        disabled={clickedReports[log.id]}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: ModsAccountChart (no container) */}
                <div className="chart-wrapper">
                    <ModsAccountChart pendingCount={pendingCount} approvedCount={approvedCount} declinedCount={declinedCount} />
                </div>
            </div>

            <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default ModsAccount;