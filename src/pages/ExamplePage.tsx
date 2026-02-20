import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import InputField from '../components/ui/InputField';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import { Calculator } from 'lucide-react';

interface CalculationResult {
  parameter: string;
  value: number;
  unit: string;
  status: string;
}

export default function ExamplePage() {
  const [formData, setFormData] = useState({
    area: '',
    rainfall: '',
    runoffCoef: '',
  });
  
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = () => {
    setIsCalculating(true);
    
    // Simulasi perhitungan
    setTimeout(() => {
      const area = parseFloat(formData.area);
      const rainfall = parseFloat(formData.rainfall);
      const runoffCoef = parseFloat(formData.runoffCoef);
      
      const discharge = (runoffCoef * rainfall * area) / 3.6;
      
      setResults([
        { parameter: 'Luas DAS', value: area, unit: 'ha', status: 'Valid' },
        { parameter: 'Intensitas Hujan', value: rainfall, unit: 'mm/jam', status: 'Valid' },
        { parameter: 'Koefisien Limpasan', value: runoffCoef, unit: '-', status: 'Valid' },
        { parameter: 'Debit Banjir Rencana', value: discharge, unit: 'm³/s', status: 'Sesuai SNI' },
      ]);
      
      setIsCalculating(false);
    }, 1000);
  };

  const columns = [
    { key: 'parameter', header: 'Parameter', align: 'left' as const },
    { 
      key: 'value', 
      header: 'Nilai', 
      align: 'right' as const,
      render: (row: CalculationResult) => row.value.toFixed(3)
    },
    { key: 'unit', header: 'Satuan', align: 'center' as const },
    { 
      key: 'status', 
      header: 'Status', 
      align: 'center' as const,
      render: (row: CalculationResult) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium
          ${row.status === 'Sesuai SNI' ? 'bg-success/10 text-success' : 'bg-primary-50 text-primary-700'}`}>
          {row.status}
        </span>
      )
    },
  ];

  return (
    <MainLayout title="Contoh Perhitungan">
      <div className="space-y-6">
        {/* Input Form */}
        <Card 
          title="Input Parameter" 
          subtitle="Masukkan data untuk perhitungan debit banjir metode rasional"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Luas Daerah Aliran Sungai (DAS)"
              type="number"
              step="0.01"
              unit="ha"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              helperText="Luas DAS maksimal 5000 ha untuk metode rasional"
              required
            />
            
            <InputField
              label="Intensitas Hujan"
              type="number"
              step="0.01"
              unit="mm/jam"
              value={formData.rainfall}
              onChange={(e) => setFormData({ ...formData, rainfall: e.target.value })}
              helperText="Intensitas hujan rencana periode ulang"
              required
            />
            
            <InputField
              label="Koefisien Limpasan (C)"
              type="number"
              step="0.01"
              unit="-"
              value={formData.runoffCoef}
              onChange={(e) => setFormData({ ...formData, runoffCoef: e.target.value })}
              helperText="Nilai C antara 0.1 - 0.9 sesuai jenis tutupan lahan"
              required
            />
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button
              variant="primary"
              onClick={handleCalculate}
              isLoading={isCalculating}
              disabled={!formData.area || !formData.rainfall || !formData.runoffCoef}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Hitung Debit
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setFormData({ area: '', rainfall: '', runoffCoef: '' });
                setResults([]);
              }}
            >
              Reset
            </Button>
          </div>
        </Card>

        {/* Results Table */}
        {results.length > 0 && (
          <DataTable
            caption="Hasil Perhitungan - Metode Rasional (SNI 2415:2016)"
            columns={columns}
            data={results}
          />
        )}

        {/* Info Card */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-1">
                Metode Rasional
              </h4>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Metode ini digunakan untuk menghitung debit banjir rencana pada DAS dengan luas kurang dari 5000 ha. 
                Rumus: Q = 0.278 × C × I × A, dimana Q adalah debit (m³/s), C adalah koefisien limpasan, 
                I adalah intensitas hujan (mm/jam), dan A adalah luas DAS (km²).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
