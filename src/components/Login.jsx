import React from 'react'
import lawImage from '../assets/images/law.png'

const Login = () => {
   return (
      // <div className="loginModal__container flex item-center justify-center bg-gray-200 h-screen w-screen">
      //    <div className="loginModal flex  ">
      //       <div className="loginModal_image_container">
      //       </div>
      //       <div className="loginModal__content">
      //          <h2>Wlecome Back</h2>
      //          <form className="loginModal__form">
      //             <input type="email" required />
      //             <input type="password" placeholder="Password" required />
      //             <button type="submit">Login</button>
      //             
      //          </form>
      //       </div>
      //    </div>
      // </div>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
         <div className='grid grid-cols-1 md:grid-cols-2 w-full max-w-4xl p-4'>
            <div
               className="hidden md:block rounded-l-lg bg-cover bg-center h-full"
               style={{ backgroundImage: `url(${lawImage})` }}

            >
            </div>
            <div className="w-full  rounded-r-lg p-8 space-y-6 bg-white  shadow-md">
               <h2 className="text-2xl font-bold text-center text-gray-800">Login</h2>
               <form className="space-y-4 flex items-center flex-col">
                  <div className='w-full'>
                     {/* <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                     </label>  */}
                     <input
                        type="email"
                        id="email"
                        placeholder="Email"
                        // value={email}
                        required
                        className="w-full px-4 py-2 mt-1 text-gray-700 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black-500"
                     />
                  </div>
                  <div className='w-full'>
                     {/* <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                     </label> */}
                     <input
                        type="password"
                        id="password"
                        placeholder="Password"
                        // value={password}
                        required
                        className="w-full px-4 py-2 mt-1 text-gray-700 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                  </div>
                  <button
                     type="submit"
                     className="w-full px-4 py-2 text-white bg-black rounded-md  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                     Login
                  </button>
                  <p>Or</p>
                  {/* <button
                     className="w-full flex items-center px-4 py-2 text-white bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                     Google
                  </button> */}
                  <button className="px-4 py-2 border flex gap-2 border-black dark:border-black rounded-lg text-black dark:text-black hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:shadow transition duration-150">
                     <img className="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo" />
                     <span>Login with Google</span>
                  </button>
               </form>
               <p className="text-sm text-center text-gray-600">
                  Don't have an account?{' '}
                  <a href="/signup" className="text-blue-500 hover:underline">
                     Sign up
                  </a>
               </p>
            </div>
         </div>
      </div>
   )
}

export default Login