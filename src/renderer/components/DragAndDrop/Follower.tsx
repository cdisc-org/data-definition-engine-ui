import React, { useEffect, useState, useRef } from 'react';
import { keyframes, styled } from '@mui/material/styles';

const frames = keyframes`
   0%, 100% {
    clip-path: polygon(100% 0, 100% 200%, 50% 50%, 0 200%, 0 0);
  }
  50% {
    clip-path: polygon(100% 0, 100% 100%, 50% 50%, 0 100%, 0 0);
  }
`;

const FollowerContainer = styled('div')({
  '&.follower-animation': {
    animation: `${frames} 0.3s ease-in-out infinite`,
  },
});

const FollowerEye = styled('div')({
  position: 'absolute',
  width: 15,
  height: 15,
  background: '#1a1a1a',
  boxShadow: 'inset 0 0 4px rgba(255, 255, 255, 0.5)',
  borderRadius: '50%',
  top: '40%',
  right: '20%',
});

const FollowerDiv = styled(FollowerContainer)(({ theme }) => ({
  position: 'fixed',
  width: 100,
  height: 100,
  background: 'radial-gradient(circle at 30% 30%, #ffeb3b, #ffc107, #ff9800)',
  boxShadow: '0 0 10px rgba(255, 152, 0, 0.3)',
  borderRadius: '50%',
  clipPath: 'polygon(100% 0, 100% 100%, 50% 50%, 0 100%, 0 0)',
  pointerEvents: 'none',
  zIndex: theme.zIndex.tooltip + 1,
}));

interface Props {
  mouseX: number;
  mouseY: number;
}

const Follower: React.FC<Props> = ({ mouseX, mouseY }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      setPosition((currentPos) => {
        const dx = mouseX - currentPos.x;
        const dy = mouseY - currentPos.y;

        return {
          x: currentPos.x + dx * 0.01,
          y: currentPos.y + dy * 0.01,
        };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mouseX, mouseY]);

  const angle =
    Math.atan2(mouseY - position.y, mouseX - position.x) * (180 / Math.PI);

  return (
    <FollowerDiv
      className="follower-animation"
      style={{
        left: position.x - 30,
        top: position.y - 30,
        transform: `rotate(${angle - 90}deg)`,
      }}
    >
      <FollowerEye />
    </FollowerDiv>
  );
};

export default Follower;
