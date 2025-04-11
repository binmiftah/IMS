import React from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import SignUp from './components/SignUp'
import Login from './components/Login'
import Organisation from './components/OrganisationForm'

const App = () => {
  return (
   <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/organisation" element={<Organisation />} />
         <Route path="/" element={<Login />} />
      </Routes>
   </Router>
  )
}

export default App