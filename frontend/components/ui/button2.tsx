import React from "react";
import { Pressable, ActivityIndicator } from "react-native";
import type { PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva("flex-row items-center justify-center rounded-md px-4 py-2", {
  variants: {
    variant: {
      default: "bg-[#4CAF50]",
      outline: "bg-transparent border border-[#4CAF50]",
      ghost: "bg-transparent",
    },
    size: {
      default: "h-10",
      sm: "h-8 px-3",
      lg: "h-12 px-6",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ children, variant, size, isLoading, className, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={variant === "default" ? "white" : "#4CAF50"} />
        ) : (
          children
        )}
      </Pressable>
    );
  }
);

Button.displayName = "Button";
