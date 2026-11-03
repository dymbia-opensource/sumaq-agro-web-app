import { FieldPlot } from '../../field-management/domain/model/entities/field-plot.entity';
import { SatelliteObservation } from '../domain/model/entities/satellite-observation.entity';

/** Creates a branded PNG from the recorded observation, without changing its values. */
export async function observationImage(plot: FieldPlot, observation: SatelliteObservation, labels: Record<string, string>, locale: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  const wrap = (text: string, width: number): string[] => {
    const lines: string[] = [];
    for (const paragraph of text.split(/\r?\n/)) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        if (context.measureText(line + ' ' + word).width > width && line) { lines.push(line); line = ''; }
        line += (line ? ' ' : '') + word;
      }
      lines.push(line);
    }
    return lines;
  };
  context.font = '26px Arial';
  const nameLines = wrap(plot.name, 1020);
  const regionLines = wrap(plot.region, 1020);
  const recommendationLines = wrap(observation.recommendation || labels['noData'], 1020);
  const detailsHeight = (nameLines.length + regionLines.length) * 36;
  canvas.height = 1000 + detailsHeight + recommendationLines.length * 36;
  context.fillStyle = '#f4f6ee'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff'; context.fillRect(40, 40, 1120, canvas.height - 80);
  context.fillStyle = '#005653'; context.fillRect(40, 40, 1120, 180);
  const logo = await new Promise<HTMLImageElement | null>(resolve => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = '/images/logo-sumaqagro.png';
  });
  if (logo) {
    context.fillStyle = '#ffffff'; context.fillRect(75, 75, 110, 110);
    const ratio = Math.min(90 / logo.naturalWidth, 90 / logo.naturalHeight);
    const width = logo.naturalWidth * ratio; const height = logo.naturalHeight * ratio;
    context.drawImage(logo, 130 - width / 2, 130 - height / 2, width, height);
  }
  context.fillStyle = '#ffffff'; context.font = 'bold 46px Arial'; context.fillText('SumaqAgro', 215, 115);
  context.font = '26px Arial'; context.fillText(labels['title'], 215, 165);
  const text = (value: string, x: number, y: number, size = 26, bold = false, color = '#163b35') => {
    context.fillStyle = color; context.font = (bold ? 'bold ' : '') + size + 'px Arial'; context.fillText(value, x, y);
  };
  let y = 285;
  text(labels['plot'], 90, y, 22, true, '#64756e'); y += 42;
  for (const line of nameLines) { text(line, 90, y, 30, true); y += 36; }
  for (const line of regionLines) { text(line, 90, y); y += 36; }
  y += 12;
  text(labels['capture'] + ': ' + new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(observation.date)) + ' (Lima)', 90, y, 24);
  y += 55;
  const metric = (label: string, value: string, x: number, color: string) => {
    context.fillStyle = '#edf4ed'; context.fillRect(x, y, 490, 160);
    text(label, x + 26, y + 45, 26, true, color);
    text(value, x + 26, y + 120, 62, true, color);
  };
  metric('NDVI', observation.ndviMean.toFixed(2), 90, '#16803c');
  metric('NDWI', observation.ndwiMean.toFixed(2), 620, '#0369a1');
  y += 220;
  text(labels['area'] + ': ' + plot.areaHectares.toFixed(2) + ' ha', 90, y);
  y += 45; text(labels['stress'] + ': ' + observation.stressAreaHectares.toFixed(2) + ' ha', 90, y);
  y += 45; text(labels['clouds'] + ': ' + observation.cloudCoveragePercent.toFixed(1) + '%', 90, y);
  y += 45; text(labels['temperature'] + ': ' + (observation.surfaceTempKelvin - 273.15).toFixed(1) + ' °C', 90, y);
  y += 70; text(labels['recommendation'], 90, y, 28, true); y += 45;
  for (const line of recommendationLines) { text(line, 90, y); y += 36; }
  context.strokeStyle = '#d3dfd5'; context.beginPath(); context.moveTo(90, canvas.height - 160); context.lineTo(1110, canvas.height - 160); context.stroke();
  text(labels['footer'], 90, canvas.height - 110, 20, false, '#64756e');
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
}
