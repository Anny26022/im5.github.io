"use client"

import { Heart, BarChart3, Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="fixed bottom-3 left-3 py-1.5 px-3 sm:py-2.5 sm:px-4 bg-background/80 backdrop-blur-sm z-10 rounded-lg shadow-sm border hover:border-primary/30 hover:bg-background/90 transition-all duration-300">
      <div className="flex flex-col items-start gap-0.5 sm:gap-1">
        <p className="text-[10px] sm:text-xs leading-tight text-muted-foreground flex items-center gap-1 flex-wrap justify-start">
          <span>Built by</span>{" "}
          <span className="font-medium underline underline-offset-4 text-foreground/90 cursor-pointer hover:text-primary transition-colors duration-200">
            Aniket
          </span>{" "}
          <span className="flex items-center">
            with <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-rose-500 mx-0.5 sm:mx-1 fill-rose-500" /> from India
          </span>
          <span className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs" aria-label="Indian Flag">
            🇮🇳
          </span>
        </p>
        <p className="text-[10px] sm:text-xs leading-tight text-muted-foreground flex items-center gap-1 flex-wrap justify-start">
          <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />
          <span>Process up to </span>
          <span className="font-medium text-foreground/90 hover:text-primary transition-colors duration-200">
            999
          </span>
          <span> symbols at once</span>
          <BarChart3 className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5 sm:ml-1 text-emerald-500" />
        </p>
      </div>
    </footer>
  )
}
