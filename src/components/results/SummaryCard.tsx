/**
 * Summary Card Component
 * Display key hydraulic calculation results in KPI format
 */

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { CardLegacy as Card } from '@/components/ui/CardNew';
import { classNames } from '@/lib/utils/classNames';

interface Metric {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'safe' | 'warning' | 'critical' | 'neutral';
  icon?: React.ReactNode;
  highlight?: boolean;
}

interface SummaryCardProps {
  title: string;
  subtitle?: string;
  metrics: Metric[];
  className?: string;
  layout?: 'grid' | 'compact';
}

const statusStyles = {
  safe: 'bg-success-50 border-success-200',
  warning: 'bg-warning-50 border-warning-200',
  critical: 'bg-danger-50 border-danger-200',
  neutral: 'bg-slate-50 border-slate-200',
};

const statusTextStyles = {
  safe: 'text-success-800',
  warning: 'text-warning-800',
  critical: 'text-danger-800',
  neutral: 'text-slate-800',
};

/**
 * Professional KPI card for displaying calculation results
 * @example
 * <SummaryCard
 *   title="Manning Calculation Results"
 *   metrics={[
 *     { label: 'Discharge', value: 5.23, unit: 'm³/s', highlight: true },
 *     { label: 'Velocity', value: 2.15, unit: 'm/s' },
 *     { label: 'Flow Type', value: 'Sub-kritis', status: 'safe' },
 *   ]}
 * />
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  subtitle,
  metrics,
  className = '',
  layout = 'grid',
}) => {
  const gridCols =
    layout === 'grid'
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2';

  return (
    <Card className={classNames('space-y-6', className)}>
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Metrics Grid */}
      <div className={classNames('grid gap-3 sm:gap-4', gridCols)}>
        {metrics.map((metric, index) => {
          const baseStyle = statusStyles[metric.status || 'neutral'];
          const textStyle = statusTextStyles[metric.status || 'neutral'];
          const isHighlight = metric.highlight;

          return (
            <div
              key={index}
              className={classNames(
                'p-3 sm:p-4 rounded-lg border transition-all hover:shadow-md',
                baseStyle,
                isHighlight ? 'ring-2 ring-offset-2 ring-primary-500' : undefined
              )}
            >
              {/* Icon */}
              {metric.icon && (
                <div className="mb-2 text-lg md:text-xl">{metric.icon}</div>
              )}

              {/* Label */}
              <p className="text-xs uppercase font-semibold text-slate-600 tracking-widest">
                {metric.label}
              </p>

              {/* Value */}
              <div className="mt-2">
                <p className={classNames('font-bold', textStyle)}>
                  <span className="text-xl sm:text-2xl">
                    {metric.value}
                  </span>
                  {metric.unit && (
                    <span className="text-xs sm:text-sm font-normal text-slate-600 ml-1">
                      {metric.unit}
                    </span>
                  )}
                </p>
              </div>

              {/* Status indicator */}
              {metric.status && metric.status !== 'neutral' && (
                <div className="mt-2 pt-2 border-t border-opacity-20">
                  <Badge
                    variant={
                      metric.status === 'critical' ? 'danger'
                      : metric.status === 'safe' ? 'success'
                      : metric.status === 'warning' ? 'warning'
                      : 'primary'
                    }
                    size="sm"
                    className="w-full justify-center"
                  >
                    {metric.status === 'safe' && '✓ Aman'}
                    {metric.status === 'warning' && '⚠ Waspada'}
                    {metric.status === 'critical' && '✕ Kritis'}
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default SummaryCard;
