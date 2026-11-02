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

  // Preenche a data inicial com a data de hoje por defeito
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
    
    // Lógica para ir até ao ÚLTIMO dia do último mês selecionado
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
