import React, {useState, useEffect} from 'react'
import { MdNotifications, MdLogout } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import Button from './Button'


const ProfileBar = ({ onSearch }) => {
    const navigate = useNavigate()
    const [loggedInUser, setLoggedInUser] = useState(null);

    useEffect(() => {
        // Load user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setLoggedInUser(user);
        }
    }, []);

    const handleLogout = () => {
        localStorage.clear()
        navigate('/login')
    }

    return (
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
            {/* User Name Section */}
            <div className="flex items-center">
                <div className="flex items-center space-x-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            {loggedInUser?.fullName || 'User'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {loggedInUser?.email || 'user@example.com'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
                <Button
                    variant="secondary"
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                    <MdLogout size={20} />
                    <span>Logout</span>
                </Button>
            </div>
        </div>
    )
}

export default ProfileBar