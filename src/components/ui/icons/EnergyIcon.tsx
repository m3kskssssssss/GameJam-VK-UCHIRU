import type { SVGProps } from 'react'

interface EnergyIconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number | string
}

export function EnergyIcon({ size = 18, ...props }: EnergyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M13 2L4 14h6l-1 8 11-12h-6l1-8z"
        fill="#FACC15"
        stroke="#A16207"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
