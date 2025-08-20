import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Only POST supported');
    return;
  }

  try {
    const {
      companyName = "Experts Technology, Sangli",
      companyAddress = "Address Line 1, Sangli",
      doc_type = "Invoice",
      customer_name,
      customer_address,
      customer_phone,
      invoice_number,
      invoice_date,
      taxPercent = 0,
      discount = 0,
      items = []
    } = req.body;

    const invoiceNo = invoice_number || `INV${Date.now()}`;
    const invoiceDate = invoice_date || new Date().toLocaleDateString('en-GB');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${doc_type}-${invoiceNo}.pdf`);
    res.setHeader('x-filename', `${doc_type}-${invoiceNo}.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.pipe(res);

    // ✅ Unicode font (₹ support)
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans.ttf');
    const mainFont = fs.existsSync(fontPath) ? fontPath : 'Helvetica';
    doc.font(mainFont);

    // ✅ Logo
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 40, 30, { width: 60 });
      } catch (e) {}
    }

    // ✅ Company & Title
    doc.fontSize(18).text(companyName, 0, 35, { align: 'center' });
    doc.fontSize(12).fillColor('#444').text(companyAddress, { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#000').fontSize(14).text(doc_type.toUpperCase(), { align: 'center', underline: true });

    // ✅ Invoice Details (top right)
    doc.fontSize(10).font(mainFont);
    doc.text(`Invoice No: ${invoiceNo}`, 400, 60, { align: 'right' });
    doc.text(`Date: ${invoiceDate}`, 400, 75, { align: 'right' });

    // ✅ Customer Info
    doc.moveDown(2);
    doc.font(mainFont).fontSize(11).text('Billed To:', 50, 130);
    doc.font(mainFont).fontSize(10);
    if (customer_name) doc.text(customer_name, 50, 145);
    if (customer_address) doc.text(customer_address, 50, 160);
    if (customer_phone) doc.text(`Phone: ${customer_phone}`, 50, 175);

    // --- Table Setup ---
    const tableTop = 210;
    const colWidths = [40, 200, 80, 80, 100];
    const colX = [50, 90, 290, 370, 450];
    const rowHeight = 22;

    // --- Header Row ---
    doc.rect(50, tableTop - 6, 500, rowHeight).fill('#c8dcff').stroke();
    doc.fillColor('#000').font(mainFont).fontSize(10);

    const headers = ['S. No', 'Item Name', 'Price (₹)', 'Quantity', 'Total (₹)'];
    headers.forEach((h, i) => {
      doc.text(h, colX[i] + 2, tableTop, { width: colWidths[i] - 4, align: 'center' });
    });

    // --- Rows ---
    let y = tableTop + rowHeight;
    let subtotal = 0;

    (items || []).forEach((item, i) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseFloat(item.qty) || 0;
      const lineTotal = price * qty;
      subtotal += lineTotal;

      // Row border
      doc.rect(50, y - 6, 500, rowHeight).stroke();

      // Row cells
      doc.font(mainFont).fontSize(10);
      doc.text(String(i + 1), colX[0], y, { width: colWidths[0], align: 'center' });
      doc.text(item.name || '', colX[1] + 2, y, { width: colWidths[1] - 4, align: 'left' });
      doc.text(price.toFixed(2), colX[2], y, { width: colWidths[2], align: 'right' });
      doc.text(qty.toFixed(2), colX[3], y, { width: colWidths[3], align: 'right' });
      doc.text(lineTotal.toFixed(2), colX[4], y, { width: colWidths[4], align: 'right' });

      y += rowHeight;
      if (y > 700) { doc.addPage(); y = 50; }
    });

    // --- Vertical Lines ---
    for (let i = 0; i <= colX.length; i++) {
      const x = i === colX.length ? 550 : colX[i];
      doc.moveTo(x, tableTop - 6)
         .lineTo(x, y - 6)
         .stroke();
    }

    // --- Totals ---
    const taxAmount = subtotal * ((parseFloat(taxPercent) || 0) / 100);
    const discountAmount = parseFloat(discount) || 0;
    const grand = subtotal + taxAmount - discountAmount;

    y += 20;
    doc.font(mainFont).fontSize(10).fillColor('#000');
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 350, y);
    doc.text(`Tax (${taxPercent}%): ₹${taxAmount.toFixed(2)}`, 350, y + 15);
    doc.text(`Discount: -₹${discountAmount.toFixed(2)}`, 350, y + 30);

    doc.font(mainFont).fontSize(11).fillColor('#000')
       .text(`Grand Total: ₹${grand.toFixed(2)}`, 350, y + 50);

    // ✅ Footer
    doc.font(mainFont).fontSize(9).fillColor('#666');
    doc.text(
      'Thank you for your business! | Experts Technology, Sangli',
      50,
      780,
      { align: 'center', width: 500 }
    );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error: ' + String(err));
  }
}
