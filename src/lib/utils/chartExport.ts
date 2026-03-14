import html2canvas from 'html2canvas';

/**
 * Chart Export Utility
 * ====================
 * 
 * Mengekspor elemen DOM (biasanya kontainer chart) menjadi gambar.
 */

export const exportChartAsImage = async (
  elementId: string, 
  fileName: string = 'chart-export',
  format: 'png' | 'jpeg' = 'png'
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });

    const image = canvas.toDataURL(`image/${format}`, 1.0);
    const link = document.createElement('a');
    link.download = `${fileName}.${format}`;
    link.href = image;
    link.click();
  } catch (error) {
    console.error('Error exporting chart:', error);
  }
};
