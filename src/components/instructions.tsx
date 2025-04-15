"use client"

import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function Instructions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">How to Use This Tool</CardTitle>
          <CardDescription>
            Quick instructions for mapping stock symbols to industries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Instructions</AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal ml-4 space-y-2 text-sm">
                  <li>Enter up to 999 stock symbols in the text area below</li>
                  <li>Symbols can be separated by commas or newlines</li>
                  <li>You can use NSE symbols with or without the "NSE:" prefix (e.g., both "RELIANCE" and "NSE:RELIANCE" work)</li>
                  <li>Check "Show fundamentals and result dates" to view quarterly results dates and financial metrics</li>
                  <li>Click 'Process Symbols' to get industry mappings and fundamental data</li>
                  <li>Use the 'Copy' button to copy formatted output with NSE prefix added automatically</li>
                  <li>Download the data as CSV if needed</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>TradingView Usage</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm">
                  The TradingView Format tab provides you with output you can directly paste into TradingView's symbol search. You have two options:
                </p>
                <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
                  <li><strong>With industry categorization</strong>: Groups symbols by industry with category labels. Great for organizing your watchlists.</li>
                  <li><strong>Flat list of symbols</strong>: Simple comma-separated list of NSE-prefixed symbols. Use this to quickly load all symbols at once.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  )
}
