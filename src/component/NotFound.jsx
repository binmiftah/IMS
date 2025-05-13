import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdError } from 'react-icons/md';
import { toast } from 'react-toastify';

const NotFound = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (data) {
      const user = JSON.parse(data);
      setLoggedInUser(user);
    } else {
      toast.error("Please login to access this page", {
        position: "top-right",
        autoClose: 2000,
      });
      setTimeout(() => navigate("/login"), 2000);
    }
  }, []);

  return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <div className='text-center'>
          <MdError className='text-9xl text-red-500 mx-auto mb-16' />
          <h1 className='text-4xl font-bold text-gray-800'>404</h1>
          <p className='mt-2 text-lg text-gray-600'>Page Not Found</p>

          {loggedInUser?.role === "ADMIN" && (
              <Link to="/dashboard" className='mt-4 inline-block px-4 py-2 bg-black text-white rounded-lg'>
                Go Back Dashboard
              </Link>
          )}
          {loggedInUser?.role === "MEMBER" && (
              <Link to="/user/dashboard" className='mt-4 inline-block px-4 py-2 bg-black text-white rounded-lg'>
                Go Back Dashboard
              </Link>
          )}
        </div>
      </div>
  );
};

export default NotFound;
