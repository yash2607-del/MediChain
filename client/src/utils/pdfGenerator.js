import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a professional pharmacy bill PDF
 * @param {Object} billData - Bill data including items, customer, totals
 * @param {Object} pharmacyInfo - Pharmacy information
 * @returns {jsPDF} - PDF document
 */
export const generateBillPDF = (billData, pharmacyInfo = {}) => {
  const doc = new jsPDF();
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Colors
  const primaryColor = [102, 126, 234]; // #667eea
  const textColor = [15, 23, 42]; // #0f172a
  const lightGray = [241, 245, 249]; // #f1f5f9
  
  // Header with gradient background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Logo/Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('MediChain Pharmacy', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(pharmacyInfo.name || 'Professional Healthcare Services', margin, 35);
  doc.text(pharmacyInfo.address || '123 Healthcare Street, Medical District', margin, 42);
  
  // Invoice title
  doc.setTextColor(...textColor);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${billData.billNo || 'N/A'}`, pageWidth - margin, 35, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, 42, { align: 'right' });
  
  // Customer Information Section
  let yPosition = 65;
  
  doc.setFillColor(...lightGray);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'F');
  
  yPosition += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', margin + 5, yPosition);
  
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(billData.customer?.name || 'Walk-in Customer', margin + 5, yPosition);
  
  if (billData.customer?.phone) {
    yPosition += 5;
    doc.text(`Phone: ${billData.customer.phone}`, margin + 5, yPosition);
  }
  
  if (billData.customer?.doctor) {
    yPosition += 5;
    doc.text(`Prescribing Doctor: ${billData.customer.doctor}`, margin + 5, yPosition);
  }
  
  // Payment method
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT:', pageWidth - margin - 60, yPosition - 12);
  doc.setFont('helvetica', 'normal');
  doc.text(billData.payment || 'Cash', pageWidth - margin - 60, yPosition - 6);
  
  // Items table
  yPosition += 15;
  
  const tableData = billData.items.map(item => [
    item.name,
    item.drugCode || 'N/A',
    `₹${item.price.toFixed(2)}`,
    item.qty.toString(),
    `₹${(item.price * item.qty).toFixed(2)}`
  ]);
  
  doc.autoTable({
    startY: yPosition,
    head: [['Medicine Name', 'Code', 'Price', 'Qty', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: {
      fillColor: lightGray
    }
  });
  
  // Totals section
  yPosition = doc.lastAutoTable.finalY + 15;
  
  const totalsX = pageWidth - margin - 60;
  const labelX = totalsX - 50;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Subtotal
  doc.text('Subtotal:', labelX, yPosition, { align: 'right' });
  doc.text(`₹${billData.subtotal.toFixed(2)}`, totalsX, yPosition, { align: 'right' });
  
  // Tax
  yPosition += 7;
  doc.text('Tax (12% GST):', labelX, yPosition, { align: 'right' });
  doc.text(`₹${billData.tax.toFixed(2)}`, totalsX, yPosition, { align: 'right' });
  
  // Discount
  if (billData.discount > 0) {
    yPosition += 7;
    doc.text('Discount:', labelX, yPosition, { align: 'right' });
    doc.text(`-₹${billData.discount.toFixed(2)}`, totalsX, yPosition, { align: 'right' });
  }
  
  // Grand Total
  yPosition += 10;
  doc.setLineWidth(0.5);
  doc.line(labelX - 5, yPosition - 3, totalsX + 5, yPosition - 3);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('GRAND TOTAL:', labelX, yPosition + 5, { align: 'right' });
  doc.text(`₹${billData.total.toFixed(2)}`, totalsX, yPosition + 5, { align: 'right' });
  
  // Footer
  const footerY = pageHeight - 30;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('Thank you for choosing our pharmacy!', pageWidth / 2, footerY, { align: 'center' });
  doc.text('For any queries, please contact us at: support@medichain.com', pageWidth / 2, footerY + 5, { align: 'center' });
  
  // Barcode/QR placeholder
  doc.setFontSize(8);
  doc.text(`Bill ID: ${billData._id || billData.billNo}`, margin, footerY + 10);
  
  // Border
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
  
  return doc;
};

/**
 * Download bill as PDF
 */
export const downloadBillPDF = (billData, pharmacyInfo, filename) => {
  const doc = generateBillPDF(billData, pharmacyInfo);
  doc.save(filename || `invoice-${billData.billNo || Date.now()}.pdf`);
};

/**
 * Print bill PDF
 */
export const printBillPDF = (billData, pharmacyInfo) => {
  const doc = generateBillPDF(billData, pharmacyInfo);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};
