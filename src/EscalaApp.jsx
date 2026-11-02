import React, { useState, useEffect } from 'react';
import { Calendar, Table, Download, RefreshCw, Moon, Sun } from 'lucide-react';

const EscalaApp = () => {
  const [sequence, setSequence] = useState('M, M, M, M, F, F');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [letter, setLetter] = useState('A');
  const [startDate, setStartDate] = useState('');
  const [months, setMonths] = useState(1);
  const [view, setView] = useState('table');
  const [scheduleData, setScheduleData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
  }, []);

  const handleGenerate = () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);

    if (!startDate || !sequence) return;

    const seqArray = sequence.split(',').map(s => s.trim().toUpperCase());
    const start = new Date(startDate);
    
    const end = new Date(start.getFullYear(), start.getMonth() + Number(months), 0); 
    
    const data = [];
    let currentDate = new Date(start);
    let seqIndex = 0;

    while (currentDate <= end) {
      data.push({
        date: new Date(currentDate),
        shift: seqArray[seqIndex % seqArray.length]
      });
      currentDate.setDate(currentDate.getDate() + 1);
      seqIndex++;
    }

    setScheduleData(data);
  };

  const exportToExcel = () => {
    if (!scheduleData) return;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: 'Google Sans', Calibri, sans-serif; font-size: 12px; }
          th, td { border: 1px solid black; padding: 5px; text-align: center; vertical-align: middle; }
          .folga-text { color: #737373; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th colspan="2">NOME: ${name}</th>
              <th colspan="2">LETRA: ${letter}</th>
            </tr>
            <tr>
              <th>Data</th>
              <th>Dia</th>
              <th>Turno</th>
              <th>Horário</th>
            </tr>
          </thead>
          <tbody>
    `;

    scheduleData.forEach((item) => {
      const isFolga = item.shift === 'F';
      const shiftClass = isFolga ? 'class="folga-text"' : '';
      let horario = '';
      if (item.shift === 'M') horario = '08:00 - 16:00';
      if (item.shift === 'T') horario = '16:00 - 24:00';
      if (item.shift === 'N') horario = '00:00 - 08:00';
      if (item.shift === 'F') horario = 'FOLGAS';

      html += `
        <tr>
          <td>${item.date.toLocaleDateString('pt-PT')}</td>
          <td>${item.date.toLocaleDateString('pt-PT', { weekday: 'short' }).toUpperCase()}</td>
          <td ${shiftClass}>${item.shift}</td>
          <td ${shiftClass} style="${isFolga ? 'text-align: center; vertical-align: middle;' : ''}">${horario}</td>
        </tr>
      `;
    });

    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escala_${view}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-8 transition-colors duration-300 font-sans">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#03cafc' }}>
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gerador de Escalas</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Organize turnos e exporte escalas num instante.</p>
              </div>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600"
              title="Alternar Modo Escuro"
            >
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sequência (ex: M,T,N,F,F)</label>
                <input
                  type="text"
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white dark:bg-slate-900 dark:text-white"
                  style={{ '--tw-ring-color': '#03cafc' }}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">M: 08-16H | T: 16-24H | N: 00-08H | F: Folga</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Nome do Colaborador *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setNameError(false);
                  }}
                  placeholder="Ex: João Silva"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white dark:bg-slate-900 dark:text-white ${
                    nameError 
                      ? 'border-red-500 ring-2 ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  style={{ '--tw-ring-color': nameError ? '#ef4444' : '#03cafc' }}
                />
                {nameError && <p className="text-xs text-red-500">O preenchimento do nome é obrigatório.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Letra</label>
                  <select
                    value={letter}
                    onChange={(e) => setLetter(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-900 dark:text-white"
                    style={{ '--tw-ring-color': '#03cafc' }}
                  >
                    {['A', 'B', 'C', 'D', 'E'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Meses</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-900 dark:text-white"
                    style={{ '--tw-ring-color': '#03cafc' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data de Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-900 dark:text-white"
                  style={{ '--tw-ring-color': '#03cafc' }}
                />
              </div>

              <button
                onClick={handleGenerate}
                className="w-full text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
                style={{ backgroundColor: '#03cafc' }}
              >
                <RefreshCw size={18} />
                Gerar Escala
              </button>
            </div>

            <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[500px] flex flex-col">
              
              {!scheduleData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-4">
                  <RefreshCw size={48} className="opacity-20" />
                  <div className="text-center">
                    <p className="font-medium text-slate-600 dark:text-slate-300">A sua escala gerada aparecerá aqui.</p>
                    <p className="text-sm">Preencha os dados e clique em "Gerar Escala".</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                      <button
                        onClick={() => setView('table')}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${
                          view === 'table' ? 'text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                        style={view === 'table' ? { backgroundColor: '#03cafc' } : {}}
                      >
                        <Table size={16} /> Tabela
                      </button>
                      <button
                        onClick={() => setView('calendar')}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${
                          view === 'calendar' ? 'text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                        style={view === 'calendar' ? { backgroundColor: '#03cafc' } : {}}
                      >
                        <Calendar size={16} /> Calendário
                      </button>
                    </div>
                    
                    <button
                      onClick={exportToExcel}
                      className="px-4 py-2 text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:brightness-110 transition-all shadow-sm"
                      style={{ backgroundColor: '#03cafc' }}
                    >
                      <Download size={16} /> Exportar Excel
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    {view === 'table' ? (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm">
                            <th className="p-3 border-b dark:border-slate-700">Data</th>
                            <th className="p-3 border-b dark:border-slate-700">Dia</th>
                            <th className="p-3 border-b dark:border-slate-700 text-center">Turno</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {scheduleData.map((item, idx) => (
                            <tr key={idx} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                              <td className="p-3">{item.date.toLocaleDateString('pt-PT')}</td>
                              <td className="p-3 uppercase">{item.date.toLocaleDateString('pt-PT', { weekday: 'short' })}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full font-bold ${
                                  item.shift === 'F' ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                                }`}>
                                  {item.shift}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="grid grid-cols-7 gap-2">
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                          <div key={d} className="text-center font-bold text-sm text-slate-500 dark:text-slate-400 py-2">
                            {d}
                          </div>
                        ))}
                        
                        {Array.from({ length: scheduleData[0].date.getDay() === 0 ? 6 : scheduleData[0].date.getDay() - 1 }).map((_, i) => (
                          <div key={`empty-${i}`} className="p-2"></div>
                        ))}

                        {scheduleData.map((item, idx) => (
                          <div key={idx} className="border dark:border-slate-700 p-2 rounded-lg text-center flex flex-col items-center gap-1 bg-slate-50 dark:bg-slate-900/50">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.date.getDate()}</span>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                              item.shift === 'F' ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                            }`}>
                              {item.shift}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscalaApp;
