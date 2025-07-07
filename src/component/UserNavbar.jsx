import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdFolder, MdSettings, MdLogout } from 'react-icons/md';
import { useEffect } from 'react';
import LogoUpload from './LogoUpload';

const UserNavbar = () => {
    const navigate = useNavigate();

    const navItems = [
        {
            name: 'Folders/Files',
            icon: <MdFolder size={24} />,
            path: '/user/files'
        },
    ];

    const [loggedInUser, setLoggedInUser] = React.useState(null);


    useEffect(() => {
        const data = localStorage.getItem('user')
        if (data) {
            const user = JSON.parse(data);
            setLoggedInUser(user);
        } else {
            toast.error("Please login to access this page", {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            })
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                navigate("/login")
            }, 2000);
            setLoggedInUser(null);
        }

    }, []);


    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="w-1/5 bg-black text-white flex flex-col justify-between">
            <div className="flex flex-col h-full">
                <div className="p-4 text-center border-b border-gray-800">
                    <LogoUpload isAdmin={false} />
                </div>

                <div className="flex-1">
                    <ul className="space-y-2">
                        {navItems.map((item, index) => (
                            <li key={index}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center mx-4 px-4 py-3 rounded-lg transition-colors ${isActive
                                            ? 'bg-white text-black'
                                            : 'text-white hover:bg-gray-800'
                                        }`
                                    }
                                >
                                    {item.icon}
                                    <span className="ml-3">{item.name}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>


            </div>
            <div className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                    <img
                        src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Profile"
                        className="w-10 bg- h-10 rounded-full object-cover"
                    />
                    <div>
                        {loggedInUser && <p className="font-medium">{loggedInUser.fullName}</p>}
                        {loggedInUser && <p className="text-sm text-gray-400">{loggedInUser.email}</p>}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center justify-center mb-3">
                        <img
                            src="https://gemzsoftware.com/wp-content/uploads/2023/03/gemz-logo-transparent.png"
                            alt="Company Logo"
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                                // Fallback if logo fails to load
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-400">
                            © {new Date().getFullYear()} Gemz Software Innovative
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            All rights reserved
                        </p>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default UserNavbar;