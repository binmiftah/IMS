import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SignUp from './page/Admin/Registration/SignUp.jsx'
import Login from './page/Admin/login/Login.jsx'
import Organisation from './components/OrganisationForm'
import Invite from './components/Invite'
import Dashboard from './page/Admin/Dashboard/Dashboard.jsx'
import Users from './page/Admin/UserManagement/Users.jsx'


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

        {/* Redirect to login if no path is matched */}
        <Route path="/" element={<Dashboard />} />

        {/* 404 Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App