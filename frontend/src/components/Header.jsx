import React from 'react';

const Header = () => {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold">[NAME]</h1>
        <nav className="space-x-6">
          <a href="#" className="hover:text-gray-200">
            Home
          </a>
          <a href="#" className="hover:text-gray-200">
            About
          </a>
          <a href="#" className="hover:text-gray-200">
            Services
          </a>
          <a href="#" className="hover:text-gray-200">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
