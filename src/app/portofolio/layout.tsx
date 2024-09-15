'use client';

import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400 text-white">
      {/* Header Section */}
      <header className="w-full bg-blue-500 p-6 text-center flex flex-col items-center mb-8">
        {/* <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white mb-4">
          <img src="https://via.placeholder.com/150" alt="Profile Picture" className="w-full h-full object-cover" />
        </div> */}
        <h1 className="text-4xl font-bold">Herlambang Wicaksono</h1>
        <p className="text-md italic">Freelancer | Operating Room Nurse</p>
      </header>

      {/* Main Content Section */}
      <main className="flex-1 w-full p-8 max-w-4xl mx-auto space-y-16 bg-white rounded-t-3xl shadow-xl">
        {children}
      </main>

      {/* Footer Section */}
      <footer className="w-full p-4 bg-white text-center text-sm text-gray-700 shadow-inner mt-8">
        &copy; 2024 Herlambang Wicaksono. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
