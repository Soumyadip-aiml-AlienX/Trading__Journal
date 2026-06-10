import { jsPDF } from 'jspdf';

// Helper to convert image URL to base64
async function getBase64FromUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Failed to convert image to base64:', e);
    return '';
  }
}

export async function generateDailyPDF(dateStr: string, trades: any[], dailyLog: any) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 26, 46]; // Navy #0F1A2E
  const accentColor = [59, 130, 246]; // Accent Blue #3B82F6
  const winColor = [29, 158, 117]; // Green #1D9E75
  const lossColor = [226, 75, 74]; // Red #E24B4A

  const drawHeader = (title: string, pageNum: number) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 24, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ALIENX TRADING JOURNAL', 14, 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 210 - 14 - doc.getTextWidth(title), 15);
    
    // Page number bottom
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`Page ${pageNum}`, 210 - 14 - doc.getTextWidth(`Page ${pageNum}`), 285);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 285);
  };

  // PAGE 1: COVER PAGE
  drawHeader(`Daily Report — ${new Date(dateStr).toLocaleDateString()}`, 1);

  // Cover Card
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 35, 182, 60, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 35, 182, 60, 'S');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Trading Report', 20, 52);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 62);
  doc.text(`Phase: ${dailyLog?.challengePhase || 'Phase 1'}`, 20, 70);

  // Daily Stats Grid
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 105, 182, 45, 'F');
  
  const totalPnl = trades
    .filter((t) => t.status === 'closed' && t.actualPnlPct !== null)
    .reduce((s, t) => s + t.actualPnlPct, 0);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DAILY PERFORMANCE SUMMARY', 20, 115);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Trades Taken: ${trades.length}`, 20, 127);
  doc.text(`Mental Readiness Score: ${dailyLog?.readinessScore?.toFixed(1) || 'N/A'}/10`, 20, 137);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Net Daily P&L:', 120, 127);
  
  if (totalPnl >= 0) {
    doc.setTextColor(winColor[0], winColor[1], winColor[2]);
    doc.text(`+${totalPnl.toFixed(2)}%`, 160, 127);
  } else {
    doc.setTextColor(lossColor[0], lossColor[1], lossColor[2]);
    doc.text(`${totalPnl.toFixed(2)}%`, 160, 127);
  }

  // Pre-Session Check-in box
  if (dailyLog) {
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 160, 182, 50, 'F');
    doc.rect(14, 160, 182, 50, 'S');

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PRE-SESSION PSYCHOLOGY', 20, 170);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mental State: ${dailyLog.mentalState}/10`, 20, 180);
    doc.text(`Physical State: ${dailyLog.physicalState}`, 20, 188);
    doc.text(`Market Confidence: ${dailyLog.marketConfidence}/10`, 20, 196);
    doc.text(`Sleep Quality: ${dailyLog.sleepQuality}`, 100, 180);
    doc.text(`Distraction Level: ${dailyLog.distractionLevel}`, 100, 188);
  }

  // PAGE 2: TRADES LIST TABLE
  let pageCount = 2;
  doc.addPage();
  drawHeader('Trade Logs Summary', pageCount);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Trades Logged Today', 14, 35);

  let yOffset = 45;
  
  // Custom Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, yOffset, 182, 8, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('ID', 16, yOffset + 5.5);
  doc.text('ASSET', 32, yOffset + 5.5);
  doc.text('DIR', 55, yOffset + 5.5);
  doc.text('ENTRY', 70, yOffset + 5.5);
  doc.text('EXIT', 92, yOffset + 5.5);
  doc.text('RISK', 114, yOffset + 5.5);
  doc.text('RR', 132, yOffset + 5.5);
  doc.text('P&L', 152, yOffset + 5.5);
  doc.text('STATUS', 174, yOffset + 5.5);

  yOffset += 8;

  trades.forEach((t) => {
    // Row background
    if (t.status === 'closed') {
      if ((t.actualPnlPct || 0) > 0) doc.setFillColor(240, 253, 250); // Win bg
      else doc.setFillColor(254, 242, 242); // Loss bg
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(14, yOffset, 182, 8, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(14, yOffset + 8, 196, yOffset + 8);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 26, 46);
    
    doc.text(t.tradeCode, 16, yOffset + 5.5);
    doc.text(t.asset, 32, yOffset + 5.5);
    
    if (t.direction === 'BUY') doc.setTextColor(winColor[0], winColor[1], winColor[2]);
    else doc.setTextColor(lossColor[0], lossColor[1], lossColor[2]);
    doc.text(t.direction, 55, yOffset + 5.5);
    
    doc.setTextColor(15, 26, 46);
    doc.text(t.entryPrice.toFixed(2), 70, yOffset + 5.5);
    doc.text(t.exitPrice?.toFixed(2) || '—', 92, yOffset + 5.5);
    doc.text(`${t.riskPips?.toFixed(1) || '0'} pts`, 114, yOffset + 5.5);
    doc.text(t.rr1 ? `1:${t.rr1.toFixed(1)}` : '—', 132, yOffset + 5.5);

    if (t.status === 'closed') {
      if ((t.actualPnlPct || 0) >= 0) {
        doc.setTextColor(winColor[0], winColor[1], winColor[2]);
        doc.text(`+${t.actualPnlPct.toFixed(2)}%`, 152, yOffset + 5.5);
      } else {
        doc.setTextColor(lossColor[0], lossColor[1], lossColor[2]);
        doc.text(`${t.actualPnlPct.toFixed(2)}%`, 152, yOffset + 5.5);
      }
    } else {
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('OPEN', 152, yOffset + 5.5);
    }

    doc.setTextColor(15, 26, 46);
    doc.text(t.status.toUpperCase(), 174, yOffset + 5.5);

    yOffset += 8;
  });

  // PAGE 3+: INDIVIDUAL TRADES DETAIL SPREAD
  for (const t of trades) {
    pageCount++;
    doc.addPage();
    drawHeader(`Trade Details — ${t.tradeCode}`, pageCount);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${t.tradeCode}: ${t.asset} ${t.direction}`, 14, 35);

    // Params Grid
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 40, 182, 35, 'F');
    doc.rect(14, 40, 182, 35, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('ENTRY PRICE', 20, 48);
    doc.text('STOP LOSS', 60, 48);
    doc.text('EXIT PRICE', 100, 48);
    doc.text('RR RATIO', 140, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(t.entryPrice.toFixed(2), 20, 54);
    
    doc.setTextColor(lossColor[0], lossColor[1], lossColor[2]);
    doc.text(t.stopLoss.toFixed(2), 60, 54);
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(t.exitPrice?.toFixed(2) || '—', 100, 54);
    doc.text(t.rr1 ? `1:${t.rr1.toFixed(1)}` : '—', 140, 54);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('SETUP TYPE', 20, 64);
    doc.text('SESSION', 60, 64);
    doc.text('PNL PERCENT', 100, 64);
    doc.text('CONFLUENCE', 140, 64);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    
    const setups: string[] = JSON.parse(t.setupTypes || '[]');
    doc.text(setups.join(', ') || 'N/A', 20, 70);
    doc.text(t.session, 60, 70);

    if (t.status === 'closed') {
      if ((t.actualPnlPct || 0) >= 0) {
        doc.setTextColor(winColor[0], winColor[1], winColor[2]);
        doc.text(`+${t.actualPnlPct.toFixed(2)}%`, 100, 70);
      } else {
        doc.setTextColor(lossColor[0], lossColor[1], lossColor[2]);
        doc.text(`${t.actualPnlPct.toFixed(2)}%`, 100, 70);
      }
    } else {
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('OPEN', 100, 70);
    }

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${t.checklistScore}/36`, 140, 70);

    // Pre Reasoning & Post Notes
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Pre-Trade Reasoning:', 14, 86);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(t.preReasoning || 'N/A', 14, 92, { maxWidth: 182 });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Post-Trade Notes:', 14, 115);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(t.postNotes || 'N/A', 14, 121, { maxWidth: 182 });

    // Render screenshots if available
    const parsedScreenshots: string[] = JSON.parse(t.screenshots || '[]');
    if (parsedScreenshots.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Trade Screenshots:', 14, 150);

      let imageX = 14;
      const imgWidth = 55;
      const imgHeight = 31;
      
      for (let i = 0; i < Math.min(parsedScreenshots.length, 3); i++) {
        const base64 = await getBase64FromUrl(parsedScreenshots[i]);
        if (base64) {
          try {
            doc.addImage(base64, 'PNG', imageX, 156, imgWidth, imgHeight);
            imageX += imgWidth + 5;
          } catch (imgError) {
            console.error('Error adding image to PDF:', imgError);
          }
        }
      }
    }
  }

  // PAGE N: DAILY REFLECTION
  if (dailyLog && (dailyLog.lessonLearned || dailyLog.marketBias)) {
    pageCount++;
    doc.addPage();
    drawHeader('Daily Reflection', pageCount);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('End of Day Reflection', 14, 35);

    doc.setFillColor(248, 250, 252);
    doc.rect(14, 40, 182, 100, 'F');
    doc.rect(14, 40, 182, 100, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Market Bias:', 20, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(dailyLog.marketBias || 'Neutral', 60, 50);

    doc.setFont('helvetica', 'bold');
    doc.text('Biggest Success:', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(dailyLog.biggestSuccess || 'N/A', 60, 60, { maxWidth: 130 });

    doc.setFont('helvetica', 'bold');
    doc.text('Biggest Mistake:', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(dailyLog.biggestMistake || 'N/A', 60, 75, { maxWidth: 130 });

    doc.setFont('helvetica', 'bold');
    doc.text('Key Lesson Learned:', 20, 92);
    doc.setFont('helvetica', 'normal');
    doc.text(dailyLog.lessonLearned || 'N/A', 60, 92, { maxWidth: 130 });

    doc.setFont('helvetica', 'bold');
    doc.text('Tomorrow\'s Plan:', 20, 115);
    doc.setFont('helvetica', 'normal');
    doc.text(dailyLog.tomorrowPlan || 'N/A', 60, 115, { maxWidth: 130 });
  }

  // Save the PDF
  doc.save(`ALIENX_JOURNAL_DAILY_${dateStr}.pdf`);
}

export async function generateWeeklyPDF(startDateStr: string, endDateStr: string, trades: any[], dailyLogs: any[]) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 26, 46];
  const winColor = [29, 158, 117];
  const lossColor = [226, 75, 74];

  const drawHeader = (title: string, pageNum: number) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 24, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ALIENX TRADING JOURNAL', 14, 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 210 - 14 - doc.getTextWidth(title), 15);
    
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`Page ${pageNum}`, 210 - 14 - doc.getTextWidth(`Page ${pageNum}`), 285);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 285);
  };

  // PAGE 1: COVER
  drawHeader('Weekly Performance Rollup', 1);

  doc.setFillColor(248, 250, 252);
  doc.rect(14, 35, 182, 60, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 35, 182, 60, 'S');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Performance Report', 20, 52);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Period: ${new Date(startDateStr).toLocaleDateString()} — ${new Date(endDateStr).toLocaleDateString()}`, 20, 62);
  doc.text(`Total Trades Logged: ${trades.length}`, 20, 70);

  // Performance Box
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 105, 182, 50, 'F');

  const closedTrades = trades.filter(t => t.status === 'closed' && t.actualPnlPct !== null);
  const weeklyPnl = closedTrades.reduce((s, t) => s + t.actualPnlPct, 0);
  const wins = closedTrades.filter(t => t.actualPnlPct > 0).length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('WEEKLY STATISTICS', 20, 115);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Win Rate: ${winRate.toFixed(1)}%`, 20, 127);
  doc.text(`Closed Trades: ${closedTrades.length}`, 20, 135);
  doc.text(`Open Draft Trades: ${trades.length - closedTrades.length}`, 20, 143);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Net Weekly P&L:', 110, 127);
  
  if (weeklyPnl >= 0) {
    doc.setTextColor(winColor[0], winColor[1], winColor[2]);
    doc.text(`+${weeklyPnl.toFixed(2)}%`, 150, 127);
  } else {
    doc.setTextColor(lossColor[0], lossColor[1], lossColor[2]);
    doc.text(`${weeklyPnl.toFixed(2)}%`, 150, 127);
  }

  // Key Lessons roll up
  const lessons = dailyLogs.filter(log => log.lessonLearned).map(log => ({
    date: log.date,
    lesson: log.lessonLearned
  }));

  if (lessons.length > 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 165, 182, 90, 'F');
    doc.rect(14, 165, 182, 90, 'S');

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('WEEKLY LESSONS LEARNED', 20, 175);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    let lessonY = 185;
    lessons.forEach((l, idx) => {
      if (idx < 5) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${new Date(l.date).toLocaleDateString('en-US', { weekday: 'short' })}:`, 20, lessonY);
        doc.setFont('helvetica', 'normal');
        doc.text(l.lesson, 32, lessonY, { maxWidth: 155 });
        lessonY += 14;
      }
    });
  }

  doc.save(`ALIENX_JOURNAL_WEEKLY_${startDateStr}_to_${endDateStr}.pdf`);
}
