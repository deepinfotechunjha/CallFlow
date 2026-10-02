import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const AnimatedCounter = ({ value, duration = 0.8, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(Number(value) || 0);
  const prevValueRef = useRef(Number(value) || 0);

  useEffect(() => {
    const target = Number(value) || 0;
    const startVal = prevValueRef.current;
    const obj = { val: startVal };

    const tween = gsap.to(obj, {
      val: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayValue(Math.round(obj.val));
      },
      onComplete: () => {
        prevValueRef.current = target;
      }
    });

    return () => {
      tween.kill();
      prevValueRef.current = target;
    };
  }, [value, duration]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
};

export default AnimatedCounter;
