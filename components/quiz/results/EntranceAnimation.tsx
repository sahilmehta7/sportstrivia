"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface EntranceAnimationProps {
    children: ReactNode;
    className?: string;
}

export function EntranceAnimation({ children, className }: EntranceAnimationProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
