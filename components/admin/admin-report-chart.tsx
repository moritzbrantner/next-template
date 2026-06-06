'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AdminReportSeries } from '@/src/domain/admin-reports/use-cases';

type AdminReportChartProps = {
  series: AdminReportSeries;
};

type ChartConfig = Record<
  string,
  {
    label: ReactNode;
    color?: string;
  }
>;

type ChartColorStyles = CSSProperties & Record<`--color-${string}`, string>;

type ChartTooltipPayloadItem = {
  dataKey?: string | number;
  name?: string | number;
  value?: string | number | Array<string | number> | null;
  color?: string;
  fill?: string;
  stroke?: string;
};

type ChartTooltipContentProps = {
  active?: boolean;
  label?: string | number;
  payload?: ChartTooltipPayloadItem[];
  config: ChartConfig;
  indicator?: 'dot' | 'line';
};

function buildChartConfig(series: AdminReportSeries): ChartConfig {
  return Object.fromEntries(
    series.categories.map((category) => [
      category.key,
      {
        label: category.label,
        color: category.color,
      },
    ]),
  );
}

function buildChartColorStyles(config: ChartConfig): ChartColorStyles {
  return Object.fromEntries(
    Object.entries(config)
      .filter(
        (entry): entry is [string, ChartConfig[string] & { color: string }] =>
          Boolean(entry[1].color),
      )
      .map(([key, value]) => [`--color-${key}`, value.color]),
  ) as ChartColorStyles;
}

function hasSeriesData(series: AdminReportSeries) {
  return series.data.some((row) =>
    series.categories.some((category) => {
      const value = row[category.key];
      return typeof value === 'number' && value > 0;
    }),
  );
}

function formatTooltipValue(
  value: ChartTooltipPayloadItem['value'],
): ReactNode {
  if (Array.isArray(value)) {
    return value.join(' - ');
  }

  return value ?? null;
}

function ChartTooltipContent({
  active,
  label,
  payload,
  config,
  indicator = 'dot',
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      {label ? (
        <div className="mb-2 font-medium text-zinc-950 dark:text-zinc-50">
          {label}
        </div>
      ) : null}
      <div className="space-y-1.5">
        {payload.map((item) => {
          const dataKey = item.dataKey ? String(item.dataKey) : '';
          const color =
            item.color ?? item.stroke ?? item.fill ?? config[dataKey]?.color;

          return (
            <div
              key={dataKey || String(item.name)}
              className="flex min-w-32 items-center justify-between gap-4"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={
                    indicator === 'line'
                      ? 'h-0.5 w-3 shrink-0 rounded-full'
                      : 'size-2 shrink-0 rounded-full'
                  }
                  style={{ backgroundColor: color }}
                />
                <span className="truncate text-zinc-600 dark:text-zinc-300">
                  {config[dataKey]?.label ?? item.name ?? dataKey}
                </span>
              </div>
              <span className="font-mono text-xs font-medium text-zinc-950 dark:text-zinc-50">
                {formatTooltipValue(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className} style={buildChartColorStyles(config)}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function AdminReportChart({ series }: AdminReportChartProps) {
  if (!hasSeriesData(series)) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {series.emptyMessage}
      </p>
    );
  }

  const config = buildChartConfig(series);
  const chartHeightClass = series.type === 'sparkline' ? 'h-24' : 'h-80';
  const commonAxisProps = {
    tickLine: false,
    axisLine: false,
  } as const;

  return (
    <ChartContainer config={config} className={`w-full ${chartHeightClass}`}>
      {series.type === 'bar' ? (
        <BarChart data={series.data} margin={{ left: 0, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey={series.xKey} minTickGap={24} {...commonAxisProps} />
          <YAxis allowDecimals={false} width={32} {...commonAxisProps} />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent config={config} indicator="line" />}
          />
          {series.categories.map((category) => (
            <Bar
              key={category.key}
              dataKey={category.key}
              fill={`var(--color-${category.key})`}
              radius={6}
            />
          ))}
        </BarChart>
      ) : series.type === 'area' ? (
        <AreaChart data={series.data} margin={{ left: 0, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey={series.xKey} minTickGap={24} {...commonAxisProps} />
          <YAxis allowDecimals={false} width={32} {...commonAxisProps} />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent config={config} indicator="line" />}
          />
          {series.categories.map((category) => (
            <Area
              key={category.key}
              type="monotone"
              dataKey={category.key}
              stroke={`var(--color-${category.key})`}
              fill={`var(--color-${category.key})`}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      ) : (
        <LineChart data={series.data} margin={{ left: 0, right: 12, top: 8 }}>
          {series.type === 'sparkline' ? null : (
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
          )}
          <XAxis
            dataKey={series.xKey}
            hide={series.type === 'sparkline'}
            minTickGap={24}
            {...commonAxisProps}
          />
          <YAxis
            hide={series.type === 'sparkline'}
            allowDecimals={false}
            width={32}
            {...commonAxisProps}
          />
          <Tooltip
            cursor={series.type === 'sparkline' ? false : undefined}
            content={
              <ChartTooltipContent
                config={config}
                indicator={series.type === 'sparkline' ? 'dot' : 'line'}
              />
            }
          />
          {series.categories.map((category) => (
            <Line
              key={category.key}
              type="monotone"
              dataKey={category.key}
              stroke={`var(--color-${category.key})`}
              strokeWidth={series.type === 'sparkline' ? 3 : 2}
              dot={series.type === 'sparkline' ? false : { r: 2 }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      )}
    </ChartContainer>
  );
}
