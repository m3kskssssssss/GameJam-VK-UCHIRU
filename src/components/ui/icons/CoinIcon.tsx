import type { SVGProps } from 'react'

interface CoinIconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number | string
}

export function CoinIcon({ size = 18, ...props }: CoinIconProps) {
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
      <circle cx="12" cy="12" r="10" fill="#F4B638" />
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="#B57500"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke="#B57500"
        strokeOpacity="0.45"
        strokeWidth="1.25"
      />
    </svg>
  )
}
