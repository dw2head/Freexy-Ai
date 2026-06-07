import React, { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Deep dark background
      ctx.fillStyle = '#050a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 1.5;
      
      // Draw multiple sine waves to simulate glowing energy lines
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        
        // Dynamic colors for each wave
        const hue = 200 + i * 15;
        const opacity = 0.5 + Math.sin(time * 0.05 + i) * 0.2;
        ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${opacity})`;
        
        // Add glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${hue}, 100%, 55%, 0.8)`;
        
        for (let x = 0; x < canvas.width; x += 10) {
          // Complex math for fluid wave motion
          const y = canvas.height / 2 
            + Math.sin(x * 0.002 + time * 0.03 + i) * (100 + i * 20)
            + Math.cos(x * 0.005 + time * 0.02 - i) * (50 + i * 10);
            
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      time += 0.8;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
