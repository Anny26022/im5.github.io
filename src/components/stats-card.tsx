"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IndustryMapperStats } from "@/lib/data-processor"

interface StatsCardProps {
  stats: IndustryMapperStats
}

export function StatsCard({ stats }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/50">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Database Statistics</CardTitle>
            <CardDescription>
              Industry mapping database information
            </CardDescription>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-primary"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <div className="grid grid-cols-3 divide-x">
            <div className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalSymbols.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Symbols</p>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.mappedIndustries.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Mapped Industries</p>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalIndustries.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Industry Categories</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
