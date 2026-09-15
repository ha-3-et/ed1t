"use client";
import { forwardRef } from "react";

const RequiredTextarea = forwardRef(
  ({ error, className = "", style = {}, ...props }, ref) => {
    const errorMessage = error === true ? "この項目は必須です" : error || null;

    const computedStyle = {
      ...style,
      fontSize: "16px",
      ...(errorMessage ? { borderColor: "#ef4444" } : {}),
    };

    const computedClassName = `${className} ${errorMessage ? "!bg-red-50" : ""}`;

    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          className={computedClassName}
          style={computedStyle}
          {...props}
        />

        {errorMessage && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full">
            <div className="relative bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg">
              <div className="absolute -top-1 left-4 w-2.5 h-2.5 bg-red-500 rotate-45 transform"></div>
              <div className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{errorMessage}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

RequiredTextarea.displayName = "RequiredTextarea";

export default RequiredTextarea;
