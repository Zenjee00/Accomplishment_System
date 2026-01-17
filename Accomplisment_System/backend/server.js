const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const secretKey = 'f7d9K@lP!o92W*jaO1rX8zQb5V3sNt&M'; 

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: '3306',
    database: 'accomplishment_db' // Your database name
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Encryption and Decryption settings
const algorithm = 'aes-256-cbc'; // AES encryption algorithm
const key = crypto.createHash('sha256').update(String(process.env.ENCRYPTION_KEY)).digest('base64').substr(0, 32); // Generate a secure encryption key from an environment variable
const iv = crypto.createHash('sha256').update(String(process.env.ENCRYPTION_IV)).digest('base64').substr(0, 16);

// Function to encrypt text (e.g., email, name)
function encrypt(text) {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), Buffer.from(iv));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}

// Function to decrypt text (e.g., email, name)
function decrypt(text) {
    let encryptedText = Buffer.from(text, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), Buffer.from(iv));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
// Function to simulate comparison between encrypted data
function compareEncryptedData(encryptedData, dataToCompare) {
    const encryptedCompare = encrypt(dataToCompare); // Encrypt the input to compare
    return encryptedData === encryptedCompare; // Compare encrypted values directly
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Access token is missing or invalid' });
    }
  
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }
  
      req.user = user;
      next();
    });
  };



  const logAdminAction = (admin_email, action, details) => {
    const timestamp = new Date();
    console.log(`Logging admin action: email=${admin_email}, action=${action}, details=${details}`); // Add this line
    db.query(
        'INSERT INTO admin_logs (timestamp, admin_email, action, details) VALUES (?, ?, ?, ?)',
        [timestamp, admin_email, action, details],
        (err, result) => {
            if (err) {
                console.error('Error logging admin action:', err);
            } else {
                console.log('Admin action logged successfully');
            }
        }
    );
};

// Route to get all admin logs
app.get('/admin-logs', (req, res) => {
    db.query('SELECT * FROM admin_logs ORDER BY timestamp DESC', (err, results) => {
        if (err) {
            console.error('Error fetching admin logs:', err);
            res.status(500).json({ message: 'Error fetching admin logs' });
            return;
        }
        res.json(results);
    });
});


// Register route
app.post('/register', async (req, res) => {
    const { employeeID, firstName, lastName, email, department, password, role } = req.body;

    // Validate that employeeID is a valid number
    if (!/^\d+$/.test(employeeID)) {
        return res.status(400).json({ message: 'Employee ID must be a valid number.' });
    }

    // Password validation: at least 5 characters, 3 numbers, 2 letters
    const passwordPattern = /^(?=.*[0-9].*[0-9].*[0-9])(?=.*[A-Za-z].*[A-Za-z]).{5,}$/;
    if (!passwordPattern.test(password)) {
        return res.status(400).json({
            message: 'Password must be at least 5 characters long and contain at least 3 numbers and 2 letters.'
        });
    }

    try {
        // Generate a hashed password (with automatic salt generation)
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Encrypt other sensitive fields
        const encryptedLastName = encrypt(lastName);
        const encryptedDepartment = encrypt(department);
        const encryptedEmail = encrypt(email); // Encrypt email too

        // Insert data into the users table (firstName is not encrypted)
        const query = 'INSERT INTO users (employeeID, firstName, lastName, email, department, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
        
        db.query(query, [employeeID, firstName, encryptedLastName, encryptedEmail, encryptedDepartment, hashedPassword, role], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Registration failed', error: err });
            }
            return res.status(200).json({ message: 'Registration successful', role });
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error hashing password', error });
    }
});

// 2/3/2025
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Encrypt the email input before querying the database
        const encryptedEmailInput = encrypt(email);

        // Query for user with the encrypted email
        const queryUser = 'SELECT * FROM users WHERE email = ?';

        db.query(queryUser, [encryptedEmailInput], async (err, userResults) => {
            if (err) {
                console.error('Error querying users table:', err);
                return res.status(500).json({ message: 'Login failed', error: err });
            }

            if (userResults.length > 0) {
                // User found
                const user = userResults[0];

                // Compare the password with the stored hash
                const isMatch = await bcrypt.compare(password, user.password);

                if (isMatch) {
                    // Generate a JWT token
                    const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });

                    // Reset failed login attempts on successful login
                    const resetAttemptsQuery = 'UPDATE users SET failed_attempts = 0, lock_until = NULL WHERE email = ?';
                    db.query(resetAttemptsQuery, [encryptedEmailInput], (resetErr) => {
                        if (resetErr) {
                            console.error('Error resetting failed attempts:', resetErr);
                            // Log the error but don't fail the login
                        }
                        console.log(`User ${email} logged in successfully.`);
                        return res.status(200).json({ message: 'Login successful', token, role: user.role });
                    });
                } else {
                    // Increment failed login attempts
                    const incrementAttemptsQuery = 'UPDATE users SET failed_attempts = failed_attempts + 1 WHERE email = ?';
                    db.query(incrementAttemptsQuery, [encryptedEmailInput], (incrementErr) => {
                        if (incrementErr) {
                            console.error('Error incrementing failed attempts:', incrementErr);
                            return res.status(500).json({ message: 'Login failed', error: incrementErr });
                        }

                        // Check if user is locked
                        const checkLockQuery = 'SELECT failed_attempts, lock_until FROM users WHERE email = ?';
                        db.query(checkLockQuery, [encryptedEmailInput], (checkLockErr, lockResults) => {
                            if (checkLockErr) {
                                console.error('Error checking lock status:', checkLockErr);
                                return res.status(500).json({ message: 'Login failed', error: checkLockErr });
                            }

                            if (lockResults.length > 0) {
                                const { failed_attempts, lock_until } = lockResults[0];
                                if (failed_attempts >= 3 && lock_until > new Date()) {
                                    const timeLeft = Math.ceil((new Date(lock_until) - new Date()) / 60000); // Minutes remaining
                                    console.warn(`Failed login attempt for user ${email}: Account locked.`);
                                    return res.status(403).json({ message: `Account locked. Please try again in ${timeLeft} minutes.` });
                                } else {
                                    console.warn(`Failed login attempt for user ${email}: Invalid password.`);
                                    return res.status(400).json({ message: 'Invalid credentials' });
                                }
                            } else {
                                console.warn(`Failed login attempt for user ${email}: Invalid password.`);
                                return res.status(400).json({ message: 'Invalid credentials' });
                            }
                        });
                    });
                }
            } else {
                console.warn(`Failed login attempt for email ${email}: User not found.`);
                return res.status(400).json({ message: 'Invalid credentials' });
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
});
          // 2/3/2025   

          app.post('/admin-login', async (req, res) => {
            const { email, password } = req.body;
        
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
        
            try {
                // Encrypt the email input before querying the database
                const encryptedEmailInput = encrypt(email); // Use the same encryption method as during registration
        
                // Query for admin in the 'user_admin' table
                const queryAdmin = 'SELECT * FROM user_admin WHERE email = ?';
        
                db.query(queryAdmin, [encryptedEmailInput], async (err, adminResults) => {
                    if (err) {
                        console.error('Error querying user_admin table:', err);
                        return res.status(500).json({ message: 'Login failed', error: err });
                    }
        
                    if (adminResults.length > 0) {
                        // Admin found
                        const admin = adminResults[0];
        
                        // Compare passwords
                        const isMatch = await bcrypt.compare(password, admin.password);
        
                        if (isMatch) {
                            console.log(`Admin ${admin.email} logged in successfully.`);
                            return res.status(200).json({ message: 'Login successful', role: 'admin' });
                        } else {
                            console.warn(`Failed login attempt for admin ${admin.email}: Invalid password.`);
                            return res.status(400).json({ message: 'Invalid credentials' });
                        }
                    } else {
                        console.warn(`Failed login attempt for email ${email}: Admin not found.`);
                        return res.status(400).json({ message: 'Invalid credentials' });
                    }
                });
            } catch (error) {
                console.error('Error during login:', error);
                return res.status(500).json({ message: 'Internal server error', error });
            }
        });
           
            // Search Users route - Now supports searching by employeeID, firstName, or lastName
            app.get('/search/users', (req, res) => {
                const searchTerm = req.query.term;
                const query = `
                    SELECT * FROM users 
                    WHERE employeeID LIKE ? 
                    OR firstName LIKE ? 
                    OR lastName LIKE ?`;

                db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error fetching users', error: err });
                    }
                    return res.status(200).json(results); // Return the filtered users
                });
            });
            // 2/17/2025
            app.delete('/users/:id', (req, res) => {
                const userId = req.params.id;
            
                db.query('DELETE FROM users WHERE id = ?', userId, (err, result) => {
                    if (err) {
                        console.error('Error deleting user:', err);
                        return res.status(500).json({ message: 'Error deleting user', error: err.message });
                    }
            
                    // Log the user deletion action
                    logAdminAction('admin@example.com', 'Delete User', `User ID ${userId} deleted`);
            
                    res.json({ message: 'User deleted successfully' });
                });
            });
            

            // 1/23/2025
            app.put('/users/edit', (req, res) => {
                const { id, employeeID, firstName, lastName, email, role, department } = req.body;
            
                // Encrypt new data
                const encryptedFirstName = encrypt(firstName);
                const encryptedLastName = encrypt(lastName);
                const encryptedDepartment = encrypt(department);
                const encryptedEmail = encrypt(email); // Encrypt email as well
            
                const query = `UPDATE users SET 
                    employeeID = ?, 
                    firstName = ?, 
                    lastName = ?, 
                    email = ?, 
                    role = ?, 
                    department = ?  
                    WHERE id = ?`;
            
                db.query(query, [employeeID, encryptedFirstName, encryptedLastName, encryptedEmail, role, encryptedDepartment, id], (error, result) => {
                    if (error) {
                        console.error('Error updating user:', error);
                        return res.status(500).json({ message: "Error updating user", error: error.message });
                    }
            
                    // Log the user update action
                    logAdminAction(email, 'Update User', `User ID ${id} updated`);
            
                    res.json({ message: 'User updated successfully' });
                });
            });
            


            /// 2/25/2025
                app.get('/loggedInUser', authenticateToken, (req, res) => {
                    const userId = req.user.userId;
                
                    const query = 'SELECT firstName FROM users WHERE id = ?';
                    db.query(query, [userId], (err, results) => {
                        if (err) {
                            console.error('Error fetching logged-in user:', err);
                            return res.status(500).json({ message: 'Error fetching logged-in user', error: err });
                        }
                
                        if (results.length === 0) {
                            return res.status(404).json({ message: 'User not found' });
                        }
                
                        return res.status(200).json(results[0]);
                    });
                });
                
                app.post('/submit', authenticateToken, (req, res) => {
                    const { firstName, report } = req.body;
                
                    // Validate that both firstName and report are provided
                    if (!firstName || !report) {
                        return res.status(400).json({ message: 'First Name and report are required.' });
                    }
                
                    // Check if the first name exists in the users table
                    const query = 'SELECT * FROM users WHERE firstName = ?';
                
                    db.query(query, [firstName], (err, results) => {
                        if (err) {
                            console.error('Error checking firstName:', err);
                            return res.status(500).json({ message: 'Error checking first name', error: err });
                        }
                
                        // If first name does not exist, return an error
                        if (results.length === 0) {
                            console.warn(`First name ${firstName} not found in users table.`);
                            return res.status(404).json({ message: 'First name not found' });
                        }
                
                        // If first name exists, insert the report into the user_details table
                        const insertQuery = 'INSERT INTO user_details (name, report) VALUES (?, ?)';
                        db.query(insertQuery, [firstName, report], (err, result) => {
                            if (err) {
                                console.error('Error inserting report:', err);
                                return res.status(500).json({ message: 'Failed to submit report', error: err });
                            }
                            console.log(`Report submitted successfully for ${firstName}.`);
                            return res.status(200).json({ message: 'Report submitted successfully' });
                        });
                    });
                }); // 2/25/2025



            // Get all reports route with name filtering
            app.get('/reports', (req, res) => {
                const { name } = req.query; // Filter reports by name

                const query = name ? 
                    'SELECT * FROM user_details WHERE name LIKE ?' : 
                    'SELECT * FROM user_details';

                db.query(query, name ? [`%${name}%`] : [], (err, results) => {
                    if (err) {
                        console.error('Error fetching reports:', err);
                        return res.status(500).json({ message: 'Failed to fetch reports', error: err });
                    }
                    return res.status(200).json(results); // Return the filtered reports
                });
            });

            // Approve a report
            app.put('/reports/:id/approve', (req, res) => {
                const reportId = req.params.id;
                const query = 'UPDATE user_details SET status = "approved" WHERE id = ?'; // Update report status to 'approved'

                db.query(query, [reportId], (err, result) => {
                    if (err) {
                        console.error('Error approving report:', err);
                        return res.status(500).json({ message: 'Failed to approve report', error: err });
                    }
                    return res.status(200).json({ message: 'Report approved' });
                });
            });

            // Reject a report
            app.put('/reports/:id/reject', (req, res) => {
                const reportId = req.params.id;
                const query = 'UPDATE user_details SET status = "rejected" WHERE id = ?'; // Update report status to 'rejected'

                db.query(query, [reportId], (err, result) => {
                    if (err) {
                        console.error('Error rejecting report:', err);
                        return res.status(500).json({ message: 'Failed to reject report', error: err });
                    }
                    return res.status(200).json({ message: 'Report rejected' });
                });
            });

            // Edit a rejected report
            app.put('/reports/:id/edit', (req, res) => {
                const reportId = req.params.id;
                const { report } = req.body;

                // Validate that report is provided
                if (!report) {
                    return res.status(400).json({ message: 'Report content is required.' });
                }

                const query = 'UPDATE user_details SET report = ? WHERE id = ? AND status = "rejected"';
                db.query(query, [report, reportId], (err, result) => {
                    if (err) {
                        console.error('Error updating report:', err);
                        return res.status(500).json({ message: 'Failed to update report', error: err });
                    }

                    // If no rows are affected, the report was not found or was not rejected
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: 'Rejected report not found or already approved' });
                    }

                    return res.status(200).json({ message: 'Report updated successfully' });
                });
            });

            // Get Reports of employee based on admin email
            app.get('/admin/reports', (req, res) => {
                const { email } = req.query; // Admin's email is passed as a query parameter

                // First, check if the user is an admin
                const query = 'SELECT * FROM users WHERE email = ?';

                db.query(query, [email], (err, results) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error checking admin role', error: err });
                    } else if (results.length === 0) {
                        return res.status(404).json({ message: 'Admin not found' });
                    } else {
                        const user = results[0];
                        if (user.role !== 'admin') {
                            return res.status(403).json({ message: 'Unauthorized access' });
                        }

                        // Now, fetch reports for employees under this admin
                        const employeeQuery = 'SELECT * FROM user_details WHERE employeeID IN (SELECT employeeID FROM users WHERE role = "employee" AND managerID = ?)';

                        db.query(employeeQuery, [user.id], (err, reports) => {
                            if (err) {
                                return res.status(500).json({ message: 'Error fetching reports', error: err });
                            }
                            return res.status(200).json(reports); // Return employee reports
                        });
                    }
                });
            });



            // 1/23/2025
            app.get('/users', (req, res) => {
                const query = 'SELECT * FROM users';
            
                db.query(query, (err, results) => {
                    if (err) {
                        return res.status(500).json({ message: 'Failed to fetch users', error: err });
                    }
            
                    // Decrypt the necessary fields before sending back the data
                    const decryptedUsers = results.map(user => ({
                        ...user,
                        firstName: decrypt(user.firstName),
                        lastName: decrypt(user.lastName),
                        department: decrypt(user.department),
                        email: decrypt(user.email) // Decrypt email too
                    }));
            
                    return res.status(200).json(decryptedUsers);
                });
            });
        
        // Add a new admin and log the addition in user_admin
        app.post('/users/admin', async (req, res) => {
            const { email, password, employeeID, firstName, lastName, department, role, failed_attempts, lock_until } = req.body;
        
            // Validate that employeeID is a valid number
            if (!/^\d+$/.test(employeeID)) {
                return res.status(400).json({ message: 'Employee ID must be a valid number.' });
            }
        
            // Password validation: at least 5 characters, 3 numbers, 2 letters
            const passwordPattern = /^(?=.*[0-9].*[0-9].*[0-9])(?=.*[A-Za-z].*[A-Za-z]).{5,}$/;
            if (!passwordPattern.test(password)) {
                return res.status(400).json({
                    message: 'Password must be at least 5 characters long and contain at least 3 numbers and 2 letters.'
                });
            }
        
            try {
                // Generate a hashed password (with automatic salt generation)
                const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
        
                // Encrypt other sensitive fields
                const encryptedFirstName = encrypt(firstName);
                const encryptedLastName = encrypt(lastName);
                const encryptedDepartment = encrypt(department);
                const encryptedEmail = encrypt(email); // Encrypt email too
        
                const query = `
                    INSERT INTO user_admin (email, password, employeeID, firstName, lastName, department, role, failed_attempts, lock_until)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
        
                db.query(query, [encryptedEmail, hashedPassword, employeeID, encryptedFirstName, encryptedLastName, encryptedDepartment, role, failed_attempts, lock_until], (err, result) => {
                    if (err) {
                        console.error('Error adding admin:', err);
                        return res.status(500).json({ message: 'Error adding admin', error: err.message });
                    }
        
                     // Log the admin creation action
                     logAdminAction(email, 'Create Admin', `Admin ${email} created`);
        
                    res.status(201).json({ message: 'Admin added successfully', id: result.insertId });
                });
            } catch (error) {
                console.error('Error hashing password:', error);
                return res.status(500).json({ message: 'Error processing the request', error: error.message });
            }
        });
        

// 2/4/2025
app.get('/user-role-stats', (req, res) => {
    const query = `
        SELECT role, COUNT(*) as count 
        FROM users 
        WHERE role IN ('employee', 'moderator') 
        GROUP BY role;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching user role stats:', err);
            return res.status(500).json({ message: 'Error fetching user stats', error: err });
        }
        res.status(200).json(results);
    });
});



// Update admin route  
            // Start the server
            const port = 5000;
            app.listen(port, () => {
                console.log("Server running on port 5000");
            });