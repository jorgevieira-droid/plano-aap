import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React from 'react';

export interface PdfHeaderInfo {
  title: string;
  subtitle?: string;
}

async function loadImg(path: () => Promise<{ default: string }>): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const mod = await path();
    img.src = mod.default;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      setTimeout(rej, 3000);
    });
    return img;
  } catch {
    return null;
  }
}

export interface ExportSection {
  node: React.ReactElement;
}

/**
 * Render React sections to A4 PDF with Bússola+Parceiros header.
 * Mirrors the logic used by EvolucaoProfessorPage.
 */
export async function exportSectionsToPdf(
  sections: ExportSection[],
  filename: string,
  header: PdfHeaderInfo,
): Promise<void> {
  const a4Width = 210;
  const a4Height = 297;
  const margin = 8;
  const headerHeight = 20;
  const contentWidth = a4Width - margin * 2;
  const contentStartY = headerHeight + 4;
  const availableHeight = a4Height - contentStartY - margin;

  const logoImg = await loadImg(() => import('@/assets/pe-logo-branco-horizontal.png'));
  const bussolaImg = await loadImg(() => import('@/assets/logo-bussola-branco.png'));

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const addHeader = () => {
    pdf.setFillColor(26, 58, 92);
    pdf.rect(0, 0, a4Width, headerHeight, 'F');
    let logosEndX = margin;
    if (logoImg) {
      const ratio = logoImg.naturalWidth / logoImg.naturalHeight;
      const h = 8;
      const w = h * ratio;
      pdf.addImage(logoImg, 'PNG', margin, (headerHeight - h) / 2, w, h);
      logosEndX += w;
    }
    if (bussolaImg) {
      const ratio = bussolaImg.naturalWidth / bussolaImg.naturalHeight;
      const h = 8;
      const w = h * ratio;
      pdf.addImage(bussolaImg, 'PNG', logosEndX + 3, (headerHeight - h) / 2, w, h);
      logosEndX += 3 + w;
    }
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    const titleX = logosEndX + 4;
    pdf.text(header.title, titleX, 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    if (header.subtitle) pdf.text(header.subtitle, titleX, 13);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const txt = `Gerado em ${dateStr}`;
    pdf.text(txt, a4Width - margin - pdf.getTextWidth(txt), 13);
  };

  let isFirstPage = true;

  for (const section of sections) {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1000px';
    container.style.backgroundColor = '#ffffff';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(section.node);
    await new Promise(r => setTimeout(r, 250));

    if (container.offsetHeight < 10) {
      root.unmount();
      document.body.removeChild(container);
      continue;
    }

    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 1000,
      windowWidth: 1000,
    });

    root.unmount();
    document.body.removeChild(container);

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const scaleFactor = contentWidth / (imgWidth / 1.5);
    const sourceSliceHeight = (availableHeight / scaleFactor) * 1.5;

    let sourceY = 0;
    while (sourceY < imgHeight) {
      if (!isFirstPage) pdf.addPage();
      addHeader();
      isFirstPage = false;
      const slice = document.createElement('canvas');
      const ctx = slice.getContext('2d');
      const actualSliceHeight = Math.min(sourceSliceHeight, imgHeight - sourceY);
      slice.width = imgWidth;
      slice.height = actualSliceHeight;
      if (ctx) {
        ctx.drawImage(canvas, 0, sourceY, imgWidth, actualSliceHeight, 0, 0, imgWidth, actualSliceHeight);
        const sliceData = slice.toDataURL('image/jpeg', 0.85);
        const sliceScaledHeight = (actualSliceHeight / 1.5) * scaleFactor;
        pdf.addImage(sliceData, 'JPEG', margin, contentStartY, contentWidth, sliceScaledHeight);
      }
      sourceY += sourceSliceHeight;
    }
  }

  pdf.save(filename);
}
