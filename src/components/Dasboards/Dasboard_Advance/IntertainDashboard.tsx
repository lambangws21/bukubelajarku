// File: components/Dasboards/Dasboard_Advance/IntertainTabel.tsx
'use client';

import React from 'react';
import DataTable, { IntertainItem } from '@/components/Dasboards/Dasboard_Advance/IntertainTabel';

interface IntertainDashboardProps {
  intertainData: IntertainItem[];
}

const IntertainDashboard: React.FC<IntertainDashboardProps> = ({ intertainData }) => {
  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-2">Data Intertain</h2>
      <DataTable intertainData={intertainData} />
    </div>
  );
};

export default IntertainDashboard;
