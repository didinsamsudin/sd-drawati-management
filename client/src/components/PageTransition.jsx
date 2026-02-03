import { motion, AnimatePresence } from 'framer-motion'

function PageTransition({ children, step }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1] // Custom ease curve for premium feel
                }}
                className="w-full h-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}

export default PageTransition
