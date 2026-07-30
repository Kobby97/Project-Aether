import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';

/**
 * Circular gauge used for each metric (temperature, humidity, air quality,
 * luminosity). Renders an SVG ring whose fill proportion reflects
 * `value` within [min, max], with an animated count-up label.
 */
export default function ComfortGauge({
  label,
  value,
  unit,
  min = 0,
  max = 100,
  color = 'var(--color-accent-green)',
  iconName,
  size = 76,
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const Icon = iconName ? Icons[iconName] : null;

  useEffect(() => {
    let frame;
    const duration = 700;
    const start = performance.now();
    const from = displayValue;
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
        {Icon && <Icon size={13} className="opacity-80" />}
        <span>{label}</span>
      </div>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={6}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-white leading-none">
            {Math.round(displayValue)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">{unit}</span>
        </div>
      </div>
    </div>
  );
}
