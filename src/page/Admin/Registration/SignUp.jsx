import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaUser, FaPhone } from 'react-icons/fa';
import signup from '/assets/images/signup.png?url';
import { Link, useNavigate } from 'react-router-dom';
import apiCall  from "../../../pkg/api/internal.js";
import {handleError} from "../../../pkg/error/error.js";
import {toast, ToastContainer} from "react-toastify";

const SignUp = () => {
   const [fullName, setFullName] = useState('');
   const [email, setEmail] = useState('');
   const [phoneNumber, setPhoneNumber] = useState('');
   const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [error, setError] = useState('');
   const navigate = useNavigate();

   const handleSubmit = async (e) => {
      e.preventDefault();

      // Validate inputs
      if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
         setError('Please fill in all fields'); // Set error message if fields are empty
         return;
      }

      // Validate phone number (basic example)
      const phoneRegex = /^[0-9]{11}$/; // Example: 10-digit phone number
      if (!phoneRegex.test(phoneNumber)) {
         setError('Please enter a valid phone number');
         return;
      }

      // Validate password and confirm password match
      if (password !== confirmPassword) {
         setError('Passwords do not match'); // Set error message if passwords don't match
         return;
      }

      // Clear error if inputs are valid
      setError('');

      // Handle sign-up logic here
      const data = {
            fullName: fullName,
            email: email,
            phoneNumber: phoneNumber,
            password: password,
      }

      try{
         const response =  await apiCall.register('auth/register', data);
         if (response){
            localStorage.setItem("token", response.data.token) // Store token in local storage
            localStorage.setItem("user", JSON.stringify(response.data.user)) // Store user data in local storage
            toast.success(response.message, {
               position: "top-right",
               autoClose: 2000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: true,
               progress: undefined,
            })
            // Navigate to user login
            setTimeout(()=>{
               navigate('/dashboard')
            }, 2500)
         }

      }catch(error){
         if (!error.response){
            error["response"] = {
               data: "Network Error",
            }
            setError("Network Error")
         }
         if (error.response.status === 404) {
            setError("Error Creating User")
            return;
         }
         handleError(error, setError);

      }
   };

   return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
         <ToastContainer/>
         <div className='grid grid-cols-1 md:grid-cols-2 w-full max-w-4xl p-4'>
            <div
               className="hidden md:block rounded-l-lg bg-cover bg-center h-full"
               style={{ backgroundImage: `url(${signup})` }}
            ></div>
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-r-lg shadow-md">
               <h2 className="text-2xl font-bold text-center text-gray-800">Join Us</h2>

               {/* Error Message */}
               {error && (
                  <div className="text-red-500 text-center bg-red-100 p-2 rounded-md">
                     {error}
                  </div>
               )}

               <form className="space-y-4 flex items-center flex-col" onSubmit={handleSubmit}>
                  {/* Username Input */}
                  <div className="w-full relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FaUser className="w-5 h-5 text-gray-400" />
                     </span>
                     <input
                        type="text"
                        id="fullName"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        // required
                        className="w-full px-10 py-2 mt-1 text-gray-700 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black-500"
                     />
                  </div>

                  {/* Email Input */}
                  <div className="w-full relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FaEnvelope className="w-5 h-5 text-gray-400" />
                     </span>
                     <input
                        type="email"
                        id="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        // required
                        className="w-full px-10 py-2 mt-1 text-gray-700 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black-500"
                     />
                  </div>

                  {/* Phone Number Input */}

                  <div className="w-full relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FaPhone className="w-5 h-5 text-gray-400" />
                     </span>
                     <input
                        type="tel"
                        id="phoneNumber"
                        placeholder="Phone Number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onKeyPress={(e) => {
                           // Allow only numbers
                           if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                           }
                        }}
                        // required
                        className="w-full px-10 py-2 mt-1 text-gray-700 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black-500"
                     />
                  </div>

                  {/* Password Input */}
                  <div className="w-full relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FaLock className="w-5 h-5 text-gray-400" />
                     </span>
                     <input
                        type="password"
                        id="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        // required
                        className="w-full px-10 py-2 mt-1 text-gray-700 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                  </div>

                  {/* Confirm Password Input */}

                  <div className="w-full relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FaLock className="w-5 h-5 text-gray-400" />
                     </span>
                     <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        // required
                        className="w-full px-10 py-2 mt-1 text-gray-700 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                  </div>

                  <button
                     type="submit"
                     className="w-full px-4 py-2 text-white bg-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                     Sign Up
                  </button>
                  <p>Or</p>
                  <button className="px-4 py-2 border flex gap-2 border-black dark:border-black rounded-lg text-black dark:text-black hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:shadow transition duration-150">
                     <img className="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo" />
                     <span>Sign Up with Google</span>
                  </button>
               </form>
               <p className="text-sm text-center text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-500 hover:underline">
                     Login
                  </Link>
               </p>
            </div>
         </div>
      </div>
   );
};

export default SignUp;