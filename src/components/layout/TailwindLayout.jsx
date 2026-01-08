import React, { useState } from 'react';
import TailwindSidebar from './TailwindSidebar';
import TailwindHeader from './TailwindHeader';

const TailwindLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Sidebar */}
      <TailwindSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="relative lg:pl-72 h-full flex flex-col z-0">
        {/* Header */}
        <TailwindHeader setSidebarOpen={setSidebarOpen} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">{children}</main>
      </div>
    </div>
  );
};

export default TailwindLayout;
