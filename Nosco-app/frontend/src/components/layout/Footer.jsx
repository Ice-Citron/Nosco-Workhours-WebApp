import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-nosco-red text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-base">&copy; 2025 Nosco. All rights reserved.</p>
          </div>
          <nav>
            <ul className="flex space-x-8">
              <li>
                <Link to="/" className="text-lg font-medium text-white hover:underline transition duration-150 ease-in-out">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/contact-support" className="text-lg font-medium text-white hover:underline transition duration-150 ease-in-out">
                  Contact Support
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;