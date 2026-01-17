import React from 'react';

import {
  BrowserRouter as Router,
  Route,
  Routes,
} from 'react-router-dom';

import AdminAccount from './Components/AdminAccount';
import AdminLogIn from './Components/AdminLogIn'; // Import AdminLogIn component
import LoginRegister from './Components/LoginRegister';
import ModsAccount from './Components/ModsAccount';
import UserAccount from './Components/UserAccount';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          {/* Login and Registration Page */}
          <Route path="/" element={<LoginRegister />} />

          {/* User Account Page */}
          <Route path="/useraccount" element={<UserAccount />} />

          {/* Mods Account Page */}
          <Route path="/modsaccount" element={<ModsAccount />} />

          {/* Admin Account Page */}
          <Route path="/adminaccount" element={<AdminAccount />} />

          {/* Admin Login Page */}
          <Route path="/adminlogin" element={<AdminLogIn />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;