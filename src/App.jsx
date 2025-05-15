import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';

import SignUp from './page/Admin/Registration/SignUp.jsx'
import Login from './page/Admin/login/Login.jsx'
import Organisation from './page/Admin/organization-form/OrganisationForm.jsx'
import Invite from './page/Admin/invite/Invite.jsx'
import Dashboard from './page/Admin/Dashboard/Dashboard.jsx'
import Users from './page/Admin/UserManagement/Users.jsx'
import UserPermissions from './page/Admin/UserManagement/UserPermissions.jsx'
import Files from './page/Admin/File/Files.jsx'
import Trash from './page/Admin/Trash/Trash.jsx'
import Settings from './page/Admin/Settings/Settings.jsx'

import UserDashboard from './page/User/UserDashboard/UserDashboard.jsx'
import UserFiles from './page/User/UserFiles/UserFiles.jsx'


import NotFound from './component/NotFound'
import UserLogin from "./page/User/login/Login.jsx";

const App = () => {
  return (
    <AuthProvider>
      <RoleProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/organisation" element={<Organisation />} />
            <Route path="/invite" element={<Invite />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:userId/permissions" element={<UserPermissions />} />
            <Route path="/files" element={<Files />} />
            <Route path="/trash" element={<Trash />} />
            <Route path="/settings" element={<Settings />} />

            {/* User Routes */}
            <Route path='/user/login' element={<UserLogin />} />
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/files" element={<UserFiles />} />

            {/* Redirect to login if no path is matched */}
            <Route path="/" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </RoleProvider>
    </AuthProvider>
  )
}

export default App