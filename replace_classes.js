const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/features/master-data/components/MasterDataDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Header
content = content.replace('text-2xl font-medium text-slate-900', 'text-3xl font-medium text-[#1e293b]');
content = content.replace('text-3xl font-light tabular-nums text-pupr-blue', 'text-4xl font-light tabular-nums text-pupr-blue');

// Indicators
content = content.replace(/rounded-sm bg-pupr-blue/g, 'rounded-full bg-pupr-blue');
content = content.replace(/rounded-sm bg-emerald-500/g, 'rounded-full bg-emerald-500');

// Status Valid/Fails
content = content.replace('text-emerald-600 uppercase">Valid', 'text-slate-500 uppercase">Valid');
content = content.replace('text-rose-500 uppercase">Fails', 'text-red-500 uppercase">Fails');

// Geometri DAS -> Luas
content = content.replace('text-3xl font-medium text-slate-900 dark:text-slate-100 tabular-nums', 'text-5xl font-light tracking-tight text-slate-800 dark:text-slate-100 tabular-nums');
content = content.replace('text-sm font-normal text-slate-500 ml-2 uppercase', 'text-sm font-bold text-slate-400 ml-2 uppercase');

// Geometri DAS -> Length & Slope (berulang)
content = content.replace(/text-lg font-medium text-slate-700 dark:text-slate-300 tabular-nums/g, 'text-2xl font-light tracking-tight text-slate-800 dark:text-slate-300 tabular-nums');

// Tata Guna Lahan -> Composite C
content = content.replace('text-3xl font-medium text-pupr-blue tabular-nums', 'text-5xl font-light tracking-tight text-pupr-blue tabular-nums');

fs.writeFileSync(filePath, content, 'utf8');
console.log('MasterDataDashboard.tsx updated!');

// SideDrawer Shadow
const drawerPath = path.join(__dirname, 'src/components/SideDrawer.tsx');
let drawerContent = fs.readFileSync(drawerPath, 'utf8');
drawerContent = drawerContent.replace('shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] ', '');
fs.writeFileSync(drawerPath, drawerContent, 'utf8');
console.log('SideDrawer.tsx updated!');
