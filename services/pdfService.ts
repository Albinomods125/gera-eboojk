
import type { GeneratedContent } from '../types';

declare const jspdf: any;

export function createPdf(content: GeneratedContent): void {
  const { jsPDF } = jspdf;
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Title page
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(content.title, pageWidth - margin * 2);
  const titleHeight = doc.getTextDimensions(titleLines).h;
  const titleY = (pageHeight - titleHeight) / 2;
  doc.text(titleLines, pageWidth / 2, titleY, { align: 'center' });


  // Content sections
  content.sections.forEach((section, index) => {
    doc.addPage();
    y = margin;

    // Section Heading
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 150, 243); // A nice blue color
    const headingLines = doc.splitTextToSize(section.heading, pageWidth - margin * 2);
    doc.text(headingLines, margin, y);
    y += doc.getTextDimensions(headingLines).h + 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);


    // Image
    if (section.imageUrl) {
        try {
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = 80; 
            if (y + imgHeight + 10 > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.addImage(section.imageUrl, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 10;
        } catch(e) {
            console.error("Error adding image to PDF: ", e);
            doc.setFontSize(10);
            doc.setTextColor(255, 0, 0);
            doc.text("Error rendering image.", margin, y);
            y += 10;
        }
    }
    
    doc.setTextColor(50, 50, 50);

    // Section Content
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const contentLines = doc.splitTextToSize(section.content, pageWidth - margin * 2);
    
    contentLines.forEach((line: string) => {
        const lineHeight = doc.getTextDimensions(line).h;
        if (y + lineHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
    });

  });

  doc.save(`${content.title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
}
