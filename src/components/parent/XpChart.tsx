'use client'
// XpChart — recharts LineChart showing XP per day for the last 14 days.
// Client component because recharts requires DOM/canvas APIs.
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ru } from '@/i18n/ru'
import type { XpDataPoint } from '@/server/actions/analytics'

const { parent: p } = ru

interface XpChartProps {
  data: XpDataPoint[]
}

export function XpChart({ data }: XpChartProps) {
  const hasActivity = data.some((d) => d.xp > 0)

  if (!hasActivity) {
    return (
      <div
        role="status"
        className="flex items-center justify-center h-40 rounded-[var(--radius-card)] bg-muted text-muted-foreground text-sm"
      >
        {p.xpChartEmpty}
      </div>
    )
  }

  return (
    <div className="w-full h-56" role="img" aria-label={p.xpChartTitle}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={36}
            label={{
              value: p.xpAxisLabel,
              angle: -90,
              position: 'insideLeft',
              offset: 18,
              style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '0.5rem',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--background))',
              fontSize: 13,
            }}
            formatter={(value: number) => [
              new Intl.NumberFormat('ru-RU').format(value),
              p.xpAxisLabel,
            ]}
          />
          <Line
            type="monotone"
            dataKey="xp"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
