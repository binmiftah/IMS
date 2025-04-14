import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold text-gray-800'>404</h1>
        <p className='mt-2 text-lg text-gray-600'>Page Not Found</p>
        <Link to="/dashboard" className='mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>
          Go Back Dashboard
        </Link>
      </div>
    </div>
  )
}

export default NotFound