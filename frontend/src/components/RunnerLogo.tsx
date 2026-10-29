interface RunnerLogoProps {
    size?: number;
}

export function RunnerLogo({ size = 32 }: RunnerLogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            width={size}
            height={size}
            role="img"
            aria-label="Sportgram runner icon"
        >
            <defs>
                <linearGradient id="sportgram-runner-g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
                <linearGradient id="sportgram-motion-g" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="sportgram-bg-g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#020617" />
                </linearGradient>
            </defs>
            {/* Background rounded squircle */}
            <rect width="512" height="512" rx="112" fill="url(#sportgram-bg-g)" />

            {/* Motion speed lines */}
            <path
                d="M80 195 h 85 M60 256 h 115 M90 317 h 75"
                stroke="url(#sportgram-motion-g)"
                strokeWidth="16"
                strokeLinecap="round"
            />

            {/* Runner Figure */}
            {/* Head */}
            <circle cx="330" cy="120" r="34" fill="url(#sportgram-runner-g)" />

            {/* Torso */}
            <path
                d="M265 245 L310 170"
                stroke="url(#sportgram-runner-g)"
                strokeWidth="32"
                strokeLinecap="round"
            />

            {/* Front Leg (knee forward and foot down) */}
            <path
                d="M265 245 L345 265 L375 365"
                stroke="url(#sportgram-runner-g)"
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />

            {/* Rear Leg (extended backward) */}
            <path
                d="M265 245 L205 315 L145 335"
                stroke="url(#sportgram-runner-g)"
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />

            {/* Front Arm (elbow back, forearm forward) */}
            <path
                d="M305 175 L365 190 L395 155"
                stroke="url(#sportgram-runner-g)"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />

            {/* Rear Arm (extended back) */}
            <path
                d="M300 180 L240 200 L210 165"
                stroke="url(#sportgram-runner-g)"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}

export default RunnerLogo;
