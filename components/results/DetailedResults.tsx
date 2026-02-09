/**
 * Detailed Results Component
 * Display comprehensive calculation results in organized sections
 */

import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { classNames } from '../../utils/classNames';

interface ResultItem {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  highlight?: boolean;
}

interface ResultSection {
  title: string;
  icon?: string;
  items: ResultItem[];
  color?: 'blue' | 'green' | 'amber' | 'slate';
}

interface DetailedResultsProps {
  title: string;
  sections: ResultSection[];
  className?: string;
  printable?: boolean;
}

const sectionColorStyles = {
  blue: 'border-l-4 border-primary-500 bg-primary-50',
  green: 'border-l-4 border-success-500 bg-success-50',
  amber: 'border-l-4 border-warning-500 bg-warning-50',
  slate: 'border-l-4 border-slate-400 bg-slate-50',
};

const sectionHeaderStyles = {
  blue: 'text-primary-900',
  green: 'text-success-900',
  amber: 'text-warning-900',
  slate: 'text-slate-900',
};

/**
 * Detailed results component with tabbed sections
 * @example
 * <DetailedResults
 *   title="Manning Calculation Details"
 *   sections={[
 *     {
 *       title: 'Geometry',
 *       color: 'blue',
 *       items: [
 *         { label: 'Cross-sectional Area', value: 4.23, unit: 'm²' },
 *         { label: 'Wetted Perimeter', value: 6.12, unit: 'm' },
 *       ]
 *     }
 *   ]}
 * />
 */
export const DetailedResults: React.FC<DetailedResultsProps> = ({
  title,
  sections,
  className = '',
  printable = true,
}) => {
  const [expandedSection, setExpandedSection] = useState<number>(0);

  const tabs = sections.map((section) => ({
    id: section.title.toLowerCase().replace(/\s+/g, '-'),
    label: section.title,
    icon: section.icon,
  }));

  return (
    <div className={classNames('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        </div>
        {printable && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Print results"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9m4 0h4m-2-2v2m-6-4v2"
              />
            </svg>
            Cetak
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={expandedSection} onChange={setExpandedSection}>
        {/* Tab Content */}
        {sections.map((section, index) => (
          <div
            key={index}
            className={classNames(
              expandedSection === index ? 'block' : 'hidden',
              'space-y-3 animate-fade-in'
            )}
          >
            {section.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className={classNames(
                  'p-4 rounded-lg',
                  sectionColorStyles[section.color || 'slate']
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <label
                    className={classNames(
                      'font-semibold text-sm',
                      sectionHeaderStyles[section.color || 'slate']
                    )}
                  >
                    {item.label}
                  </label>
                  {item.highlight && (
                    <Badge variant="primary" size="sm">
                      ★ Key Value
                    </Badge>
                  )}
                </div>

                {/* Value */}
                <div className="mt-2">
                  <p className={classNames('text-lg font-bold', sectionHeaderStyles[section.color || 'slate'])}>
                    {item.value}
                    {item.unit && (
                      <span className="text-sm font-normal text-slate-600 ml-1">
                        {item.unit}
                      </span>
                    )}
                  </p>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-slate-600 mt-2 italic">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ))}
      </Tabs>

      {/* Export & Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button className="flex-1 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors">
          📥 Download PDF
        </button>
        <button className="flex-1 px-4 py-2 bg-slate-100 text-slate-900 font-medium rounded-lg hover:bg-slate-200 transition-colors">
          📋 Copy to Clipboard
        </button>
      </div>
    </div>
  );
};

export default DetailedResults;
