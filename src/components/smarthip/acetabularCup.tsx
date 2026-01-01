// type CupProps = {
//     size: 44 | 46 | 48 | 50 | 52 | 54;
//     x: number;
//     y: number;
//     scale?: number;
//     rotation?: number;
//   };
  
//   export function AcetabularCup({
//     size,
//     x,
//     y,
//     scale = 1,
//     rotation = 0,
//   }: CupProps) {
//     const radius = size / 2;
  
//     return (
//       <svg
//         width={300}
//         height={300}
//         style={{
//           position: "absolute",
//           left: x,
//           top: y,
//           transform: `
//             translate(-50%, -50%)
//             scale(${scale})
//             rotate(${rotation}deg)
//           `,
//           pointerEvents: "none",
//         }}
//         viewBox={`-${radius + 20} -${radius + 20} ${radius * 2 + 40} ${radius * 2 + 40}`}
//       >
//         {/* Rim */}
//         <circle
//           r={radius}
//           fill="none"
//           stroke="rgba(0,120,255,0.95)"
//           strokeWidth={4}
//         />
  
//         {/* Cup body */}
//         <path
//           d={`M -${radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0`}
//           fill="none"
//           stroke="rgba(0,120,255,0.25)"
//           strokeWidth={2}
//         />
  
//         {/* Center */}
//         <line x1={-4} y1={0} x2={4} y2={0} stroke="rgba(0,120,255,0.8)" />
//         <line x1={0} y1={-4} x2={0} y2={4} stroke="rgba(0,120,255,0.8)" />
  
//         {/* Orientation guide */}
//         <line
//           x1={0}
//           y1={0}
//           x2={radius + 10}
//           y2={-(radius * 0.77)}
//           stroke="rgba(0,120,255,0.6)"
//           strokeDasharray="4 4"
//         />
//       </svg>
//     );
//   }
  

type CupProps = {
    size: number;          // 44–54
    rotation?: number;     // degree
  };
  
  export function AcetabularCup({
    size,
    rotation = 0,
  }: CupProps) {
    const r = size / 2;
  
    return (
      <svg
        viewBox={`-${r + 10} -${r + 10} ${r * 2 + 20} ${r * 2 + 20}`}
        width={300}
        height={300}
        style={{
          transform: `rotate(${rotation}deg)`,
          pointerEvents: "none",
        }}
      >
        {/* Rim */}
        <circle
          r={r}
          fill="none"
          stroke="#1e88e5"
          strokeWidth={3}
        />
  
        {/* Cup body (hemisphere) */}
        <path
          d={`M -${r} 0 A ${r} ${r} 0 0 1 ${r} 0`}
          fill="none"
          stroke="rgba(30,136,229,0.35)"
          strokeWidth={1.5}
        />
  
        {/* Center of rotation */}
        <line x1={-3} y1={0} x2={3} y2={0} stroke="#1e88e5" />
        <line x1={0} y1={-3} x2={0} y2={3} stroke="#1e88e5" />
  
        {/* Orientation guide (40°) */}
        <line
          x1={0}
          y1={0}
          x2={r * 0.8}
          y2={-(r * 0.6)}
          stroke="rgba(30,136,229,0.6)"
          strokeDasharray="4 4"
        />
      </svg>
    );
  }
  