import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    BarController,
    // Tambahan jika pakai Line, Pie, Doughnut, dll
    ArcElement,
    LineElement,
    PointElement,
  } from 'chart.js';
  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    BarController,
    ArcElement,
    LineElement,
    PointElement,
  );
  