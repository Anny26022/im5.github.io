"use client"

import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="bg-background/60 backdrop-blur-md sticky top-0 z-50 w-full border-b">
      <div className="container flex h-14 items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                <path d="M2 2v20h20" />
                <path d="M6 16 10 7l4 5 4-11" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Stock Industry Mapper
              </h1>
            </div>
          </div>

          <div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
