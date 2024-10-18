import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../../assets/images/logo.png'; // Adjust the path as needed

const Logo = ({ className, linkTo = "/" }) => {
  return (
    <Link to={linkTo}>
      <img src={logoImage} alt="NOSCO Logo" className={`${className} cursor-pointer`} />
    </Link>
  );
};

export default Logo;