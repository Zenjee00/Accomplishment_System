import './UserAccount.css';

import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

const UserAccount = () => {
  const [name, setName] = useState('');
  const [report, setReport] = useState('');
  const [submittedData, setSubmittedData] = useState([]);
  const [editReport, setEditReport] = useState({}); // State for editing a rejected report
  const [loggedInUser, setLoggedInUser] = useState(''); // State for logged-in user's first name

  // Fetch logged-in user's first name when the component mounts
                 useEffect(() => {
            const fetchLoggedInUser = async () => {
              try {
                const token = localStorage.getItem('token');
                console.log('Retrieved token:', token); // Debugging log
          
                if (!token) {
                  console.error('No token found in localStorage');
                  alert('No token found. Please log in again.');
                  return;
                }
          
                const response = await axios.get('http://localhost:5000/loggedInUser', {
                  headers: { Authorization: `Bearer ${token}` }, // Ensure the token is in the correct format
                });
          
                console.log('Logged-in user response:', response.data); // Debugging log
                setLoggedInUser(response.data.firstName);
              } catch (error) {
                console.error('Error fetching logged-in user:', error);
                if (error.response) {
                  console.log('Error response:', error.response); // Debugging log
                }
                alert('Failed to fetch logged-in user. Please try again.');
              }
            };
            fetchLoggedInUser();
          }, []);

  // Fetch submitted reports when the component mounts
  useEffect(() => {
    const fetchSubmittedData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/reports');
        setSubmittedData(response.data);
      } catch (error) {
        console.error('Error fetching submitted reports:', error);
        alert('Failed to fetch submitted reports. Please try again.');
      }
    };
    fetchSubmittedData();
  }, []);

    const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = { firstName: name, report };
  
      // Check if the input name matches the logged-in user's first name
      if (name !== loggedInUser) {
          alert('You can only submit a report with your own first name.');
          return;
      }
  
      try {
          const token = localStorage.getItem('token');
          console.log('Retrieved token for submission:', token); // Debugging log
  
          if (!token) {
              console.error('No token found in localStorage');
              alert('No token found. Please log in again.');
              return;
          }
  
          // If the firstName exists, submit the report
          const response = await axios.post('http://localhost:5000/submit', formData, {
              headers: { Authorization: `Bearer ${token}` },
          });
  
          if (response.data.message === 'Report submitted successfully') {
              alert('Report submitted successfully!');
              setSubmittedData([...submittedData, { ...formData, status: 'pending' }]);
              setName('');
              setReport('');
          } else {
              alert('Failed to submit report.');
          }
      } catch (error) {
          console.error('Error submitting form:', error);
          if (error.response) {
              console.log('Error response:', error.response); // Debugging log
          }
          alert('An error occurred while submitting your report. Please try again.');
      }
  };

  const handleEditChange = (e, id) => {
    setEditReport({ ...editReport, [id]: { ...editReport[id], report: e.target.value } });
  };

  const handleEditSubmit = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/reports/${id}/edit`, {
        report: editReport[id].report,
      }, {
        headers: { Authorization: token },
      });
      if (response.data.message === 'Report updated successfully') {
        alert('Report updated successfully!');
        const updatedReports = submittedData.map((data) =>
          data.id === id ? { ...data, report: editReport[id].report, status: 'pending' } : data
        );
        setSubmittedData(updatedReports);
        setEditReport((prev) => ({ ...prev, [id]: undefined }));
      } else {
        alert('Failed to update the report.');
      }
    } catch (error) {
      console.error('Error updating report:', error);
      alert('An error occurred while updating the report. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    alert('Logged out successfully');
    window.location.href = '/'; // Use '/' for proper redirect
  };

  return (
    <div className="user-account-container">
      <div className="form-container">
        <h1>Submit Your Report</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <label>First Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your first name"
              required
            />
          </div>
          <div className="input-container">
            <label>Report:</label>
            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              placeholder="Enter Report"
              required
            />
          </div>
          <button type="submit">Submit</button>
          <button type="button" onClick={handleLogout}>Logout</button>
        </form>
      </div>

      {/* Displaying Submitted Data in a Table */}
      {submittedData.length > 0 && (
        <div className="submitted-data-container">
          <h2>Submitted Reports</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Report</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submittedData.map((data) => (
                <tr key={data.id}>
                  <td>{data.firstName}</td>
                  <td>
                    {data.status === 'rejected' && editReport[data.id] ? (
                      <textarea
                        value={editReport[data.id].report}
                        onChange={(e) => handleEditChange(e, data.id)}
                      />
                    ) : (
                      data.report
                    )}
                  </td>
                  <td>{data.status}</td>
                  <td>
                    {data.status === 'rejected' ? (
                      editReport[data.id] ? (
                        <button onClick={() => handleEditSubmit(data.id)}>Save</button>
                      ) : (
                        <button onClick={() => setEditReport({ ...editReport, [data.id]: data })}>
                          Edit
                        </button>
                      )
                    ) : (
                      'No actions available'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserAccount;