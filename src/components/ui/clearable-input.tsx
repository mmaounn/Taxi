"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface ClearableInputProps extends React.ComponentProps<typeof Input> {
  onClear?: () => void;
}

function ClearableInput({ onClear, className, onChange, ...props }: ClearableInputProps) {
  const innerRef = React.useRef<HTMLInputElement>(null);
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

  // Merge refs: keep innerRef in sync with the forwarded ref
  const mergedRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      (innerRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      // Forward to external ref if provided
      const externalRef = props.ref;
      if (typeof externalRef === "function") {
        externalRef(node);
      } else if (externalRef) {
        (externalRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    },
    [props.ref]
  );

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasContent(e.target.value.length > 0);
      onChange?.(e);
    },
    [onChange]
  );

  // Exclude ref and onChange from props spread (we handle them ourselves)
  const { ref: _, ...restProps } = props;

  return (
    <div className="relative">
      <Input
        ref={mergedRef}
        className={`${className || ""} ${hasContent ? "pr-8" : ""}`}
        onChange={handleChange}
        {...restProps}
      />
      {hasContent && onClear && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
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

export { ClearableInput };
