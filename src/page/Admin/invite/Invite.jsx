import React, { useState } from 'react';
import invite from '/assets/images/invite.png'; // Importing the invite image

const Invite = () => {
  const [members, setMembers] = useState([{ email: '', role: '' }]); // State for multiple members
  const [error, setError] = useState(''); // State for error message

  const handleInputChange = (index, field, value) => {
    const updatedMembers = [...members];
    updatedMembers[index][field] = value; // Update specific member's field
    setMembers(updatedMembers);
  };

  const handleAddMember = () => {
    setMembers([...members, { email: '', role: '' }]); // Add a new member
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Validate inputs
    for (const member of members) {
      if (!member.email || !member.role) {
        setError('Please fill in all fields for all members');
        return;
      }
    }

    // Handle invite logic here, e.g., send members to the server
    console.log('Inviting Members:', members);

    // Clear inputs after submission
    setMembers([{ email: '', role: '' }]);
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className='grid grid-cols-1 md:grid-cols-2 w-full max-w-6xl p-4'>
        <div className="w-full max-w-screen p-8 space-y-6 bg-white rounded-l-lg">
          <h2 className="text-2xl font-bold text-center mb-4">Invite Other Admins to Organization</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center mb-4 font-medium">
              <p className="flex-1">Email Address</p>
            </div>

            {members.map((member, index) => (
              <div key={index} className="flex items-center mb-2">
                {/* Email Input */}
                <input
                  type="email"
                  placeholder="e.g. gemz.technologies@gmail.com"
                  value={member.email}
                  onChange={(e) => handleInputChange(index, 'email', e.target.value)}
                  required
                  className="flex-1 px-4 py-2 border-gray-400 focus:outline-none bg-gray-100 rounded-l-lg"
                />
              </div>
            ))}

            {/* Add More Members */}
            <button
              type="button"
              className="w-full text-blue-300 hover:text-blue-700 focus:outline-none text-right"
              onClick={handleAddMember}
            >
                + Add More Admins
            </button>

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-black rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-black"
            >
              Send Invite
            </button>
          </form>
        </div>

        {/* Image Section */}
        <div
          className="hidden md:block rounded-r-lg bg-cover bg-center h-full"
          style={{ backgroundImage: `url(${invite})` }}
        >
        </div>
      </div>
    </div>
  );
};

export default Invite;