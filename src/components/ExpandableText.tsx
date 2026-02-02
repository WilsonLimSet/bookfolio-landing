"use client";

import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ExpandableText({
  text,
  maxLength = 500,
  className = ""
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > maxLength;

  if (!shouldTruncate) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div>
      <p className={className}>
        {isExpanded ? text : text.slice(0, maxLength) + "..."}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-neutral-500 hover:text-neutral-700 mt-2 font-medium"
      >
        {isExpanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}
