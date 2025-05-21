import { toast } from "react-toastify";

const handleError = (error, setError) => {
    let message = "An unknown error occurred";

    // Check if error is an Axios error with a response
    if (error.response?.data?.message) {
        message = error.response.data.message;
    } 
    // Check if error has a message (e.g., network error)
    else if (error.message) {
        message = error.message;
    }

    // Show error message using toast
    toast.error(message, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    });

    // Optionally set the error state
    if (setError) setError(message);
};

export { handleError };