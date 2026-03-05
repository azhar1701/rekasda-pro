with open("src/components/ui/data-display/FormulaAccordion.tsx", "w") as f:
    f.write("""import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface FormulaParameter {
  symbol: string;
  description: string;
  unit: string;
}

interface FormulaAccordionProps {
  title: string;
  subtitle: string;
  theme?: 'blue' | 'emerald' | 'purple' | 'amber' | 'slate';
  formulas: {
    label: string;
    math: string;
  }[];
  parameters: FormulaParameter[];
  reference: string;
  defaultExpanded?: boolean;
}

export const FormulaAccordion: React.FC<FormulaAccordionProps> = ({
  title,
  subtitle,
  theme = 'blue',
  formulas,
  parameters,
  reference,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const themeClasses = {
    blue: {
      border: 'border-blue-200',
      bgHeaderHover: 'hover:bg-blue-50',
      iconBg: 'bg-blue-600',
      textMain: 'text-blue-900',
      textSub: 'text-blue-600',
      textLink: 'text-blue-700',
      contentBg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      cardBg: 'bg-white',
      cardBorder: 'border-blue-200',
      codeBg: 'bg-blue-50',
      codeBorder: 'border-blue-200',
      paramBg: 'bg-blue-100',
      refBg: 'bg-blue-100',
      refBorder: 'border-blue-300',
      refText: 'text-blue-800'
    },
    emerald: {
      border: 'border-emerald-200',
      bgHeaderHover: 'hover:bg-emerald-50',
      iconBg: 'bg-emerald-600',
      textMain: 'text-emerald-900',
      textSub: 'text-emerald-600',
      textLink: 'text-emerald-700',
      contentBg: 'bg-gradient-to-br from-emerald-50 to-green-50',
      cardBg: 'bg-white',
      cardBorder: 'border-emerald-200',
      codeBg: 'bg-emerald-50',
      codeBorder: 'border-emerald-200',
      paramBg: 'bg-emerald-100',
      refBg: 'bg-emerald-100',
      refBorder: 'border-emerald-300',
      refText: 'text-emerald-800'
    },
    purple: {
      border: 'border-purple-200',
      bgHeaderHover: 'hover:bg-purple-50',
      iconBg: 'bg-purple-600',
      textMain: 'text-purple-900',
      textSub: 'text-purple-600',
      textLink: 'text-purple-700',
      contentBg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50',
      cardBg: 'bg-white',
      cardBorder: 'border-purple-200',
      codeBg: 'bg-purple-50',
      codeBorder: 'border-purple-200',
      paramBg: 'bg-purple-100',
      refBg: 'bg-purple-100',
      refBorder: 'border-purple-300',
      refText: 'text-purple-800'
    },
    amber: {
      border: 'border-amber-200',
      bgHeaderHover: 'hover:bg-amber-50',
      iconBg: 'bg-amber-600',
      textMain: 'text-amber-900',
      textSub: 'text-amber-600',
      textLink: 'text-amber-700',
      contentBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      cardBg: 'bg-white',
      cardBorder: 'border-amber-200',
      codeBg: 'bg-amber-50',
      codeBorder: 'border-amber-200',
      paramBg: 'bg-amber-100',
      refBg: 'bg-amber-100',
      refBorder: 'border-amber-300',
      refText: 'text-amber-800'
    },
    slate: {
      border: 'border-slate-200',
      bgHeaderHover: 'hover:bg-slate-50',
      iconBg: 'bg-slate-600',
      textMain: 'text-slate-900',
      textSub: 'text-slate-600',
      textLink: 'text-slate-700',
      contentBg: 'bg-gradient-to-br from-slate-50 to-gray-50',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200',
      codeBg: 'bg-slate-50',
      codeBorder: 'border-slate-200',
      paramBg: 'bg-slate-100',
      refBg: 'bg-slate-100',
      refBorder: 'border-slate-300',
      refText: 'text-slate-800'
    }
  };

  const t = themeClasses[theme];

  return (
    <div className={`bg-white border-2 ${t.border} rounded-xl overflow-hidden shadow-sm`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${t.bgHeaderHover} transition-colors focus:outline-none`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${t.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <Info className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className={`text-sm font-bold ${t.textMain}`}>{title}</h3>
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${t.textSub}`}>{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${t.textLink} hidden sm:inline-block`}>{isExpanded ? 'Tutup Rumus' : 'Lihat Rumus'}</span>
          {isExpanded ? (
            <ChevronUp className={`w-4 h-4 ${t.textSub}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${t.textSub}`} />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className={`border-t-2 ${t.border} p-4 sm:p-5 ${t.contentBg} space-y-4 animate-in fade-in slide-in-from-top-2 duration-300`}>
          
          {/* Formulas */}
          <div className={`rounded-xl p-4 border ${t.cardBorder} bg-white shadow-sm`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${t.textLink} mb-3 flex items-center gap-2`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              Persamaan Matematis
            </p>
            <div className="space-y-3">
              {formulas.map((f, i) => (
                <div key={i} className={`rounded-lg p-3 border ${t.codeBorder} ${t.codeBg}`}>
                  <p className={`text-[10px] font-bold ${t.textSub} mb-1 uppercase tracking-wider`}>{f.label}</p>
                  <div className="overflow-x-auto overflow-y-hidden py-2 scrollbar-hide flex justify-center">
                    <BlockMath math={f.math} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className={`rounded-xl p-4 border ${t.cardBorder} bg-white shadow-sm`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${t.textLink} mb-3 flex items-center gap-2`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Keterangan Variabel
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {parameters.map((p, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs p-1.5 hover:bg-slate-50 rounded-md transition-colors">
                  <div className={`flex-shrink-0 ${t.paramBg} px-2 py-1 rounded text-center min-w-[2.5rem] border border-white shadow-sm`}>
                    <InlineMath math={p.symbol} />
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="text-slate-700 font-medium leading-tight">{p.description}</span>
                    <span className="text-slate-400 font-bold text-[10px]">{p.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reference */}
          {reference && (
            <div className={`rounded-xl p-3 border ${t.refBorder} ${t.refBg} shadow-inner`}>
              <p className={`text-xs ${t.refText} flex items-center gap-2`}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="curr
