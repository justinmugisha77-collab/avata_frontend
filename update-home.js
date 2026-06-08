const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Home.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

const oldSection = `                      <div className="relative h-48 bg-gradient-to-br from-slate-950 via-blue-700 to-blue-500 text-white flex items-center justify-center overflow-hidden">
                        <div className="h-20 w-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center">
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_45%)] pointer-events-none" />
                      </div>`;

const newSection = `                      <div className="relative h-48 bg-gradient-to-br from-slate-950 via-blue-700 to-blue-500 text-white flex items-center justify-center overflow-hidden">
                        {category?.image ? (
                          <>
                            <img src={category.image} alt={categoryName} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          </>
                        ) : (
                          <div className="h-20 w-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <Icon className="w-10 h-10 text-white" />
                          </div>
                        )}
                        {!category?.image && (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_45%)] pointer-events-none" />
                        )}
                      </div>`;

content = content.replace(oldSection, newSection);
fs.writeFileSync(filePath, content);
console.log('Home.jsx updated successfully');
