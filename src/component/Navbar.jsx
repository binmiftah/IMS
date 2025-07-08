import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdPeople, MdGroupWork, MdDelete, MdSettings, MdLogout, MdSecurity } from 'react-icons/md';
import { toast } from "react-toastify";
import LogoUpload from './LogoUpload';

const Navbar = () => {
    const navigate = useNavigate();
    const isActive = ({ isActive }) => `flex items-center ${isActive ? 'text-white' : 'text-gray-txt'}`;

    const [loggedInUser, setLoggedInUser] = React.useState(null);

    useEffect(() => {
        const data = localStorage.getItem('user');
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
            });
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                navigate("/login");
            }, 2000);
            setLoggedInUser(null);
        }
    }, []);

    function handleLogout() {
        localStorage.clear();
        navigate('/login');
    }

    return (
        <div className="w-1/5 bg-black text-white flex flex-col justify-between">
            <div>
                <div className="p-4 text-center border-b border-gray-800">
                    <LogoUpload isAdmin={true} />
                </div>

                <ul className="mt-8 space-y-4">
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink
                            to="/dashboard"
                            className={isActive}
                        >
                            <MdDashboard className="mr-3" size={24} />
                            <span>Dashboard</span>
                        </NavLink>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink
                            to="/users"
                            className={isActive}
                        >
                            <MdPeople className="mr-3" size={24} />
                            <span>User</span>
                        </NavLink>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink
                            to="/files"
                            className={isActive}
                        >
                            <MdGroupWork className="mr-3" size={24} />
                            <span>Files</span>
                        </NavLink>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink
                            to="/trash"
                            className={isActive}
                        >
                            <MdDelete className="mr-3" size={24} />
                            <span>Trash</span>
                        </NavLink>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink
                            to="/settings"
                            className={isActive}
                        >
                            <MdSettings className="mr-3" size={24} />
                            <span>Settings</span>
                        </NavLink>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink
                            to="/members/permissions"
                            className={isActive}
                        >
                            <MdSecurity className="mr-3" size={24} />
                            <span>Member Permissions</span>
                        </NavLink>
                    </li>
                </ul>
            </div>

            <div className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                    <img
                        src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
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
        </div>
    );
};

export default Navbar;