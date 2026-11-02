import React, { useState } from 'react';
import { RotateCcw, Play, Printer, FileSpreadsheet, LayoutGrid, TableProperties, List, CalendarDays } from 'lucide-react';

export default function EscalaApp() {
  const [sequence, setSequence] = useState('M, M, M, M, F, F');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthsToGenerate, setMonthsToGenerate] = useState(1);
  const [colaboradorName, setColaboradorName] = useState('');
  const [colaboradorLetra, setColaboradorLetra] = useState('A');
  const [schedule, setSchedule] = useState([]);
  const [viewType, setViewType] = useState('table'); // 'calendar', 'table', 'list'

  const shiftMap = {
    'M': { label: 'Manhã', time: '08H-16H' },
    'T': { label: 'Tarde', time: '16H-24H' },
    'N': { label: 'Noite', time: '00H-08H' },
    'F': { label: 'Folga', time: '-' },
    'FOLGA': { label: 'Folga', time: '-' }
  };

  const generateSchedule = () => {
    if (!sequence.trim() || !startDate || monthsToGenerate <= 0) return;
    if (!colaboradorName.trim()) return;

    const seqArray = sequence
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    if (seqArray.length === 0) return;

    const [yearStr, monthStr, dayStr] = startDate.split('-');
    const startYear = parseInt(yearStr, 10);
    const startMonth = parseInt(monthStr, 10) - 1;
    const startDay = parseInt(dayStr, 10);

    const newSchedule = [];
    let currentDate = new Date(startYear, startMonth, startDay);
    
    let endDate = new Date(startYear, startMonth, startDay);
    endDate.setMonth(endDate.getMonth() + monthsToGenerate);

    let lastActualDay = new Date(endDate);
    lastActualDay.setDate(lastActualDay.getDate() - 1);
    let finalEndDate = new Date(lastActualDay.getFullYear(), lastActualDay.getMonth() + 1, 0);

    let i = 0;
    while (currentDate <= finalEndDate) {
      const shiftCode = seqArray[i % seqArray.length];
      const isOff = shiftCode === 'F' || shiftCode === 'FOLGA';
      const shiftDetails = shiftMap[shiftCode] || { label: 'Turno Personalizado', time: '--H' };
      
      newSchedule.push({
        id: i,
        date: new Date(currentDate),
        shift: shiftCode,
        isOff: isOff,
        label: shiftDetails.label,
        time: shiftDetails.time
      });

      currentDate.setDate(currentDate.getDate() + 1);
      i++;
    }

    setSchedule(newSchedule);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }).replace('.', '');
  };

  const formatDayOfWeek = (date) => {
    return date.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '');
  };

  const getDayLetter = (date) => {
    const day = date.getDay();
    const letters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    return letters[day];
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const groupScheduleByTableMonth = () => {
    if (schedule.length === 0) return [];
    
    const monthsMap = new Map();
    
    schedule.forEach(day => {
      const year = day.date.getFullYear();
      const month = day.date.getMonth();
      const key = `${year}-${month}`;
      
      if (!monthsMap.has(key)) {
        monthsMap.set(key, { year, month });
      }
    });
    
    const groupedList = [];
    
    Array.from(monthsMap.values()).forEach(({ year, month }) => {
      const monthDate = new Date(year, month, 1);
      const monthName = monthDate.toLocaleDateString('pt-PT', { month: 'long' });
      const displayName = `${monthName} ${year}`;
      
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthDays = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month, i);
        
        const scheduledDay = schedule.find(
          s => s.date.getDate() === i && 
               s.date.getMonth() === month && 
               s.date.getFullYear() === year
        );
        
        if (scheduledDay) {
          monthDays.push(scheduledDay);
        } else {
          monthDays.push({
            id: `empty-${year}-${month}-${i}`,
            date: currentDate,
            shift: null,
            isOff: false,
            label: '',
            time: ''
          });
        }
      }
      
      groupedList.push({
        id: `${year}-${month}`,
        displayName,
        days: monthDays
      });
    });
    
    return groupedList;
  };

  const groupScheduleByActiveMonths = () => {
    if (schedule.length === 0) return [];
    const grouped = [];
    let currentMonthId = '';
    let currentMonthGroup = null;

    schedule.forEach(day => {
      const monthId = `${day.date.getFullYear()}-${day.date.getMonth()}`;
      if (monthId !== currentMonthId) {
        if (currentMonthGroup) grouped.push(currentMonthGroup);
        currentMonthId = monthId;
        currentMonthGroup = {
          id: monthId,
          displayName: `${day.date.toLocaleDateString('pt-PT', { month: 'long' })} ${day.date.getFullYear()}`,
          days: []
        };
      }
      currentMonthGroup.days.push(day);
    });
    if (currentMonthGroup) grouped.push(currentMonthGroup);
    return grouped;
  };

  const exportToExcel = () => {
    if (schedule.length === 0) return;
    
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Calibri, sans-serif; font-size: 12pt; }
          table { border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1pt solid black; vertical-align: middle; }
          .bg-black { background-color: #000000; color: #ffffff; font-weight: bold; }
          .bg-dark-gray { background-color: #a1a1aa; font-weight: bold; }
          .bg-gray { background-color: #d4d4d8; }
          .bg-light { background-color: #f4f4f5; }
          .text-left { text-align: left; padding-left: 5px; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body>
    `;

    if (viewType === 'table') {
      const grouped = groupScheduleByTableMonth();
      const rowsConfig = [
        { letra: 'A', hStart: '00:00', hEnd: '08:00', mapped: 'N' },
        { letra: 'B', hStart: '08:00', hEnd: '16:00', mapped: 'M' },
        { letra: 'C', hStart: '16:00', hEnd: '24:00', mapped: 'T' },
        { letra: 'D', hStart: '', hEnd: '', mapped: 'CUSTOM' },
        { letra: 'E', isFolgas: true, mapped: 'F' },
      ];

      grouped.forEach(({ displayName, days }) => {
        htmlContent += `<table style="table-layout: fixed;">
          <colgroup>
            <col width="50" style="width: 50px;" />
            <col width="150" style="width: 150px;" />
            <col width="60" style="width: 60px;" />
            <col width="60" style="width: 60px;" />
            ${days.map(() => '<col width="25" style="width: 25px; mso-width-source: userset; mso-width-alt: 732;" />').join('')}
          </colgroup>
          <thead>
            <tr>
              <th colspan="2" class="bg-dark-gray"></th>
              <th colspan="2" class="bg-black" style="mso-number-format:'\\@';">${displayName.toUpperCase()}</th>
        `;
        
        days.forEach(d => {
          const isWknd = isWeekend(d.date);
          htmlContent += `<th class="${isWknd ? 'bg-dark-gray' : 'bg-gray'} text-center" style="font-weight: bold; width: 25px;">${getDayLetter(d.date)}</th>`;
        });
        
        htmlContent += `</tr><tr>
          <th class="bg-gray text-center">Letra</th>
          <th class="bg-gray text-center">Nome</th>
          <th colspan="2" class="bg-gray text-center">Horário</th>
        `;

        days.forEach(d => {
          const isWknd = isWeekend(d.date);
          const dayNumberStr = String(d.date.getDate()).padStart(2, '0');
          htmlContent += `<th class="${isWknd ? 'bg-dark-gray' : 'bg-light'} text-center" style="font-weight: bold; width: 25px; mso-number-format:'\\@';">${dayNumberStr}</th>`;
        });
        htmlContent += `</tr></thead><tbody>`;

        rowsConfig.forEach(row => {
          htmlContent += `<tr>
            <td class="text-center">${row.letra}</td>
            <td class="text-left">${row.letra === colaboradorLetra ? colaboradorName.toUpperCase() : ''}</td>
          `;
          
          if (row.isFolgas) {
            htmlContent += `<td colspan="2" class="bg-light text-center" style="font-weight: bold; text-align: center; vertical-align: middle; letter-spacing: 2px;">FOLGAS</td>`;
          } else {
            htmlContent += `<td class="text-center" style="mso-number-format:'\\@';">${row.hStart}</td><td class="text-center" style="mso-number-format:'\\@';">${row.hEnd}</td>`;
          }

          days.forEach(d => {
            const isWknd = isWeekend(d.date);
            const cellBg = isWknd ? 'background-color: #d4d4d8;' : '';
            
            let isMatch = false;
            if (d.shift) {
              if (row.isFolgas && d.isOff) isMatch = true;
              else if (row.mapped === 'N' && d.shift === 'N') isMatch = true;
              else if (row.mapped === 'M' && d.shift === 'M') isMatch = true;
              else if (row.mapped === 'T' && d.shift === 'T') isMatch = true;
              else if (row.mapped === 'CUSTOM' && !['M','T','N','F','FOLGA'].includes(d.shift) && !d.isOff) isMatch = true;
            }

            const textColor = (isMatch && row.isFolgas) ? 'color: #737373;' : '';

            htmlContent += `<td class="text-center" style="${cellBg} ${textColor} width: 25px;">${isMatch ? colaboradorLetra : ''}</td>`;
          });
          
          htmlContent += `</tr>`;
        });
        
        htmlContent += `</tbody></table><br>`;
      });

    } else if (viewType === 'list') {
      htmlContent += `
        <table style="width: 500px; table-layout: fixed;">
          <colgroup>
            <col width="120" style="width: 120px;" />
            <col width="120" style="width: 120px;" />
            <col width="120" style="width: 120px;" />
            <col width="140" style="width: 140px;" />
          </colgroup>
          <thead>
            <tr>
              <th class="bg-gray text-center" style="font-weight: bold; height: 30px;">Data</th>
              <th class="bg-gray text-center" style="font-weight: bold;">Dia da Semana</th>
              <th class="bg-gray text-center" style="font-weight: bold;">Turno</th>
              <th class="bg-gray text-center" style="font-weight: bold;">Horário</th>
            </tr>
          </thead>
          <tbody>
      `;
      schedule.forEach(day => {
        htmlContent += `
          <tr>
            <td class="text-center" style="height: 25px;">${formatDate(day.date)}</td>
            <td class="text-center">${formatDayOfWeek(day.date).toUpperCase()}</td>
            <td class="text-center" style="${day.isOff ? 'color: #999999;' : 'font-weight: bold;'}">${day.isOff ? 'FOLGA' : day.shift}</td>
            <td class="text-center" style="mso-number-format:'\\@'; ${day.isOff ? 'color: #999999;' : ''}">${day.isOff ? '-' : day.time}</td>
          </tr>
        `;
      });
      htmlContent += `</tbody></table>`;

    } else if (viewType === 'calendar') {
      const grouped = groupScheduleByTableMonth();
      grouped.forEach(({ displayName, days }) => {
        htmlContent += `<table style="table-layout: fixed; margin-bottom: 20px;">
          <thead>
            <tr><th colspan="7" class="bg-black" style="color: white; font-size: 14pt; padding: 10px; mso-number-format:'\\@';">${displayName.toUpperCase()}</th></tr>
            <tr>
              ${['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map(d => `<th class="bg-gray text-center" style="width: 100px; height: 30px;">${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody><tr>`;

        const firstDay = days[0].date.getDay();
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        let count = 0;

        for (let i = 0; i < offset; i++) {
          htmlContent += `<td style="background-color: #f4f4f5; border: 1pt solid black;"></td>`;
          count++;
        }

        days.forEach(day => {
          if (count > 0 && count % 7 === 0) htmlContent += `</tr><tr>`;

          if (day.shift) {
            htmlContent += `
              <td style="width: 100px; height: 100px; text-align: left; vertical-align: top; padding: 5px; border: 1pt solid black; ${day.isOff ? 'color: #999999; background-color: #fcfcfc;' : 'color: #000000;'}">
                <div style="font-weight: bold; font-size: 11pt;">${day.date.getDate()}</div>
                <div style="font-size: 16pt; font-weight: bold; text-align: center; margin-top: 10px;">${day.shift}</div>
                <div style="font-size: 9pt; text-align: center; mso-number-format:'\\@';">${day.isOff ? 'Folga' : day.time}</div>
              </td>
            `;
          } else {
            htmlContent += `
              <td style="width: 100px; height: 100px; text-align: left; vertical-align: top; padding: 5px; border: 1pt solid black; color: #cccccc;">
                <div style="font-weight: bold; font-size: 11pt;">${day.date.getDate()}</div>
              </td>
            `;
          }
          count++;
        });

        while (count % 7 !== 0) {
          htmlContent += `<td style="background-color: #f4f4f5; border: 1pt solid black;"></td>`;
          count++;
        }

        htmlContent += `</tr></tbody></table><br/>`;
      });
    }

    htmlContent += `</body></html>`;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `escala_${viewType}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printDocument = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-100" style={{ fontFamily: '"Google Sans", "Product Sans", sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 print:hidden flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
          <div className="p-3 rounded-xl shadow-lg shadow-cyan-200" style={{ backgroundColor: '#03cafc' }}>
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Gerador de Escalas</h1>
            <p className="text-sm text-slate-500 mt-1">Organize turnos e exporte escalas de serviço num instante.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-1 space-y-6 print:hidden">
            <div className="bg-white/80 backdrop-blur-sm p-6 border border-slate-200 shadow-md rounded-2xl space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Sequência (ex: M,T,N,F,F)
                </label>
                <input
                  type="text"
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03cafc]/20 focus:border-[#03cafc] transition-colors"
                  placeholder="M, M, M, M, F, F"
                />
                <p className="text-[10px] text-slate-400 mt-1">M: 08-16H | T: 16-24H | N: 00-08H | F: Folga</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Nome do Colaborador <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={colaboradorName}
                  onChange={(e) => setColaboradorName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    !colaboradorName.trim()
                      ? 'border-red-500 ring-2 ring-red-500/30 focus:border-red-500'
                      : 'border-slate-300 focus:ring-[#03cafc]/20 focus:border-[#03cafc]'
                  }`}
                  placeholder="Ex: João Silva"
                />
                {!colaboradorName.trim() && (
                  <p className="text-[10px] text-red-500 mt-1 font-medium">O preenchimento do nome é obrigatório.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Letra</label>
                <select
                  value={colaboradorLetra}
                  onChange={(e) => setColaboradorLetra(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03cafc]/20 focus:border-[#03cafc] transition-colors"
                >
                  {['A','B','C','D','E'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03cafc]/20 focus:border-[#03cafc] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Meses a Gerar
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={monthsToGenerate}
                  onChange={(e) => setMonthsToGenerate(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03cafc]/20 focus:border-[#03cafc] transition-colors"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={generateSchedule}
                  className="w-full flex items-center justify-center py-2.5 px-4 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: '#03cafc' }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Gerar Escala
                </button>
              </div>
            </div>

            {schedule.length > 0 && (
              <div className="flex flex-col gap-3">
                <button 
                  onClick={printDocument}
                  className="w-full flex items-center justify-center py-2.5 px-3 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <Printer className="w-4 h-4 mr-2 text-slate-400" />
                  Imprimir Folha
                </button>
                <button 
                  onClick={exportToExcel}
                  className="w-full flex items-center justify-center py-2.5 px-3 bg-white border border-emerald-200 text-emerald-700 text-sm font-medium rounded-lg shadow-sm hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" />
                  Exportar para Excel
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 print:col-span-4 print:w-full">
            {schedule.length > 0 ? (
              <div className="bg-white/80 backdrop-blur-sm p-6 border border-slate-200 shadow-md rounded-2xl print:border-none print:shadow-none print:p-0 print:bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 print:hidden gap-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Visualização</h2>
                  
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/60">
                    <button
                      onClick={() => setViewType('calendar')}
                      className={`flex items-center px-4 py-2 text-xs font-semibold rounded-md transition-all ${viewType === 'calendar' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                      style={viewType === 'calendar' ? { color: '#03cafc' } : {}}
                    >
                      <LayoutGrid className="w-4 h-4 mr-1.5" />
                      Calendário
                    </button>
                    <button
                      onClick={() => setViewType('table')}
                      className={`flex items-center px-4 py-2 text-xs font-semibold rounded-md transition-all ${viewType === 'table' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                      style={viewType === 'table' ? { color: '#03cafc' } : {}}
                    >
                      <TableProperties className="w-4 h-4 mr-1.5" />
                      Tabela
                    </button>
                    <button
                      onClick={() => setViewType('list')}
                      className={`flex items-center px-4 py-2 text-xs font-semibold rounded-md transition-all ${viewType === 'list' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                      style={viewType === 'list' ? { color: '#03cafc' } : {}}
                    >
                      <List className="w-4 h-4 mr-1.5" />
                      Lista
                    </button>
                  </div>
                </div>
                
                <style>{`
                  @media print {
                    body { background: white; }
                    @page { margin: 10mm; size: landscape; }
                    * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
                  }
                  
                  .print-page-break {
                    page-break-after: always;
                    break-after: page;
                  }
                  .print-page-break:last-child {
                    page-break-after: auto;
                    break-after: auto;
                  }
                `}</style>

                <div id="printable-area">
                  {viewType === 'calendar' && (
                    <div className="space-y-8 print:space-y-0">
                      {groupScheduleByTableMonth().map(monthGroup => {
                        const firstDay = monthGroup.days[0].date.getDay();
                        const offset = firstDay === 0 ? 6 : firstDay - 1;
                        const remainder = (offset + monthGroup.days.length) % 7;
                        const endPadding = remainder === 0 ? 0 : 7 - remainder;

                        return (
                          <div key={monthGroup.id} className="print-page-break print:min-h-[190mm] print:flex print:flex-col print:justify-center">
                            <h3 className="font-bold text-lg mb-4 text-black uppercase print:text-black">{monthGroup.displayName}</h3>
                            <div className="grid grid-cols-7 gap-px bg-neutral-300 print:bg-neutral-400 border border-neutral-300 print:border-neutral-400 rounded-sm overflow-hidden">
                              {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map(d => (
                                <div key={d} className="bg-neutral-100 print:bg-neutral-200 text-center py-2 text-[10px] font-bold text-neutral-600 tracking-wider">
                                  {d}
                                </div>
                              ))}
                              {Array.from({ length: offset }).map((_, i) => (
                                <div key={`empty-${i}`} className="bg-neutral-50/50 print:bg-white"></div>
                              ))}
                              {monthGroup.days.map(day => (
                                <div
                                  key={day.id}
                                  className={`flex flex-col p-2 print:p-1.5 min-h-[90px] print:min-h-[70px] bg-white ${day.shift && day.isOff ? 'text-neutral-400 bg-neutral-50' : !day.shift ? 'text-neutral-300 bg-white' : 'text-black'}`}
                                >
                                  <span className="text-xs print:text-[10px] font-bold mb-1">{day.date.getDate()}</span>
                                  {day.shift && (
                                    <div className="mt-auto flex flex-col items-center">
                                      <span className="text-xl print:text-lg font-light leading-none">{day.shift}</span>
                                      <span className="text-[9px] uppercase tracking-wider mt-1">{day.isOff ? 'Folga' : day.time}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {Array.from({ length: endPadding }).map((_, i) => (
                                <div key={`end-empty-${i}`} className="bg-neutral-50/50 print:bg-white"></div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {viewType === 'table' && (
                    <div className="space-y-8 print:space-y-0">
                      {groupScheduleByTableMonth().map(({ id, displayName, days }) => {
                        const rowsConfig = [
                          { letra: 'A', hStart: '00:00', hEnd: '08:00', mapped: 'N' },
                          { letra: 'B', hStart: '08:00', hEnd: '16:00', mapped: 'M' },
                          { letra: 'C', hStart: '16:00', hEnd: '24:00', mapped: 'T' },
                          { letra: 'D', hStart: '', hEnd: '', mapped: 'CUSTOM' },
                          { letra: 'E', isFolgas: true, mapped: 'F' },
                        ];

                        return (
                          <div key={id} className="print-page-break print:min-h-[190mm] print:flex print:flex-col print:justify-center">
                            <div className="overflow-x-auto border-[1.5px] border-black print:border-black rounded-sm print:rounded-none">
                              <table className="w-full text-center border-collapse text-[11px] font-sans">
                                <thead>
                                  <tr>
                                    <th colSpan="2" className="border border-black bg-neutral-300 print:bg-gray-300"></th>
                                    <th colSpan="2" className="border border-black bg-black text-white font-bold py-1 uppercase tracking-wider text-xs">
                                      {displayName}
                                    </th>
                                    {days.map(d => (
                                      <th key={'wd'+d.id} className={`border border-black px-0.5 py-1 w-5 font-bold text-[10px] ${isWeekend(d.date) ? 'bg-neutral-400 print:bg-gray-400' : 'bg-neutral-200 print:bg-gray-200'}`}>
                                        {getDayLetter(d.date)}
                                      </th>
                                    ))}
                                  </tr>
                                  <tr>
                                    <th className="border border-black bg-neutral-200 print:bg-gray-200 px-1 py-1 w-6">Letra</th>
                                    <th className="border border-black bg-neutral-200 print:bg-gray-200 px-2 py-1 w-24">Nome</th>
                                    <th colSpan="2" className="border border-black bg-neutral-200 print:bg-gray-200 px-2 py-1">Horário</th>
                                  {days.map(d => (
                                    <th key={'md'+d.id} className={`border border-black px-0.5 py-1 font-bold text-[10px] ${isWeekend(d.date) ? 'bg-neutral-400 print:bg-gray-400' : 'bg-neutral-100 print:bg-gray-100'}`}>
                                      {String(d.date.getDate()).padStart(2, '0')}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rowsConfig.map((row) => (
                                  <tr key={row.letra} className="bg-white">
                                    <td className="border border-black">{row.letra}</td>
                                    <td className="border border-black font-medium text-left px-2 truncate max-w-[140px] uppercase">
                                      {row.letra === colaboradorLetra ? colaboradorName : ''}
                                    </td>
                                    
                                    {row.isFolgas ? (
                                      <td colSpan="2" className="border border-black font-bold bg-neutral-100 print:bg-gray-100 tracking-widest text-center align-middle text-[10px]">FOLGAS</td>
                                    ) : (
                                      <>
                                        <td className="border border-black px-1 bg-neutral-50 print:bg-gray-50 text-[10px]">{row.hStart}</td>
                                        <td className="border border-black px-1 bg-neutral-50 print:bg-gray-50 text-[10px]">{row.hEnd}</td>
                                      </>
                                    )}

                                    {days.map(d => {
                                      const isWknd = isWeekend(d.date);
                                      const cellBg = isWknd ? 'bg-neutral-300 print:bg-gray-300' : 'bg-white';
                                      
                                      let isMatch = false;
                                      if (d.shift) {
                                        if (row.isFolgas && d.isOff) isMatch = true;
                                        else if (row.mapped === 'N' && d.shift === 'N') isMatch = true;
                                        else if (row.mapped === 'M' && d.shift === 'M') isMatch = true;
                                        else if (row.mapped === 'T' && d.shift === 'T') isMatch = true;
                                        else if (row.mapped === 'CUSTOM' && !['M','T','N','F','FOLGA'].includes(d.shift) && !d.isOff) isMatch = true;
                                      }

                                      return (
                                        <td 
                                          key={'val'+row.letra+d.id} 
                                          className={`border border-black px-0.5 py-1 ${cellBg}`}
                                        >
                                          {isMatch ? colaboradorLetra : ''}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {viewType === 'list' && (
                    <div className="space-y-8 print:space-y-0">
                      {groupScheduleByActiveMonths().map(monthGroup => (
                        <div key={monthGroup.id} className="print-page-break print:min-h-[190mm]">
                          <h3 className="font-bold text-lg mb-4 text-black uppercase print:text-black">{monthGroup.displayName}</h3>
                          <div className="border border-neutral-200 rounded-md print:border-none print:columns-2 print:gap-8">
                            {monthGroup.days.map((day, index) => (
                              <div 
                                key={day.id} 
                                className={`flex items-center justify-between p-4 print:p-1.5 print:mb-2 print:border print:border-neutral-200 print:rounded-md print:break-inside-avoid ${index !== monthGroup.days.length - 1 ? 'border-b border-neutral-100' : ''} ${day.isOff ? 'text-neutral-400 bg-neutral-50/50' : 'text-black bg-white'}`}
                              >
                                 <div className="flex gap-6 print:gap-3 items-center">
                                    <span className="w-12 print:w-8 text-xs uppercase tracking-wider font-medium">{formatDayOfWeek(day.date)}</span>
                                    <span className="w-20 print:w-16 font-light text-lg print:text-base">{formatDate(day.date)}</span>
                                 </div>
                                 <div className="flex gap-6 print:gap-3 items-center text-right">
                                    <span className="font-medium text-sm print:text-xs">{day.label}</span>
                                    <span className="w-24 print:w-16 text-xs tracking-wider">{day.isOff ? 'Folga' : day.time}</span>
                                 </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 print:hidden">
                <div className="p-4 bg-slate-100 rounded-full mb-4">
                  <RotateCcw className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium text-sm">A sua escala gerada aparecerá aqui.</p>
                <p className="text-slate-400 text-xs mt-1">Preencha os dados e clique em "Gerar Escala".</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
