"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { ReactNode, forwardRef } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface DraggableItemProps {
  id: string
  children: ReactNode
  className?: string
  dragOverlay?: boolean
}

export const DraggableItem = forwardRef<HTMLDivElement, DraggableItemProps>(
  ({ id, children, className, dragOverlay = false }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    // Animation variants for the handle
    const handleVariants = {
      initial: { opacity: 0, x: -5 },
      hover: { opacity: 0.7, x: 0 },
    }

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: isDragging && !dragOverlay ? 0.5 : 1,
          y: 0,
          scale: isDragging && !dragOverlay ? 0.98 : 1,
          backgroundColor: isDragging && !dragOverlay ? "var(--muted)" : undefined
        }}
        whileHover={{ backgroundColor: "var(--muted)" }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-center justify-between px-2.5 py-1.5 rounded-md group relative",
          isDragging && "bg-muted/80 shadow-sm",
          className
        )}
        {...attributes}
      >
        <motion.div
          className="absolute left-1 top-0 bottom-0 flex items-center justify-center cursor-grab text-muted-foreground hover:text-foreground"
          variants={handleVariants}
          initial="initial"
          whileHover={{ scale: 1.1 }}
          animate={isDragging ? "hover" : "initial"}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </motion.div>
        <div className="flex-1 ml-4">
          {children}
        </div>
      </motion.div>
    )
  }
)

DraggableItem.displayName = "DraggableItem"
