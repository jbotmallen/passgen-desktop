import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hideCapacity?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, defaultValue, onChange, maxLength, hideCapacity, ...props }, ref) => {
    // Track value for uncontrolled inputs
    const [localValue, setLocalValue] = React.useState(defaultValue || "");

    const displayLength = value !== undefined ? String(value).length : String(localValue).length;

    // Extract padding-right from className to offset the caps indicator if there are other icons
    const prMatch = (className || '').match(/pr-(\d+)/);
    const rightOffset = prMatch ? `${Number(prMatch[1]) * 0.25 + 0.25}rem` : '0.75rem';

    return (
      <div className="relative w-full">
        <input
          type={type}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          onChange={(e) => {
            if (value === undefined) setLocalValue(e.target.value);
            onChange?.(e);
          }}
          className={cn(
            "flex h-9 w-full rounded-lg border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50",
            maxLength && !prMatch && "pr-12", // ensure space for the indicator if no other pr-* is defined
            className
          )}
          ref={ref}
          {...props}
        />
        {maxLength && !hideCapacity && type !== "password" && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10"
            style={{ right: rightOffset }}
          >
            <span className={cn(
              "text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-sm transition-colors duration-200",
              displayLength >= maxLength 
                ? "text-red-400 bg-red-400/10" 
                : "text-muted-foreground/50 bg-muted/20"
            )}>
              {displayLength}/{maxLength}
            </span>
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
