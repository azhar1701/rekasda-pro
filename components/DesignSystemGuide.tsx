import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardData, SectionCard } from './ui/CardNew';
import { Button } from './ui/Button';
import { PageHeader, PageContent, Section, ContentGrid } from './ui/Layout';
import { EmptyState } from './ui/EmptyState';
import { Input } from './ui/InputNew';

/**
 * DESIGN SYSTEM EXAMPLE & REFACTORING GUIDE
 * 
 * This component demonstrates how to refactor components following the B2B SaaS guidelines:
 * 1. Use Card components for content grouping
 * 2. Implement clear visual hierarchy with CardData components
 * 3. Use proper spacing and padding
 * 4. Add meaningful icons and visual indicators
 * 5. Ensure accessibility with proper contrast and labels
 * 6. Provide loading and empty states
 */

export const DesignSystemGuidance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'layout' | 'spacing'>('cards');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <PageHeader
        title="Design System Guidance"
        subtitle="B2B SaaS Component Patterns"
        description="Complete reference for refactoring components to follow the modern design system"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Guidelines' },
        ]}
      />

      <PageContent maxWidth="2xl">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-slate-200">
          {(['cards', 'layout', 'spacing'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Cards Tab */}
        {activeTab === 'cards' && (
          <Section title="Card Components" spacing="spacious">
            {/* Basic Card */}
            <div className="mb-12">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Basic Card</h3>
              <Card>
                <CardHeader divider>
                  <CardTitle subtitle="Essential container for content">Basic Card Title</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Use the basic card for general content grouping. It provides subtle shadows and borders for visual separation.
                  </p>
                </CardContent>
              </Card>

              {/* Code Example */}
              <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-xs font-mono">
                <pre>{`<Card>
  <CardHeader divider>
    <CardTitle subtitle="Optional subtitle">Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>`}</pre>
              </div>
            </div>

            {/* Data Display Card */}
            <div className="mb-12">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Data Display (Metrics)</h3>
              <ContentGrid columns={3}>
                <CardData
                  label="Total Discharge"
                  value="245.8"
                  unit="m³/s"
                  highlight
                  icon={
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1z" />
                    </svg>
                  }
                />
                <CardData
                  label="Average Slope"
                  value="0.0025"
                  unit="m/m"
                  comparison="Within safe range"
                />
                <CardData
                  label="Data Points"
                  value="156"
                  icon={
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM15 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z" />
                    </svg>
                  }
                />
              </ContentGrid>

              {/* Code Example */}
              <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-xs font-mono">
                <pre>{`<CardData
  label="Discharge"
  value="245.8"
  unit="m³/s"
  highlight={true}
  icon={<Icon />}
/>`}</pre>
              </div>
            </div>

            {/* Section Card */}
            <div className="mb-12">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Section Card (with Action)</h3>
              <SectionCard
                title="Channel Configuration"
                subtitle="Edit channel properties"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 0v2m0-6v2m0 0a2 2 0 100 4m0-4a2 2 0 110 4m0 0v2m0-6v2" />
                  </svg>
                }
                action={
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                }
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Channel Name
                    </label>
                    <Input placeholder="e.g., Sekunder Soreang" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Channel Shape
                    </label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                      <option>Rectangular</option>
                      <option>Trapezoidal</option>
                      <option>Circular</option>
                    </select>
                  </div>
                </div>
              </SectionCard>

              {/* Code Example */}
              <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-xs font-mono">
                <pre>{`<SectionCard
  title="Configuration"
  icon={<Icon />}
  action={<Button>Edit</Button>}
>
  {/* Content here */}
</SectionCard>`}</pre>
              </div>
            </div>

            {/* Empty State */}
            <div className="mb-12">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Empty State</h3>
              <Card>
                <EmptyState
                  title="No Calculations Yet"
                  description="Start by creating your first channel or rational analysis"
                  actions={[
                    { label: '+ Create Calculation', onClick: () => {}, variant: 'primary' },
                    { label: 'Load Sample Data', onClick: () => {}, variant: 'outline' },
                  ]}
                />
              </Card>

              {/* Code Example */}
              <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-xs font-mono">
                <pre>{`<EmptyState
  illustration="database"
  title="No Data"
  description="Create your first..."
  actions={[
    { label: 'Create', onClick: ... },
  ]}
/>`}</pre>
              </div>
            </div>
          </Section>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <Section title="Layout Patterns" spacing="spacious">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Two-Column Grid</h3>
                <ContentGrid columns={2} gap="lg">
                  <Card>
                    <CardHeader divider>
                      <CardTitle>Left Column</CardTitle>
                    </CardHeader>
                    <CardContent>Example content for left column</CardContent>
                  </Card>
                  <Card>
                    <CardHeader divider>
                      <CardTitle>Right Column</CardTitle>
                    </CardHeader>
                    <CardContent>Example content for right column</CardContent>
                  </Card>
                </ContentGrid>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Three-Column Grid (Responsive)</h3>
                <ContentGrid columns={3} gap="md">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader divider>
                        <CardTitle>Column {i}</CardTitle>
                      </CardHeader>
                      <CardContent>Responsive grid that stacks on mobile</CardContent>
                    </Card>
                  ))}
                </ContentGrid>
              </div>
            </div>
          </Section>
        )}

        {/* Spacing Tab */}
        {activeTab === 'spacing' && (
          <Section title="Spacing & Whitespace" spacing="spacious">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 text-base">Spacing Scale</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { name: 'Compact', value: 'p-3', px: '12px' },
                    { name: 'Normal', value: 'p-6', px: '24px' },
                    { name: 'Large', value: 'p-8', px: '32px' },
                  ].map((space) => (
                    <Card key={space.name}>
                      <div className={`bg-primary-50 rounded-lg mb-3 ${space.value}`}>
                        <div className="bg-primary-200 h-12 rounded flex items-center justify-center text-xs font-mono text-primary-900">
                          {space.px}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{space.name}</p>
                      <p className="text-xs text-slate-500">{space.value}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 text-base">Gap Sizes</h3>
                <div className="space-y-4">
                  <Card variant="subtle">
                    <p className="text-sm text-slate-600 mb-2">Small Gap (gap-3): 12px</p>
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-primary-200 rounded" />
                      <div className="w-12 h-12 bg-primary-200 rounded" />
                      <div className="w-12 h-12 bg-primary-200 rounded" />
                    </div>
                  </Card>
                  <Card variant="subtle">
                    <p className="text-sm text-slate-600 mb-2">Medium Gap (gap-6): 24px</p>
                    <div className="flex gap-6">
                      <div className="w-12 h-12 bg-primary-200 rounded" />
                      <div className="w-12 h-12 bg-primary-200 rounded" />
                      <div className="w-12 h-12 bg-primary-200 rounded" />
                    </div>
                  </Card>
                  <Card variant="subtle">
                    <p className="text-sm text-slate-600 mb-2">Large Gap (gap-8): 32px</p>
                    <div className="flex gap-8">
                      <div className="w-12 h-12 bg-primary-200 rounded" />
                      <div className="w-12 h-12 bg-primary-200 rounded" />
                      <div className="w-12 h-12 bg-primary-200 rounded" />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Principles */}
        <Section title="Key Principles" spacing="spacious">
          <ContentGrid columns={2} gap="md">
            <Card variant="elevated">
              <CardHeader divider>
                <CardTitle icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }>
                  Whitespace First
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Increase padding and margins. Content should breathe. Avoid dense clusters of information.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader divider>
                <CardTitle icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }>
                  Visual Hierarchy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Most important data should be largest. Use size, color, and spacing to guide attention.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader divider>
                <CardTitle icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }>
                  Contrast & Readability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Use slate-800 for headings, slate-500 for secondary. Never pure black. Ensure 4.5:1 contrast ratio.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader divider>
                <CardTitle icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }>
                  User Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Every action needs feedback. Show loading states, toast notifications, and empty states.
                </p>
              </CardContent>
            </Card>
          </ContentGrid>
        </Section>

        {/* Migration Checklist */}
        <Section title="Refactoring Checklist" spacing="spacious">
          <Card>
            <CardContent>
              <div className="space-y-3">
                {[
                  'Replace old Card with new Card/CardHeader/CardContent components',
                  'Use CardData for metrics/KPI displays',
                  'Add proper spacing: p-6 (md) or p-8 (lg)',
                  'Use rounded-2xl for modern feel',
                  'Implement ContentGrid for responsive layouts',
                  'Add meaningful icons to section titles',
                  'Include proper empty states with actions',
                  'Ensure accessibility with proper contrast ratios',
                  'Add loading skeletons for async operations',
                  'Use primary-500 for primary actions only',
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <input
                      type="checkbox"
                      className="mt-1 w-5 h-5 rounded border-slate-200 text-primary-600"
                    />
                    <label className="text-sm text-slate-800">{item}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>
      </PageContent>
    </div>
  );
};

export default DesignSystemGuidance;
