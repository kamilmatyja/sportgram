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
            aria-label="Sportgram icon"
        >
            <defs>
                <linearGradient id="sportgram-logo-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
            </defs>
            <rect width="512" height="512" rx="112" fill="#0f172a" />
            <circle cx="256" cy="256" r="170" fill="none" stroke="url(#sportgram-logo-g)" strokeWidth="38" />
            <path d="M150 256h212" stroke="url(#sportgram-logo-g)" strokeWidth="38" strokeLinecap="round" />
            <circle cx="256" cy="256" r="26" fill="#22d3ee" />
        </svg>
    );
}

export default RunnerLogo;
