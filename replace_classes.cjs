const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Dashboard replacements
  if (filePath.includes('MasterDataDashboard.tsx')) {
    content = content.replace('text-2xl font-medium text-slate-900', 'text-3xl font-medium text-[#1e293b]');
    content = content.replace('text-3xl font-light tabular-nums text-pupr-blue', 'text-4xl font-light tabular-nums text-pupr-blue');
    content = content.replace(/rounded-sm bg-pupr-blue/g, 'rounded-full bg-pupr-blue');
    content = content.replace(/rounded-sm bg-emerald-500/g, 'rounded-full bg-emerald-500');
    content = content.replace('text-emerald-600 uppercase">Valid', 'text-slate-500 uppercase">Valid');
    content = content.replace('text-rose-500 uppercase">Fails', 'text-red-500 uppercase">Fails');
    content = content.replace('text-3xl font-medium text-slate-900 dark:text-slate-100 tabular-nums', 'text-5xl font-light tracking-tight text-slate-800 dark:text-slate-100 tabular-nums');
    content = content.replace('text-sm font-normal text-slate-500 ml-2 uppercase', 'text-sm font-bold text-slate-400 ml-2 uppercase');
    content = content.replace(/text-lg font-medium text-slate-700 dark:text-slate-300 tabular-nums/g, 'text-2xl font-light tracking-tight text-slate-800 dark:text-slate-300 tabular-nums');
    content = content.replace('text-3xl font-medium text-pupr-blue tabular-nums', 'text-5xl font-light tracking-tight text-pupr-blue tabular-nums');
  }

  if (filePath.includes('SideDrawer.tsx')) {
    content = content.replace('shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] ', '');
  }

  // Global glassmorphism removal (tooltips usually use backdrop-blur and bg-white/95)
  content = content.replace(/backdrop-blur-sm /g, '');
  content = content.replace(/backdrop-blur-md /g, '');
  content = content.replace(/backdrop-blur /g, '');
  content = content.replace(/bg-white\/[0-9]+ /g, 'bg-white ');
  content = content.replace(/bg-slate-900\/[0-9]+ /g, 'bg-slate-900 ');

  fs.writeFileSync(filePath, content, 'utf8');
}

const files = [
  'src/features/master-data/components/MasterDataDashboard.tsx',
  'src/components/SideDrawer.tsx',
  'src/features/master-data/components/MasterHidrologiTab.tsx',
  'src/features/flood-analysis/components/HydrographChart.tsx',
  'src/features/flood-analysis/components/ModulBanjirRencana.tsx',
  'src/components/ui/IDFChart.tsx',
  'src/components/ui/HyetographChart.tsx'
].map(f => path.join(__dirname, f));

files.forEach(replaceInFile);
console.log('Flattening script executed successfully across targeted files!');
