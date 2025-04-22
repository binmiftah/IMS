import { toast } from "react-toastify"
import { AxiosError } from "axios"



const handleAxiosError = (error, setError) => {
    if (error instanceof AxiosError) {
        toast.error(error.response.data.message, {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        })

        if (setError) setError(error.response.data.message)
    } else {
        toast.error(error.message, {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        })
        if (setError) setError(error.message)
    }

}


export {
    handleAxiosError
}