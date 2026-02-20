import { Card, InputField, Button } from '@/components/ui';

/**
 * EXAMPLE: Production-Grade Card Component
 * 
 * BEFORE:
 * - Inconsistent padding (16px, 20px, 24px)
 * - Random gaps between elements
 * - Mixed font sizes
 * - Varying input heights
 * 
 * AFTER:
 * - Consistent 24px padding
 * - 16px gaps between elements
 * - Typography scale applied
 * - All inputs 44px height
 */

export default function PolishedInputCard() {
  return (
    <Card 
      title="Input Parameter Teknis"
      subtitle="Masukkan data untuk perhitungan hidrolik"
    >
      {/* Content with consistent 16px vertical gaps */}
      <div className="space-y-4">
        
        {/* Input group with 12px label-to-input gap */}
        <InputField
          label="Luas Daerah Aliran Sungai"
          type="number"
          unit="ha"
          helperText="Luas DAS maksimal 5000 ha untuk metode rasional"
          placeholder="0.00"
          required
        />

        <InputField
          label="Intensitas Hujan"
          type="number"
          unit="mm/jam"
          helperText="Intensitas hujan rencana periode ulang"
          placeholder="0.00"
          required
        />

        <InputField
          label="Koefisien Limpasan (C)"
          type="number"
          unit="-"
          helperText="Nilai C antara 0.1 - 0.9 sesuai jenis tutupan lahan"
          placeholder="0.00"
          required
        />

        {/* Button group with 12px gap */}
        <div className="flex gap-3 pt-2">
          <Button variant="primary" size="md">
            Hitung Debit
          </Button>
          <Button variant="outline" size="md">
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * SPACING BREAKDOWN:
 * 
 * Card:
 * - Header padding: 24px horizontal, 20px vertical
 * - Content padding: 24px all sides
 * - Border radius: 12px
 * 
 * Content:
 * - Element gaps: 16px (space-y-4)
 * - Button gap: 12px (gap-3)
 * 
 * Input Fields:
 * - Label to input: 12px (space-y-3)
 * - Input height: 44px (h-11)
 * - Input padding: 16px horizontal
 * - Helper text gap: 12px
 * 
 * Typography:
 * - Card title: text-h3 (22px, semibold)
 * - Card subtitle: text-body (15px, normal)
 * - Input label: text-label (13px, semibold, uppercase)
 * - Helper text: text-caption (11px, medium)
 * - Button text: text-base (15px, semibold)
 * 
 * VISUAL RESULT:
 * - Clean, breathable layout
 * - Perfect alignment on 8px grid
 * - Clear visual hierarchy
 * - Consistent touch targets (44px)
 * - Professional, polished appearance
 */
