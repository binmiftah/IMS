import axios from 'axios';


class ApiExternal {




  async fetchCountry(){
    try{
      const response = await  axios.get('https://restcountries.com/v3.1/all')
      const countryList = response.data.map((country) => ({
        name: country.name.common,
        code: country.cca2,
      }));
      countryList.sort((a, b) => a.name.localeCompare(b.name))
      return countryList;
    }catch(err){
      console.error("Error fetching countries:", err);
      throw err;
    }

  }


  async fetchStates(country) {
    try {
      const response = await axios.post(`https://countriesnow.space/api/v0.1/countries/states`, {
        country: country,
      });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching states:", error);
      throw error;
    }
  }



}


const externalApi = new ApiExternal();

export default externalApi;