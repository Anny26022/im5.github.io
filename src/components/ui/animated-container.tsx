import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Define props for different animation types
export interface AnimatedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'fade' | 'fadeUp' | 'fadeDown' | 'scale' | 'none';
  delay?: number;
  duration?: number;
  as?: React.ElementType;
  staggerDelay?: number;
  children?: React.ReactNode;
}

// This is a lightweight replacement for the original AnimatedContainer
// It uses simple CSS transitions instead of complex JS animations
const AnimatedContainer = forwardRef<HTMLDivElement, AnimatedContainerProps>(
  ({
    type = 'none',
    delay = 0,
    duration = 150,
    as: Component = 'div',
    staggerDelay = 0.05,
    className,
    children,
    ...props
  }, ref) => {
    // Simple CSS classes for lightweight transitions
    const baseStyle = "transition-all";

    const animationClass = {
      'fade': "opacity-0 animate-in fade-in",
      'fadeUp': "opacity-0 translate-y-1 animate-in fade-in slide-in-from-bottom-1",
      'fadeDown': "opacity-0 -translate-y-1 animate-in fade-in slide-in-from-top-1",
      'scale': "opacity-0 scale-95 animate-in fade-in zoom-in-95",
      'none': ""
    }[type];

    // Apply staggered delay to children if needed with a performance optimization
    // Only apply stagger if reasonable number of children
    const maxStaggeredChildren = 10;
    const childCount = React.Children.count(children);

    const childrenWithStagger = staggerDelay > 0 && childCount > 0 && childCount <= maxStaggeredChildren
      ? React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;

          // Calculate staggered delay
          const itemDelay = delay + (index * staggerDelay);

          return React.cloneElement(child, {
            style: {
              ...child.props.style,
              transitionDelay: `${itemDelay}s`,
              animationDelay: `${itemDelay}s`
            },
          });
        })
      : children;

    return (
      <Component
        ref={ref}
        className={cn(
          baseStyle,
          animationClass,
          className
        )}
        style={{
          transitionDuration: `${duration}ms`,
          transitionDelay: `${delay}s`,
          animationDelay: `${delay}s`,
          ...props.style
        }}
        {...props}
      >
        {childrenWithStagger}
      </Component>
    );
  }
);

AnimatedContainer.displayName = "AnimatedContainer";

// AnimatedList component for lists with staggered animations
export interface AnimatedListProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerDelay?: number;
  children?: React.ReactNode;
}

const AnimatedList = forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ className, staggerDelay = 0.05, children, ...props }, ref) => {
    // Only apply animation if there are few children to improve performance
    const childCount = React.Children.count(children);
    const maxStaggerCount = 20; // Set a reasonable limit for performance

    // Skip staggering if too many children for better performance
    const shouldApplyStagger = childCount <= maxStaggerCount;

    // For large lists, don't modify children to avoid performance impact
    const processedChildren = shouldApplyStagger
      ? React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;

          // Apply delay only to a reasonable number of items
          const itemDelay = staggerDelay * index;

          return React.cloneElement(child, {
            style: {
              ...child.props.style,
              animationDelay: `${itemDelay}s`
            }
          });
        })
      : children;

    return (
      <div
        ref={ref}
        className={cn("transition-all", className)}
        {...props}
      >
        {processedChildren}
      </div>
    );
  }
);

AnimatedList.displayName = "AnimatedList";

// AnimatedListItem component for individual list items
export interface AnimatedListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
}

const AnimatedListItem = forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ className, delay = 0, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "opacity-0 animate-in fade-in", // Simplified animation
          className
        )}
        style={{
          animationDelay: `${delay}s`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AnimatedListItem.displayName = "AnimatedListItem";

// Animated button component for simple button animations
export interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: 'submit' | 'button' | 'reset';
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "transition-all duration-150 active:scale-95",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedContainer, AnimatedList, AnimatedListItem, AnimatedButton };
export default AnimatedContainer;
