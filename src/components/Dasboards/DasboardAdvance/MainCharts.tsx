// File: components/MainCharts.tsx
'use client';

import React from 'react';
import '@/lib/ChartConfig';
import { Chart, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { ScriptableContext } from 'chart.js';

interface MainChartsProps {
  months: string[];
  monthly: number[];
  breakdown: [string, number][];
  filteredCount: number;
}

const MainCharts: React.FC<MainChartsProps> = ({ months, monthly, breakdown, filteredCount }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <motion.div
        className="lg:col-span-2 h-64 sm:h-80"
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        transition={{ delay: 0.4 }}
      >
        <Chart
          type="bar"
          data={{
            labels: months,
            datasets: [
              {
                type: 'bar',
                label: 'Biaya',
                data: monthly.map(m => (isNaN(m) ? 0 : m)),
                backgroundColor: (ctx: ScriptableContext<'bar'>) => {
                  const chart = ctx.chart;
                  const gc = chart?.ctx;
                  if (!gc || !(gc instanceof CanvasRenderingContext2D)) {
                    return 'rgba(59,130,246,0.5)';
                  }
                  const gradient = gc.createLinearGradient(0, 0, 0, chart.height || 200);
                  gradient.addColorStop(0, 'rgba(59,130,246,0.8)');
                  gradient.addColorStop(1, 'rgba(59,130,246,0.3)');
                  return gradient;
                }
              },
              {
                type: 'line',
                label: 'Rata2',
                data: monthly.map(m => (isNaN(m) ? 0 : m / (filteredCount / 12 || 1))),
                borderColor: 'rgba(234,179,8,0.8)',
                backgroundColor: 'rgba(234,179,8,0.2)',
                fill: true,
                tension: 0.4
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { padding: 10 } } },
            scales: {
              y: { beginAtZero: true, grid: { color: 'rgba(200,200,200,0.2)' } },
              x: { grid: { display: false } }
            }
          }}
        />
      </motion.div>
      <motion.div
        className="h-64 sm:h-80"
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        transition={{ delay: 0.6 }}
      >
        <Doughnut
          data={{
            labels: breakdown.map(b => b[0]),
            datasets: [{
              data: breakdown.map(b => b[1]),
              backgroundColor: ['#3b82f6', '#10b981', '#eab308', '#ec4899']
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 20 } } },
            animation: { duration: 500 }
          }}
        />
      </motion.div>
    </div>
  );
};

export default MainCharts;
