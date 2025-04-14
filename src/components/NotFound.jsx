import React from 'react'
import { Link } from 'react-router-dom'
import { MdError } from 'react-icons/md'

const NotFound = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='text-center'>
        <MdError className='text-9xl text-red-500 mx-auto mb-16' />
        <h1 className='text-4xl font-bold text-gray-800'>404</h1>
        <p className='mt-2 text-lg text-gray-600'>Page Not Found</p>
        <Link to="/dashboard" className='mt-4 inline-block px-4 py-2 bg-black text-white rounded-lg'>
          Go Back Dashboard
        </Link>
      </div>
    </div>
  )
}

export default NotFound