import { motion } from 'framer-motion'

const orbs = [
    { color: 'rgba(59,130,246,0.6)', size: 500, top: '10%', left: '15%', duration: 22 },
    { color: 'rgba(168,85,247,0.5)', size: 450, top: '55%', left: '65%', duration: 26 },
    { color: 'rgba(245,158,11,0.4)', size: 400, top: '70%', left: '20%', duration: 30 },
]

export default function AmbientBackground() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                zIndex: 0,
                pointerEvents: 'none',
            }}
        >
            {orbs.map((orb, i) => (
                <motion.div
                    key={i}
                    className="ambient-orb"
                    style={{
                        width: orb.size,
                        height: orb.size,
                        top: orb.top,
                        left: orb.left,
                        background: orb.color,
                    }}
                    animate={{
                        x: [0, 40, -30, 0],
                        y: [0, -30, 20, 0],
                    }}
                    transition={{
                        duration: orb.duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    )
}