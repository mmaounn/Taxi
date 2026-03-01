"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface ClearableInputProps extends React.ComponentProps<typeof Input> {
  onClear?: () => void;
}

const ClearableInput = React.forwardRef<HTMLInputElement, ClearableInputProps>(
  ({ onClear, className, onChange, ...props }, forwardedRef) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    // Track whether input has content (works for both controlled and uncontrolled)
    const [hasContent, setHasContent] = React.useState(() => {
      const v = props.value ?? props.defaultValue ?? "";
      return String(v).length > 0;
    });

    // Sync controlled value prop
    React.useEffect(() => {
      if (props.value !== undefined) {
        setHasContent(String(props.value).length > 0);
      }
    }, [props.value]);

    // Merge refs
    const setRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        (innerRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setHasContent(e.target.value.length > 0);
        onChange?.(e);
      },
      [onChange]
    );

    return (
      <div className="relative">
        <Input
          ref={setRef}
          className={`${className || ""} ${hasContent ? "pr-8" : ""}`}
          onChange={handleChange}
          {...props}
        />
        {hasContent && onClear && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              // Clear DOM value for uncontrolled inputs (react-hook-form register)
              if (innerRef.current) {
                innerRef.current.value = "";
              }
              onClear();
              setHasContent(false);
              innerRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);

ClearableInput.displayName = "ClearableInput";

export { ClearableInput };
