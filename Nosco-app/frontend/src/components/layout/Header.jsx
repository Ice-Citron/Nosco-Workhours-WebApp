import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

const Header = () => {
  return (
    <header className="bg-white py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Logo />
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link to="/" className="text-nosco-red hover:text-nosco-red-dark">Home</Link>
            </li>
            <li>
              <Link to="/contact-support" className="text-nosco-red hover:text-nosco-red-dark">Contact Support</Link>
            </li>
            {/* Add more navigation items as needed */}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;