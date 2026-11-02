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
          
          {/* Cabeçalho */}
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
            {/* Formulário lateral */}
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking
