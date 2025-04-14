import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OrgImage from '../../public/assets/images/Org.png';
import { Link, useNavigate } from 'react-router-dom';

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

   const [countries, setCountries] = useState([]);
   const [states, setStates] = useState([]);
   const [cities, setCities] = useState([]);

   const navigate = useNavigate();

   // Fetch countries on component mount
   useEffect(() => {
      axios.get('https://restcountries.com/v3.1/all')
         .then((response) => {
            const countryList = response.data.map((country) => ({
               name: country.name.common,
               code: country.cca2,
            }));
            countryList.sort((a, b) => a.name.localeCompare(b.name)); // Sort countries alphabetically
            setCountries(countryList);
         })
         .catch((error) => console.error('Error fetching countries:', error));
   }, []);

   // Fetch states when a country is selected
   useEffect(() => {
      if (formData.country) {
         axios.post(`https://countriesnow.space/api/v0.1/countries/states?country=${formData.country}`, {
            country: formData.country, // Pass the full country name
            
         })
         .then((response) => {
            for (let i = 0; i < response.data.data.length; i++) {
               if (response.data.data[i].iso2 === formData.country) {
                  setStates(response.data.data[i].states.sort((a, b) => a.name.localeCompare(b.name)));
               }
            }
         })
         .catch((error) => console.error('Error fetching states:', error));
      }
   }, [formData.country]);

   // Fetch cities when a state is selected
   useEffect(() => {
      if (formData.state) {
         axios.post(`https://countriesnow.space/api/v0.1/countries/cities}`)
            .then((response) => {
               console.log(response.data);
               
               setCities(response.data)

            })
            .catch((error) => console.error('Error fetching cities:', error));
      }console.log('State:', formData.state);
   }, [formData.state]);

   const handleChange = (e) => {
      const { name, value, files } = e.target;
      setFormData({
         ...formData,
         [name]: files ? files[0] : value,
      });
   };

   const handleSubmit = (e) => {
      e.preventDefault();
      console.log('Form Data:', formData);
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
      navigate('/invite');
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
            <p className="text-center text-black">Set up your organisation's profile and core settings.</p>
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
                     onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, ''); // Allow only numbers
                        setFormData({ ...formData, organisationPhone: value });
                     }}
                     required
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>

               {/* Logo Upload */}
               <div>
                  <input
                     type="file"
                     id="logo"
                     name="logo"
                     onChange={handleChange}
                     accept="image/*"
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  <select
                     id="country"
                     name="country"
                     value={formData.country}
                     onChange={handleChange}
                     required
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                     <option value="">Select Country</option>
                     {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                           {country.name}
                        </option>
                     ))}
                  </select>
               </div>

               {/* State */}
               <div>
                  <select
                     id="state"
                     name="state"
                     value={formData.state}
                     onChange={handleChange}
                     required
                     className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                     <option value="">Select State</option>
                     {states.map((state) => (
                        <option key={state.code} value={state.code}>
                           {state.name}
                        </option>
                     ))}
                  </select>
               </div>

               {/* Submit Button */}
               <button
                  type="submit"
                  className="w-full px-4 py-2 text-white bg-black rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-black"
               >
                  Submit
               </button>
            </form>
            <Link to={'/dashboard'} className="text-center text-black hover:underline mt-4">
               <p>Skip</p>
            </Link>
         </div>
      </div>
   );
};

export default OrganisationForm;