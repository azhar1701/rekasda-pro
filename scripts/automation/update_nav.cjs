const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldMobileNav = `          {/* Mobile Navigation - Bottom Bar */}
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-lg">
            <div className="px-3 py-2 safe-area-inset-bottom">
              <div className="flex items-center justify-evenly gap-0.5 overflow-x-auto scrollbar-hide">
                {navGroups.map((group, groupIndex) => (
                  <React.Fragment key={groupIndex}>
                    {group.items.map((item) => (
                      <button
                        key={item.tab}
                        onClick={() => setActiveTab(item.tab)}
                        className={\`flex flex-col items-center justify-center min-w-[60px] min-h-[56px] px-2 py-2 rounded-xl transition-all duration-200 shrink-0 \${
                          activeTab === item.tab
                            ? 'text-[#0c3a66] bg-blue-50'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }\`}
                      >
                        <div className="flex items-center justify-center">
                          {item.icon}
                        </div>
                        <span className={\`text-[10px] mt-1 transition-all duration-200 \${
                          activeTab === item.tab ? 'font-bold' : 'font-medium'
                        }\`}>{item.label}</span>
                      </button>
                    ))}
                  </React.Fragment>
                ))}

                {/* AI Consultant Mobile */}
                <button
                  onClick={() => setIsAIDrawerOpen((prev) => !prev)}
                  className={\`relative flex flex-col items-center justify-center min-w-[60px] min-h-[56px] px-2 py-2 rounded-xl transition-all duration-200 shrink-0 \${
                    isAIDrawerOpen
                      ? 'text-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'text-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600'
                  }\`}
                >
                  <div className="flex items-center justify-center">
                    <Sparkles strokeWidth={2.5} className="w-5 h-5" />
                  </div>
                  <span className={\`text-[10px] mt-1 transition-all duration-200 \${
                    isAIDrawerOpen ? 'font-bold' : 'font-medium'
                  }\`}>AI</span>
                  {isAIDrawerOpen && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>
            </div>
          </div>`;

const newMobileNav = `          {/* Mobile Navigation - Bottom Bar */}
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="px-1 py-1.5 safe-area-inset-bottom">
              <div className="flex items-center justify-between gap-0.5 w-full">
                {navGroups.map((group, groupIndex) => (
                  <React.Fragment key={groupIndex}>
                    {group.items.map((item) => (
                      <button
                        key={item.tab}
                        onClick={() => setActiveTab(item.tab)}
                        className={\`flex flex-col items-center justify-center w-full min-w-0 min-h-[50px] rounded-lg transition-all duration-200 \${
                          activeTab === item.tab
                            ? 'text-pupr-blue bg-blue-50/80 shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50/80'
                        }\`}
                      >
                        <div className={\`flex items-center justify-center transition-transform duration-200 \${activeTab === item.tab ? 'scale-110' : 'scale-100'}\`}>
                          {React.cloneElement(item.icon as React.ReactElement, { className: 'w-[18px] h-[18px] sm:w-5 sm:h-5' })}
                        </div>
                        <span className={\`text-[9px] sm:text-[10px] mt-1 truncate w-full text-center px-0.5 transition-all duration-200 \${
                          activeTab === item.tab ? 'font-bold' : 'font-medium'
                        }\`}>{item.label}</span>
                      </button>
                    ))}
                  </React.Fragment>
                ))}

                {/* AI Consultant Mobile */}
                <button
                  onClick={() => setIsAIDrawerOpen((prev) => !prev)}
                  className={\`relative flex flex-col items-center justify-center w-full min-w-0 min-h-[50px] rounded-lg transition-all duration-200 \${
                    isAIDrawerOpen
                      ? 'text-indigo-600 bg-indigo-50 ring-1 ring-indigo-200 shadow-sm'
                      : 'text-indigo-400 hover:bg-indigo-50/50'
                  }\`}
                >
                  <div className={\`flex items-center justify-center transition-transform duration-200 \${isAIDrawerOpen ? 'scale-110' : 'scale-100'}\`}>
                    <Sparkles strokeWidth={2.5} className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                  </div>
                  <span className={\`text-[9px] sm:text-[10px] mt-1 truncate w-full text-center px-0.5 transition-all duration-200 \${
                    isAIDrawerOpen ? 'font-bold' : 'font-medium'
                  }\`}>AI</span>
                  {isAIDrawerOpen && (
                    <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse border border-white" />
                  )}
                </button>
              </div>
            </div>
          </div>`;

content = content.replace(oldMobileNav, newMobileNav);
fs.writeFileSync('src/App.tsx', content);
