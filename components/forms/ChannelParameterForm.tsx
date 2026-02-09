/**
 * Channel Parameter Form Component
 * Grouped form for Manning channel inputs with validation
 */

import React from 'react';
import { ManningInputs, ChannelShape } from '../../types';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { classNames } from '../../utils/classNames';

interface ChannelParameterFormProps {
  inputs: ManningInputs;
  errors: Record<string, string>;
  onChange: (field: keyof ManningInputs, value: any) => void;
  disabled?: boolean;
}

const channelShapeOptions = [
  {
    value: ChannelShape.TRAPEZOID,
    label: '▄ Trapezoid (Saluran Tanah)',
  },
  {
    value: ChannelShape.CIRCULAR,
    label: '◯ Circular (Pipa/Saluran Tertutup)',
  },
];

/**
 * Grouped form for channel geometry and properties
 * Organizes inputs logically for better UX
 */
export const ChannelParameterForm: React.FC<ChannelParameterFormProps> = ({
  inputs,
  errors,
  onChange,
  disabled = false,
}) => {
  const isTrapezoid = inputs.shape === ChannelShape.TRAPEZOID;

  return (
    <div className="space-y-6">
      {/* ===== GROUP 1: CHANNEL TYPE SELECTION ===== */}
      <Card>
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              1. Jenis Saluran
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Pilih tipe penampang saluran Anda
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {channelShapeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange('shape', option.value)}
                disabled={disabled}
                className={classNames(
                  'relative p-4 border-2 rounded-lg font-medium transition-all text-left',
                  inputs.shape === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={inputs.shape === option.value}
                    onChange={() => onChange('shape', option.value)}
                    disabled={disabled}
                    className="w-4 h-4"
                  />
                  <span>{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ===== GROUP 2: GEOMETRIC PARAMETERS ===== */}
      <Card>
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              2. Parameter Geometri
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Dimensi fisik penampang saluran
            </p>
          </div>

          {/* Trapezoid Section */}
          {isTrapezoid && (
            <div className="space-y-4">
              {/* Bottom Width */}
              <FormField
                label="Lebar Dasar (Bottom Width)"
                unit="m"
                required
                hint="Lebar dasar penampang saluran"
                error={errors.width}
              >
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={inputs.width || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange('width', parseFloat(e.target.value) || 0)
                  }
                  disabled={disabled}
                  placeholder="2.0"
                />
              </FormField>

              {/* Water Depth */}
              <FormField
                label="Kedalaman Air (Water Depth)"
                unit="m"
                required
                hint="Jarak vertikal dari dasar hingga permukaan air"
                error={errors.depth}
              >
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={inputs.depth || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange('depth', parseFloat(e.target.value) || 0)
                  }
                  disabled={disabled}
                  placeholder="1.0"
                />
              </FormField>

              {/* Side Slope */}
              <FormField
                label="Kemiringan Tebing (Side Slope)"
                unit="h:1"
                required
                hint='Rasio horizontal:vertikal (contoh: 0.5 = 0.5:1 atau 1:2)'
                error={errors.sideSlope}
              >
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={inputs.sideSlope || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange('sideSlope', parseFloat(e.target.value) || 0)
                  }
                  disabled={disabled}
                  placeholder="0.5"
                />
              </FormField>

              {/* Top Width Display */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Lebar Atas (Calculated)
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {inputs.topWidth?.toFixed(3) || '0.000'} <span className="text-sm font-normal">m</span>
                </p>
              </div>
            </div>
          )}

          {/* Circular Section */}
          {!isTrapezoid && (
            <FormField
              label="Diameter (Pipe Diameter)"
              unit="m"
              required
              hint="Diameter dalam pipa/saluran tertutup"
              error={errors.diameter}
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                value={inputs.diameter || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange('diameter', parseFloat(e.target.value) || 0)
                }
                disabled={disabled}
                placeholder="1.0"
              />
            </FormField>
          )}
        </div>
      </Card>

      {/* ===== GROUP 3: HYDRAULIC PROPERTIES ===== */}
      <Card>
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              3. Parameter Hidraulik
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Karakteristik aliran dan material
            </p>
          </div>

          {/* Slope */}
          <FormField
            label="Kemiringan Dasar (Channel Slope)"
            unit="m/m"
            required
            hint="Kemiringan memanjang saluran (0.0001 - 0.1 typical)"
            error={errors.slope}
          >
            <Input
              type="number"
              step="0.0001"
              min="0"
              max="1"
              value={inputs.slope || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('slope', parseFloat(e.target.value) || 0)}
              disabled={disabled}
              placeholder="0.001"
            />
          </FormField>

          {/* Manning Coefficient */}
          <FormField
            label="Koefisien Manning (Roughness)"
            unit="n"
            required
            hint="Nilai tipis 0.015-0.035 untuk saluran alami"
            error={errors.roughness}
          >
            <Input
              type="number"
              step="0.001"
              min="0"
              max="0.15"
              value={inputs.roughness || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange('roughness', parseFloat(e.target.value) || 0)
              }
              disabled={disabled}
              placeholder="0.025"
            />
          </FormField>

          {/* Warning Messages */}
          {inputs.slope > 0.1 && (
            <Alert type="warning" className="text-sm" message="⚠️ Kemiringan sangat curam (S > 0.1). Pemeriksaan ulang diperlukan." />
          )}

          {inputs.roughness < 0.010 && inputs.roughness > 0 && (
            <Alert type="info" className="text-sm" message="ℹ️ Koefisien Manning sangat rendah. Pastikan material permukaan sangat halus." />
          )}
        </div>
      </Card>
    </div>
  );
};

export default ChannelParameterForm;
