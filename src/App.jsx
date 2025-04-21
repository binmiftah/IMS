import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SignUp from './page/Admin/Registration/SignUp.jsx'
import Login from './page/Admin/login/Login.jsx'
import Organisation from './page/Admin/organization-form/OrganisationForm.jsx'
import Invite from './page/Admin/invite/Invite.jsx'
import Dashboard from './page/Admin/Dashboard/Dashboard.jsx'
import Users from './page/Admin/UserManagement/Users.jsx'
import Files from './page/Admin/File/Files.jsx'


import NotFound from './components/NotFound'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/organisation" element={<Organisation />} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/files" element={<Files />} />

        <Route path="/" element={<Dashboard />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App