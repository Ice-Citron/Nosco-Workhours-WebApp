import React from 'react';
import { Link } from 'react-router-dom';

const AuthenticatedFooter = () => {
  return (
    <footer className="bg-nosco-red text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <p>© 2024 Nosco. All rights reserved.</p>
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/worker/dashboard" className="hover:underline">Dashboard</Link></li>
            <li><Link to="/contact-support" className="hover:underline">Contact Support</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default AuthenticatedFooter;