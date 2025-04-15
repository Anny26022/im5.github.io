"use client";

import Link from "next/link";
import { useState, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Calendar, Home, Menu, X, BarChart2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatePresence, motion } from "framer-motion";

export function NavigationBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Memoize navItems so it's not rebuilt every render
  const navItems = useMemo(() => [
    { name: "Dashboard", href: "/", icon: <Home className="h-4 w-4" /> },
    { name: "Results Calendar Export", href: "/results-calendar-export", icon: <Calendar className="h-4 w-4" /> },
  ], []);

  // Only recreate this when pathname changes
  const isActive = useCallback((path) => pathname === path, [pathname]);

  // Handler memoized to prevent always-new closers on nav item clicks
  const handleToggleMenu = useCallback(() => setMobileMenuOpen((open) => !open), []);
  const handleCloseMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Animation settings for smoother feel
  const menuTransition = {
    duration: 0.25,
    ease: [0.22, 1, 0.36, 1], // out-cubic, gentle
  };

  return (
    // Only one state-driven rerender: mobileMenuOpen, not global app navigation
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm transition-all duration-200 border-b border-border/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold hidden sm:block">Stock Industry Mapper</h1>
        </div>
        <nav className="hidden md:flex items-center space-x-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive(item.href)
                  ? 'text-primary'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted'}`}
            >
              {item.icon}
              <span>{item.name}</span>
              {/* Active indicator line */}
              {isActive(item.href) && (
                <motion.div
                  layoutId="activeNavItem"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          ))}
          <div className="ml-3 pl-3 border-l border-border/50">
            <ThemeToggle />
          </div>
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <button
            onClick={handleToggleMenu}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle menu"
            type="button"
            tabIndex={0}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {/* Backdrop + Mobile Navigation Animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay for mobile nav - click to close */}
            <motion.div
              key="mobile-backdrop"
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={menuTransition}
              aria-hidden="true"
              onClick={handleCloseMenu}
            />
            {/* Animated Mobile Menu */}
            <motion.div
              key="mobile-nav"
              className="md:hidden absolute top-16 left-0 right-0 z-50 bg-background border-b shadow-md"
              initial={{ opacity: 0, y: -18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.98 }}
              transition={menuTransition}
              tabIndex={0}
              role="dialog"
              aria-modal="true"
            >
              <nav className="container mx-auto px-4 py-3 flex flex-col space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleCloseMenu}
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-md text-sm font-medium transition-colors
                      ${isActive(item.href)
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted text-foreground/80 hover:text-foreground'}`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
