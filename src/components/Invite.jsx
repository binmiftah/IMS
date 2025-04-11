import React, { useState } from 'react'

const Invite = () => {
   const [email, setEmail] = useState(''); // State for email input
   const [role, setRole] = useState(''); // State for role selector
   const [error, setError] = useState(''); // State for error message

   const handleSubmit = (e) => {
      e.preventDefault(); // Prevent default form submission behavior

      // Validate inputs
      if (!email || !role) {
         error('Please fill in all fields'); // Set error message if fields are empty
         return;
      }

      // Handle invite logic here, e.g., send email and role to the server
      console.log('Email:', email);
      console.log('Role:', role);

      // Clear inputs after submission
      setEmail('');
      setRole('');
      setError(''); 
   }
   return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">Invite Members</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
         <div className="flex items-center justify-center mb-4 font-medium">
            <p className='flex-1'>Email Address</p>
            <p>Select Role</p>
         </div>
          <div className="flex items-center">
            {/* Email Input */}
            <input
              type="email"
              placeholder="e.g. gemz.technologies@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-2 border-r-2 border-gray-400  focus:outline-none bg-gray-100 rounded-l-lg"
            />

            {/* Role Selector */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="px-4 py-2 border-none focus:outline-none bg-gray-100 rounded-r-lg" 
            >
              <option value="User">User</option>
              <option value="Superior User">Superior User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center">
            {/* Email Input */}
            <input
              type="email"
              placeholder="e.g. gemz.technologies@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-2 border-r-2 border-gray-400  focus:outline-none bg-gray-100 rounded-l-lg"
            />

            {/* Role Selector */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="px-4 py-2 border-none focus:outline-none bg-gray-100 rounded-r-lg" 
            >
              <option value="User">User</option>
              <option value="Superior User">Superior User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          
          <div className="flex items-center">
            {/* Email Input */}
            <input
              type="email"
              placeholder="e.g. gemz.technologies@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-2 border-r-2 border-gray-400  focus:outline-none bg-gray-100 rounded-l-lg"
            />

            {/* Role Selector */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="px-4 py-2 border-none focus:outline-none bg-gray-100 rounded-r-lg" 
            >
              <option value="User">User</option>
              <option value="Superior User">Superior User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>



          {/* Submit Button */}
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-black rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-black"
          >
            Send Invite
          </button>
        </form>
      </div>
    </div>
  )
}

export default Invite