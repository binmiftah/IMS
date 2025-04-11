import React, { useState } from 'react';
import OrgImage from '../assets/images/Org.png'; // Importing the organisation image
import { Link } from 'react-router-dom'; // Importing Link for navigation

const OrganisationForm = () => {
   const [formData, setFormData] = useState({
      organisationName: '',
      organisationEmail: '',
      organisationPhone: '',
      logo: null,
      industry: '',
      location: '',
      country: '',
      state: '',
      city: '',
   });

   const handleChange = (e) => {
      const { name, value, files } = e.target;
      setFormData({
         ...formData,
         [name]: files ? files[0] : value, // Handle file input for logo
      });
   };

   const handleSubmit = (e) => {
      e.preventDefault();
      console.log('Form Data:', formData);
      // Add your form submission logic here
      // For example, send formData to your backend API
      setFormData({
         organisationName: '',
         organisationEmail: '',
         organisationPhone: '',
         logo: null,
         industry: '',
         location: '',
         country: '',
         state: '',
         city: '',
      });
   };

   return (
      <div className="flex min-h-screen">
         <div
            className="w-3/5 bg-cover bg-center"
            style={{
               backgroundImage: `url('${OrgImage}')`, 
            }}
         ></div>

         <div className="w-2/5 bg-white p-8 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-center mb-6">Organisation Form</h2>
            <p className='text-center text-black'>Set up your organisation's profile and core settings.</p>
            <form className="space-y-4" onSubmit={handleSubmit}>
               {/* Organisation Name */}
               <div>
                  <input
                     type="text"
                     id="organisationName"
                     name="organisationName"
                     placeholder="Organisation Name"
                     value={formData.organisationName}
                     onChange={handleChange}
                     required
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>

               {/* Organisation Email */}
               <div>
                  <input
                     type="email"
                     id="organisationEmail"
                     name="organisationEmail"
                     placeholder="Organisation Email"
                     value={formData.organisationEmail}
                     onChange={handleChange}
                     required
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>

               {/* Organisation Phone */}
               <div>
                  <input
                     type="tel"
                     id="organisationPhone"
                     name="organisationPhone"
                     placeholder="Organisation Phone"
                     value={formData.organisationPhone}
                     onChange={handleChange}
                     required
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>

               {/* Logo */}
               <div>
                  <input
                     type="file"
                     id="logo"
                     name="logo"
                     onChange={handleChange}
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload your organisation's logo</p>
               </div>

               {/* Industry */}
               <div>
                  <input
                     type="text"
                     id="industry"
                     name="industry"
                     placeholder="Industry"
                     value={formData.industry}
                     onChange={handleChange}
                     required
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>

               {/* Location */}
               <div>
                  <input
                     type="text"
                     id="location"
                     name="location"
                     placeholder="Location"
                     value={formData.location}
                     onChange={handleChange}
                     required
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>

               {/* Country */}
               <div>
                  <input
                     type="text"
                     id="country"
                     name="country"
                     placeholder="Country"
                     value={formData.country}
                     onChange={handleChange}
                     required
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>

               {/* State */}
               <div>
                  <input
                     type="text"
                     id="state"
                     name="state"
                     placeholder="State"
                     value={formData.state}
                     onChange={handleChange}
                     required
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>

               {/* City */}
               <div>
                  <input
                     type="text"
                     id="city"
                     name="city"
                     placeholder="City"
                     value={formData.city}
                     onChange={handleChange}
                     required
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>

               {/* Submit Button */}
               <button
                  type="submit"
                  className="w-full px-4 py-2 text-white bg-black rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-black"
               >
                  Submit
               </button>
            </form>
            <Link to={'/'} className="text-center text-black hover:underline mt-4">
               <p>Skip</p>
            </Link>
         </div>
      </div>
   );
};

export default OrganisationForm;