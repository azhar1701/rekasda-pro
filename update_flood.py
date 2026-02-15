import re

# Read the file
with open('c:/Users/ariaz/OneDrive/Documents/GitHub/rekasda-pro/components/FloodDischargeCalculator.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove unused imports
content = content.replace("import { CardLegacy as Card, CardContent } from './ui/CardNew';", "")
content = content.replace("import { PageHeader, PageContent, Section } from './ui/Layout';", "")

# Replace return statement start
content = content.replace(
    '''  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Analisis Banjir & Hidrologi"
        subtitle="Perhitungan debit puncak menggunakan metode Rasional atau Nakayasu"
        icon={<span className="text-2xl">💧</span>}
      />''',
    '''  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Analisis Banjir & Hidrologi</h1>
          <p className="text-sm text-slate-500 mt-1">Perhitungan debit puncak • Metode Rasional & Nakayasu</p>
        </div>'''
)

# Replace grid layout
content = content.replace(
    '''      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SIDEBAR - 33% */}
          <div className="space-y-6">''',
    '''        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR - 30% */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <div className="sticky top-6 h-[calc(100vh-100px)] overflow-y-auto pr-2 space-y-4">'''
)

# Replace Section wrappers for sidebar
content = content.replace(
    '''            {/* Pilot Data Loader */}
            <Section title="Data Pilot">
              <PilotDataLoader''',
    '''              {/* Pilot Data Loader */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Data Pilot</h2>
                <PilotDataLoader'''
)

content = content.replace(
    '''              />
            </Section>

            {/* Location Identity */}
            <Section title="Identitas Lokasi">
              <LocationIdentity onLocationChange={setLocationData} />
            </Section>''',
    '''              />
              </div>

              {/* Location Identity */}
              <LocationIdentity onLocationChange={setLocationData} />'''
)

content = content.replace(
    '''            {/* Method Selector */}
            <Section title="Metode Perhitungan">
              <div className="flex gap-2 p-2 bg-slate-100 rounded-xl">''',
    '''              {/* Method Selector */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Metode Perhitungan</h2>
                <div className="flex gap-2 p-2 bg-slate-100 rounded-xl">'''
)

content = content.replace(
    '''                </button>
              </div>
            </Section>''',
    '''                </button>
                </div>
              </div>'''
)

# Replace Geometri DAS sections
content = content.replace(
    '''              <Section title="Geometri DAS">
                <Card>
                  <CardContent>''',
    '''              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Geometri DAS</h2>'''
)

content = content.replace(
    '''                  </CardContent>
                </Card>
              </Section>

              <Section title="Parameter Hidrologi">
                <Card>
                  <CardContent>''',
    '''              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Parameter Hidrologi</h2>'''
)

content = content.replace(
    '''                  </CardContent>
                </Card>
              </Section>
            </>
          ) : (
            <>
              <Section title="Geometri DAS">
                <Card>
                  <CardContent>''',
    '''              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Geometri DAS</h2>'''
)

content = content.replace(
    '''                  </CardContent>
                </Card>
              </Section>

              <Section title="Parameter Hidrologi">
                <Card>
                  <CardContent>''',
    '''              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Parameter Hidrologi</h2>'''
)

content = content.replace(
    '''                  </CardContent>
                </Card>
              </Section>
            </>
          )}
          </div>

          {/* MAIN CONTENT - 67% */}
          <div className="lg:col-span-2 space-y-6">''',
    '''              </div>
            </>
          )}
            </div>
          </div>

          {/* MAIN CONTENT - 70% */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">'''
)

# Replace KPI section
content = content.replace(
    '''            {/* KPI Cards */}
            <Section>
              <div className="grid grid-cols-1 gap-4">''',
    '''            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4">'''
)

content = content.replace(
    '''              </div>
            </Section>

            {/* Chart */}
            <Section title="Hidrograf Banjir Rencana">
              <Card>
                <CardContent>
                  <FloodHydrographChart''',
    '''            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Hidrograf Banjir Rencana</h2>
              <FloodHydrographChart'''
)

content = content.replace(
    '''                  />
                </CardContent>
              </Card>
            </Section>

            {/* Return Period Analysis */}
            <Section title="Analisis Kala Ulang">
              <Card>
                <CardContent>''',
    '''              />
            </div>

            {/* Return Period Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Analisis Kala Ulang</h2>'''
)

content = content.replace(
    '''                  </div>
                </CardContent>
              </Card>
            </Section>
          </div>
        </div>
      </PageContent>''',
    '''              </div>
            </div>
          </div>
        </div>
      </div>'''
)

# Write the updated content
with open('c:/Users/ariaz/OneDrive/Documents/GitHub/rekasda-pro/components/FloodDischargeCalculator.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("FloodDischargeCalculator.tsx updated successfully!")
