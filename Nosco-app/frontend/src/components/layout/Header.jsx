import React from 'react';
import Logo from '../common/Logo';

const Header = () => {
  return (
    <header className="bg-white py-4 shadow-md">
      <div className="container mx-auto flex justify-center">
        <Logo />
      </div>
    </header>
  );
};

export default Header;