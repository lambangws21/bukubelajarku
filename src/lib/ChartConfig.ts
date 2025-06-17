import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    BarController,
    LineController,
    DoughnutController,
  } from 'chart.js';
  
  // ⛔️ Penting: ini HARUS dipanggil di awal sebelum chart digunakan
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    BarController,
    LineController,
    DoughnutController
  );
  