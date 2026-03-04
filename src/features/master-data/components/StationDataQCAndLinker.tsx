import React, { useState, useMemo } from 'react';
import { useHydrologyStore, QualityControlResults } from '../../../stores/useHydrologyStore';
import { performQualityControl } from '../../../services/qualityControlService';
import { CardGovTech, CardGovTechContent } from '../../../components/ui/CardGovTech';
import { TableGovTech } from '../../../components/ui/TableGovTech';
import { ButtonGovTech } from '../../../components/ui/ButtonGovTech';

interface AnnualMaxData {
  year: number;
  maxRainfall: number;
  date: string;
}

export const StationDataQCAndLinker: React.FC = () => {
  const { stasiunList, dataHujan, setAnalisisFrekuensi } = useHydrologyStore();
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [qcResults, setQcResults] = useState<QualityControlResults | null>(null);
  const [isExported, setIsExported] = useState(false);

  // Get selected station
  const selectedStation = useMemo(() => 
    stasiunList.find(s => s.id === selectedStationId) || null
  , [stasiunList, selectedStationId]);

  // Calculate annual maximum series for the selected station
  const annualMaxSeries = useMemo<AnnualMaxData[]>(() => {
    if (!selectedStationId || !dataHujan.length) return [];

    const stationData = dataHujan.filter(d => d.stasiun_id === selectedStationId);
    
    // Group by year
    const byYear = stationData.reduce((acc, curr) => {
      const year = new Date(curr.tanggal).getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(curr);
      return acc;
    }, {} as Record<number, typeof dataHujan>);

    // Find max per year
    const maxSeries: AnnualMaxData[] = Object.entries(byYear).map(([yearStr, records]) => {
      const maxRecord = records.reduce((max, current) => 
        current.curah_hujan > max.curah_hujan ? current : max
      , records[0]);

      return {
        year: parseInt(yearStr, 10),
        maxRainfall: maxRecord.curah_hujan,
        date: maxRecord.tanggal
      };
    });

    // Sort by year ascending
    return maxSeries.sort((a, b) => a.year - b.year);
  }, [selectedStationId, dataHujan]);

  const handleRunQC = () => {
    if (!annualMaxSeries.length) return;
    
    const rainfallValues = annualMaxSeries.map(d => d.maxRainfall);
    const results = performQualityControl(rainfallValues);
    setQcResults(results);
    setIsExported(false);
  };

  const handleExportToDistribution = () => {
    if (!annualMaxSeries.length) return;
    
    const rainfallValues = annualMaxSeries.map(d => d.maxRainfall);
    
    // Link to frequency analysis store
    setAnalisisFrekuensi({
      parameterStatistik: null,
      hasilDistribusi: null,
      ujiKecocokan: null,
      metodeTerpilih: null,
      dataHujanInput: rainfallValues
    });
    
    setIsExported(true);
  };

  const stationColumns = [
    { key: 'nama_stasiun', label: 'Nama Stasiun', align: 'left' as const },
    { key: 'elevasi', label: 'Elevasi (m)', align: 'right' as const, numeric: true },
    { key: 'action', label: 'Aksi', align: 'center' as const }
  ];

  const stationTableData = stasiunList.map(station => ({
    ...station,
    action: (
      <ButtonGovTech 
        size="sm" 
        variant={selectedStationId === station.id ? 'pupr-accent' : 'secondary'}
        onClick={() => {
          setSelectedStationId(station.id);
          setQcResults(null);
          setIsExported(false);
        }}
      >
        {selectedStationId === station.id ? 'Terpilih' : 'Pilih'}
      </ButtonGovTech>
    )
  }));

  const rainfallColumns = [
    { key: 'year', label: 'Tahun', align: 'center' as const },
    { key: 'date', label: 'Tanggal Kejadian', align: 'center' as const },
    { key: 'maxRainfall', label: 'Hujan Maksimum (mm)', align: 'right' as const, numeric: true }
  ];

  const rainfallTableData = annualMaxSeries.map(d => ({
    year: d.year,
    date: new Date(d.date).toLocaleDateString('id-ID'),
    maxRainfall: d.maxRainfall.toFixed(2)
  }));

  return (
    <div className="space-y-6">
      <CardGovTech 
        title="Pilih Stasiun Hujan" 
        subtitle="Pilih stasiun untuk melihat seri data hujan maksimum tahunan"
      >
        <CardGovTechContent>
          {stasiunList.length > 0 ? (
            <TableGovTech 
              columns={stationColumns} 
              data={stationTableData} 
            />
          ) : (
            <div className="text-center py-8 text-slate-500">
              Belum ada data stasiun. Silakan tambahkan stasiun terlebih dahulu.
            </div>
          )}
        </CardGovTechContent>
      </CardGovTech>

      {selectedStation && (
        <CardGovTech 
          title={`Data Hujan Maksimum Tahunan: ${selectedStation.nama_stasiun}`}
          subtitle={`${annualMaxSeries.length} tahun data tersedia`}
        >
          <CardGovTechContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {annualMaxSeries.length > 0 ? (
                  <TableGovTech 
                    columns={rainfallColumns} 
                    data={rainfallTableData} 
                  />
                ) : (
                  <div className="text-center py-8 text-slate-500 border rounded-md">
                    Belum ada data hujan untuk stasiun ini.
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-3">Quality Control (QC)</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Lakukan uji kualitas data (Konsistensi, Homogenitas, Outlier) sebelum analisis frekuensi.
                  </p>
                  <ButtonGovTech 
                    fullWidth 
                    onClick={handleRunQC}
                    disabled={annualMaxSeries.length < 3}
                  >
                    Jalankan Uji QC
                  </ButtonGovTech>
                  
                  {annualMaxSeries.length < 3 && (
                    <p className="text-xs text-red-500 mt-2">
                      Minimal 3 tahun data diperlukan untuk QC.
                    </p>
                  )}
                </div>

                {qcResults && (
                  <div className={`p-4 rounded-md border ${qcResults.overallPassed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <h3 className={`font-semibold mb-2 ${qcResults.overallPassed ? 'text-green-800' : 'text-amber-800'}`}>
                      Hasil QC: {qcResults.overallPassed ? 'Lulus Semua Uji' : 'Perlu Perhatian'}
                    </h3>
                    <ul className="text-sm space-y-2">
                      <li className="flex justify-between">
                        <span>Konsistensi:</span>
                        <span className={qcResults.konsistensi.isPassed ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {qcResults.konsistensi.isPassed ? 'Lulus' : 'Gagal'}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Homogenitas:</span>
                        <span className={qcResults.homogenitas.isPassed ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {qcResults.homogenitas.isPassed ? 'Lulus' : 'Gagal'}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Outlier:</span>
                        <span className={qcResults.outlier.isPassed ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {qcResults.outlier.isPassed ? 'Lulus' : 'Gagal'}
                        </span>
                      </li>
                    </ul>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200/50">
                      <ButtonGovTech 
                        fullWidth 
                        variant={isExported ? 'secondary' : 'pupr-accent'}
                        onClick={handleExportToDistribution}
                      >
                        {isExported ? 'Telah Diekspor' : 'Gunakan untuk Analisis Frekuensi'}
                      </ButtonGovTech>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardGovTechContent>
        </CardGovTech>
      )}
    </div>
  );
};
