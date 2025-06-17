import { useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface AnimatedChartProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'area';
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
  height?: number | string;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  animationDuration?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="rounded-lg bg-white/90 dark:bg-gray-800/90 p-3 shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700"
      >
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

export const AnimatedChart = ({
  data,
  type,
  title,
  xAxisLabel,
  yAxisLabel,
  colors = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'],
  height = 400,
  className,
  showGrid = true,
  showLegend = true,
  stacked = false,
  animationDuration = 1500,
}: AnimatedChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseMove = useCallback((e: any) => {
    if (e && e.activeTooltipIndex !== undefined) {
      setActiveIndex(e.activeTooltipIndex);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />}
            <XAxis
              dataKey="name"
              label={xAxisLabel ? { value: xAxisLabel, position: 'bottom' } : undefined}
              stroke="currentColor"
              className="text-sm"
            />
            <YAxis
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'left' } : undefined}
              stroke="currentColor"
              className="text-sm"
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {Object.keys(data[0] || {})
              .filter(key => key !== 'name')
              .map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={animationDuration}
                />
              ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />}
            <XAxis
              dataKey="name"
              label={xAxisLabel ? { value: xAxisLabel, position: 'bottom' } : undefined}
              stroke="currentColor"
              className="text-sm"
            />
            <YAxis
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'left' } : undefined}
              stroke="currentColor"
              className="text-sm"
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {Object.keys(data[0] || {})
              .filter(key => key !== 'name')
              .map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  stackId={stacked ? 'stack' : undefined}
                  animationDuration={animationDuration}
                />
              ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />}
            <XAxis
              dataKey="name"
              label={xAxisLabel ? { value: xAxisLabel, position: 'bottom' } : undefined}
              stroke="currentColor"
              className="text-sm"
            />
            <YAxis
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'left' } : undefined}
              stroke="currentColor"
              className="text-sm"
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {Object.keys(data[0] || {})
              .filter(key => key !== 'name')
              .map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  stroke={colors[index % colors.length]}
                  stackId={stacked ? 'stack' : undefined}
                  fillOpacity={0.3}
                  animationDuration={animationDuration}
                />
              ))}
          </AreaChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <div style={{ height, width: '100%' }} className="text-gray-700 dark:text-gray-300">
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Example usage:
// const data = [
//   { name: 'Jan', sales: 4000, profit: 2400 },
//   { name: 'Feb', sales: 3000, profit: 1398 },
//   { name: 'Mar', sales: 2000, profit: 9800 },
//   { name: 'Apr', sales: 2780, profit: 3908 },
// ];
// 
// <AnimatedChart
//   data={data}
//   type="line"
//   title="Monthly Performance"
//   xAxisLabel="Month"
//   yAxisLabel="Amount"
//   height={400}
//   showGrid
//   showLegend
// /> 