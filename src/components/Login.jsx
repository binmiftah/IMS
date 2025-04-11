import React from 'react'
import { useState } from 'react'
import lawImage from '../assets/images/law.png'
import { FaEnvelope, FaLock, } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'


const Login = () => {
   const [email, setEmail] = useState('') // State for email input 
   const [password, setPassword] = useState('') // State for password input
   const [error, setError] = useState('') // State for error message
   const navigate = useNavigate() // Hook for navigation
   const handleSubmit = (e) => {
      e.preventDefault() // Prevent default form submission behavior

      // Validate inputs
      if (!email || !password) {
         setError('Please fill in all fields'); // Set error message if fields are empty
         return;
      }

      //Clear error message if inputs are valid
      setError('');

      // Handle login logic here, e.g., send email and password to the server
      console.log('Email:', email)
      console.log('Password:', password)

      navigate('/organisation') // Navigate to the organisation form after successful login
   }

   return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
         <div className='grid grid-cols-1 md:grid-cols-2 w-full max-w-4xl p-4'>
            <div
               className="hidden md:block rounded-l-lg bg-cover bg-center h-full"
               style={{ backgroundImage: `url(${lawImage})` }}
            >
            </div>
            <div className="w-full  rounded-r-lg p-8 space-y-6 bg-white  shadow-md">
               <h2 className="text-2xl font-bold text-center text-gray-800">Welcome Back</h2>

               {error && <p className="text-red-500 text-center">{error}</p>}

               <form className="space-y-4 flex items-center flex-col" onSubmit={handleSubmit}>
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
                  <button
                     type="submit"
                     className="w-full px-4 py-2 text-white bg-black rounded-md  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                     Login
                  </button>
                  <p>Or</p>
                  <button className="px-4 py-2 border flex gap-2 border-black dark:border-black rounded-lg text-black dark:text-black hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:shadow transition duration-150">
                     <img className="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo" />
                     <span>Login with Google</span>
                  </button>
               </form>
               <p className="text-sm text-center text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-blue-500 hover:underline">
                     Sign up
                  </Link>
               </p>
            </div>
         </div>
      </div>
   )
}

export default Login