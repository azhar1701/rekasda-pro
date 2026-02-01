import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, ToggleButton, ToggleButtonGroup, Select, MenuItem, FormControl, InputLabel, Grid, Chip, IconButton, Collapse } from '@mui/material';
import { Calculate, Psychology, ExpandMore, ExpandLess } from '@mui/icons-material';
import { MANNING_ROUGHNESS } from '../constants';
import { calculateManning } from '../services/calculationService';
import { ManningInputs, CalculationType, ChannelShape } from '../types';
import { InputGroup } from './InputGroup';
import { Button } from './Button';
import { ChannelVisualizer } from './ChannelVisualizer';
import { FlowInsight } from './FlowInsight';
import { SiteIdentityForm } from './SiteIdentityForm';
import { SlopeCalculator } from './SlopeCalculator';
import { HelpTooltip } from './HelpTooltip';

interface Props {
  onSave: (type: CalculationType, inputs: ManningInputs, outputs: any) => void;
  onConsultAI: (inputs: ManningInputs, outputs: any) => void;
}

export const ManningCalculator: React.FC<Props> = ({ onSave, onConsultAI }) => {
  const [inputs, setInputs] = useState<ManningInputs>({
    site: { channelName: '', regency: '', district: '', village: '' },
    shape: ChannelShape.TRAPEZOID,
    roughness: 0.025,
    slope: 0.001,
    width: 2.0,
    topWidth: 2.5, 
    diameter: 1.0,
    depth: 1.0,
    totalDepth: 1.5,
    sideSlope: 0.1666, 
  });

  // const [errors, setErrors] = useState<Partial<Record<keyof ManningInputs, string>>>({});
  const [results, setResults] = useState<any>(null);
  const [showSlopeCalculator, setShowSlopeCalculator] = useState<boolean>(false);

  const loadPilotData = () => {
    setInputs({
      site: { channelName: 'Saluran Sekunder Soreang (Pilot)', regency: 'Kab. Bandung', district: 'Soreang', village: 'Soreang' },
      shape: ChannelShape.TRAPEZOID,
      roughness: 0.015,
      slope: 0.002,
      width: 1.2,
      topWidth: 2.0,
      diameter: 1.0,
      depth: 0.45,
      totalDepth: 1.0,
      sideSlope: 0.4,
    });
  };

  const updateGeometricParams = (newInputs: ManningInputs) => {
    if (newInputs.shape === ChannelShape.TRAPEZOID && newInputs.totalDepth > 0) {
      const b = newInputs.width;
      const B = newInputs.topWidth;
      const H = newInputs.totalDepth;
      newInputs.sideSlope = Math.max(0, (B - b) / (2 * H));
    }
    return newInputs;
  };

  const validate = (newInputs: ManningInputs) => {
    // const newErrors: Partial<Record<keyof ManningInputs, string>> = {};
    // if (newInputs.roughness <= 0) newErrors.roughness = "n > 0";
    // if (newInputs.slope <= 0) newErrors.slope = "S > 0";
    // setErrors(newErrors);
    // return Object.keys(newErrors).length === 0;
    return newInputs.roughness > 0 && newInputs.slope > 0;
  };

  const handleInputChange = (field: keyof ManningInputs, value: any) => {
    let updatedInputs = { ...inputs, [field]: value };
    if (field === 'width' || field === 'topWidth' || field === 'totalDepth') {
        updatedInputs = updateGeometricParams(updatedInputs);
    }
    setInputs(updatedInputs);
    validate(updatedInputs as ManningInputs);
  };

  useEffect(() => {
    if (validate(inputs)) setResults(calculateManning(inputs));
    else setResults(null);
  }, [inputs]);

  return (
    <Grid container spacing={3} sx={{ pb: 10 }}>
      {/* Left Column - Inputs */}
      <Grid item xs={12} lg={5}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Quick Action Mobile */}
          <Card sx={{ display: { xs: 'block', lg: 'none' }, position: 'sticky', top: 10, zIndex: 30 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Calculate color="primary" />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Aksi Cepat</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Isi Data Pilot</Typography>
                </Box>
              </Box>
              <Button onClick={loadPilotData} size="small">
                Load Data
              </Button>
            </CardContent>
          </Card>

          <SiteIdentityForm 
            value={inputs.site || { channelName: '', regency: '', district: '', village: '' }} 
            onChange={(s) => setInputs({...inputs, site: s})} 
          />
          
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Calculate color="primary" />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Parameter Hidrolis</Typography>
                    <Typography variant="caption" color="text.secondary">Dimensi Penampang</Typography>
                  </Box>
                </Box>
                <Button 
                  variant="outline" 
                  size="small" 
                  onClick={loadPilotData}
                  sx={{ display: { xs: 'none', lg: 'flex' } }}
                >
                  Load Pilot
                </Button>
              </Box>

              {/* Shape Toggle */}
              <ToggleButtonGroup
                value={inputs.shape}
                exclusive
                onChange={(e, value) => value && handleInputChange('shape', value)}
                fullWidth
                sx={{ mb: 3 }}
              >
                <ToggleButton value={ChannelShape.TRAPEZOID}>Trapesium</ToggleButton>
                <ToggleButton value={ChannelShape.CIRCULAR}>Lingkaran</ToggleButton>
              </ToggleButtonGroup>

              <Grid container spacing={2}>
                {inputs.shape === ChannelShape.TRAPEZOID ? (
                  <>
                    <Grid item xs={6}>
                      <InputGroup 
                        label="Lebar Bawah (b)" 
                        unit="m" 
                        value={inputs.width} 
                        onChange={e => handleInputChange('width', parseFloat(e.target.value)||0)} 
                        placeholder="1.5" 
                        helpText="Lebar dasar saluran pada bagian bawah" 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <InputGroup 
                        label="Lebar Atas (B)" 
                        unit="m" 
                        value={inputs.topWidth} 
                        onChange={e => handleInputChange('topWidth', parseFloat(e.target.value)||0)} 
                        placeholder="2.0" 
                        helpText="Lebar saluran pada permukaan air" 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <InputGroup 
                        label="Tinggi Total (H)" 
                        unit="m" 
                        value={inputs.totalDepth} 
                        onChange={e => handleInputChange('totalDepth', parseFloat(e.target.value)||0)} 
                        placeholder="1.5" 
                        helpText="Tinggi total saluran dari dasar ke puncak" 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <InputGroup 
                        label="Tinggi Air (h)" 
                        unit="m" 
                        value={inputs.depth} 
                        onChange={e => handleInputChange('depth', parseFloat(e.target.value)||0)} 
                        placeholder="0.8" 
                        helpText="Kedalaman air dalam saluran" 
                      />
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={6}>
                      <InputGroup 
                        label="Diameter (D)" 
                        unit="m" 
                        value={inputs.diameter} 
                        onChange={e => handleInputChange('diameter', parseFloat(e.target.value)||0)} 
                        placeholder="1.0" 
                        helpText="Diameter pipa/saluran lingkaran" 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <InputGroup 
                        label="Tinggi Air (h)" 
                        unit="m" 
                        value={inputs.depth} 
                        onChange={e => handleInputChange('depth', parseFloat(e.target.value)||0)} 
                        placeholder="0.8" 
                        helpText="Kedalaman air dalam pipa" 
                      />
                    </Grid>
                  </>
                )}
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <InputGroup 
                      label="Kemiringan Dasar (S)" 
                      unit="m/m" 
                      step="0.0001" 
                      value={inputs.slope} 
                      onChange={e => handleInputChange('slope', parseFloat(e.target.value)||0)} 
                      placeholder="0.002" 
                      description="Slope memanjang saluran" 
                      helpText="Kemiringan dasar saluran dalam arah aliran (rise/run)" 
                    />
                  </Box>
                  <IconButton 
                    onClick={() => setShowSlopeCalculator(!showSlopeCalculator)}
                    color="secondary"
                    sx={{ mb: 1 }}
                  >
                    {showSlopeCalculator ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
                
                <Collapse in={showSlopeCalculator}>
                  <Box sx={{ mt: 2 }}>
                    <SlopeCalculator 
                      onSlopeCalculated={(slope) => handleInputChange('slope', slope)}
                      onClose={() => setShowSlopeCalculator(false)}
                    />
                  </Box>
                </Collapse>
              </Box>
                
              <FormControl fullWidth sx={{ mt: 3 }}>
                <InputLabel>Kekasaran Manning (n)</InputLabel>
                <Select 
                  value={inputs.roughness} 
                  onChange={e => handleInputChange('roughness', parseFloat(e.target.value as string))}
                  label="Kekasaran Manning (n)"
                >
                  {MANNING_ROUGHNESS.map((m, i) => (
                    <MenuItem key={i} value={m.value}>
                      {m.name} (n={m.value})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Box>
      </Grid>

      {/* Right Column - Visualization & Results */}
      <Grid item xs={12} lg={7}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: { lg: 'sticky' }, top: { lg: 3 } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Visualisasi Penampang</Typography>
                {results && (
                  <Chip 
                    label={`Status: ${results.SafetyStatus}`}
                    color={results.SafetyStatus === 'Aman' ? 'success' : 'error'}
                    size="small"
                  />
                )}
              </Box>
              <ChannelVisualizer inputs={inputs} results={results} />
            </CardContent>
          </Card>

          {results && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FlowInsight discharge={parseFloat(results.Discharge)} velocity={parseFloat(results.Velocity)} type="MANNING" />
              
              <Card>
                <CardContent>
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 3 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: 'text.secondary' }}>Kapasitas Debit (Q)</Typography>
                          <HelpTooltip content="Volume air yang mengalir per satuan waktu melalui penampang saluran" />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                          <Typography variant="h2" sx={{ fontWeight: 800, mr: 1 }}>{results.Discharge}</Typography>
                          <Typography variant="h5" color="text.secondary">m³/s</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: 110 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Kecepatan (V)</Typography>
                            <HelpTooltip content="Kecepatan rata-rata aliran air dalam saluran" />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>{results.Velocity} <Typography component="span" variant="caption" color="text.secondary">m/s</Typography></Typography>
                        </Card>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: 110 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Froude (Fr)</Typography>
                            <HelpTooltip content="Bilangan Froude menunjukkan tipe aliran: <1 subkritis, >1 superkritis" />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: results.FlowType === 'Super-kritis' ? 'error.main' : 'success.main' }}>{results.Froude}</Typography>
                        </Card>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    {[
                      { label: 'Luas Basah (A)', val: results.Area, unit: 'm²', help: 'Luas penampang basah yang bersentuhan dengan air' },
                      { label: 'Keliling Basah (P)', val: results.Perimeter, unit: 'm', help: 'Panjang keliling penampang yang bersentuhan dengan air' },
                      { label: 'Jari-jari (R)', val: results.Radius, unit: 'm', help: 'Jari-jari hidrolis = Luas basah / Keliling basah' },
                      { label: 'Lebar Atas (T)', val: results.TopWidth, unit: 'm', help: 'Lebar permukaan air pada bagian atas' },
                      { label: 'Energi Spesifik (E)', val: results.SpecificEnergy, unit: 'm', help: 'Total energi per unit berat air relatif terhadap dasar saluran' },
                      { label: 'Tegangan Geser', val: results.ShearStress, unit: 'N/m²', help: 'Gaya geser yang bekerja pada dasar dan dinding saluran' },
                      { label: 'Kedalaman Kritis', val: results.CriticalDepth, unit: 'm', highlight: true, help: 'Kedalaman air pada kondisi aliran kritis (Fr=1)' },
                      { label: 'Slope Kritis', val: results.CriticalSlope, unit: '', highlight: true, help: 'Kemiringan minimum untuk mencapai aliran kritis' },
                    ].map((item, i) => (
                      <Grid item xs={6} sm={3} key={i}>
                        <Card variant={item.highlight ? 'elevation' : 'outlined'} sx={{ p: 2, bgcolor: item.highlight ? 'primary.light' : 'background.paper', color: item.highlight ? 'primary.contrastText' : 'text.primary' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{item.label}</Typography>
                            <HelpTooltip content={item.help} />
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 800 }}>
                            {item.val} <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>{item.unit}</Typography>
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Button 
                      fullWidth 
                      onClick={() => onSave(CalculationType.MANNING, inputs, results)} 
                      icon={<Calculate />}
                    >
                      Simpan Laporan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onConsultAI(inputs, results)}
                      icon={<Psychology />}
                      sx={{ minWidth: { sm: 200 } }}
                    >
                      Analisis AI
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};
