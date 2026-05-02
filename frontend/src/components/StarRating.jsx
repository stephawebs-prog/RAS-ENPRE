import React, { useState } from "react";
import { Star } from "lucide-react";

/**
 * StarRating — display + optional interactive mode.
 * Props:
 *  - value: number (0-5, can be decimal like 4.3)
 *  - onChange: (n) => void — if provided, becomes interactive
 *  - size: pixel size
 *  - count: show "(N)" after stars when provided
 *  - showValue: show decimal value like "4.3" next to stars
 *  - testid: base data-testid for the star buttons
 */
const StarRating = ({ value = 0, onChange, size = 16, count, showValue = false, testid = "star" }) => {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === "function";
  const display = hover || value;

  return (
    <div className="inline-flex items-center gap-1.5 align-middle">
      <div className="inline-flex items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(display);
          const half = !filled && i - 0.5 <= display;
          const StarEl = (
            <Star
              size={size}
              className={`${filled || half ? "text-orange" : "text-gray-300"} transition-colors`}
              fill={filled ? "currentColor" : "none"}
              strokeWidth={1.8}
            />
          );
          return interactive ? (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(i)}
              className="p-0.5 hover:scale-110 transition-transform"
              data-testid={`${testid}-${i}`}
              aria-label={`${i} stars`}
            >
              {StarEl}
            </button>
          ) : (
            <span key={i} className="px-0.5">{StarEl}</span>
          );
        })}
      </div>
      {showValue && value > 0 && (
        <span className="text-xs font-bold text-teal-deep">{value.toFixed(1)}</span>
      )}
      {typeof count === "number" && (
        <span className="text-xs text-teal-soft">({count})</span>
      )}
    </div>
  );
};

export default StarRating;
