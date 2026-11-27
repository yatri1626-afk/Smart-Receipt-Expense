import { Receipt } from '../types';

/**
 * Clean receipt printing utility that creates an isolated print frame or window.
 * Ensures the printed output is formatted like a thermal store receipt / tax invoice,
 * without background UI elements, headers, or dark-mode backgrounds leaking in.
 */
export function printReceipt(receipt: Receipt): void {
  const itemsRows = receipt.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 6px 4px; text-align: left; vertical-align: top; font-weight: 500;">
          ${escapeHtml(item.name)}
          <div style="font-size: 10px; color: #666; font-style: italic;">${escapeHtml(item.category || 'General')}</div>
        </td>
        <td style="padding: 6px 4px; text-align: center; vertical-align: top;">${item.quantity}</td>
        <td style="padding: 6px 4px; text-align: right; vertical-align: top;">₹${Number(item.unitPrice || 0).toFixed(2)}</td>
        <td style="padding: 6px 4px; text-align: right; vertical-align: top; font-weight: 600;">₹${Number(item.totalPrice || 0).toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const subtotal = Math.max(0, receipt.grandTotal - (receipt.tax || 0));

  const printHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${escapeHtml(receipt.shopName)} - ${escapeHtml(receipt.receiptNumber)}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 4mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Courier New', Courier, monospace, -apple-system, BlinkMacSystemFont, sans-serif;
          background: #ffffff;
          color: #000000;
          padding: 12px;
          max-width: 400px;
          margin: 0 auto;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 1px dashed #000;
          margin-bottom: 10px;
        }
        .shop-name {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
          text-transform: uppercase;
        }
        .shop-address {
          font-size: 11px;
          color: #333;
          margin-bottom: 4px;
        }
        .memo-badge {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 4px;
        }
        .meta-table {
          width: 100%;
          font-size: 11px;
          margin-bottom: 8px;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
        }
        .meta-table td {
          padding: 2px 0;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 10px;
        }
        .items-table th {
          border-bottom: 1px solid #000;
          padding: 4px;
          font-size: 10px;
          text-transform: uppercase;
        }
        .totals-table {
          width: 100%;
          border-top: 1px dashed #000;
          padding-top: 8px;
          font-size: 11px;
          margin-bottom: 10px;
        }
        .totals-table td {
          padding: 3px 0;
        }
        .grand-total-row {
          font-size: 14px;
          font-weight: 900;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }
        .grand-total-row td {
          padding: 6px 0 !important;
        }
        .nutrition-note {
          font-size: 10px;
          border: 1px dotted #666;
          padding: 6px;
          border-radius: 4px;
          margin: 10px 0;
          background: #f9f9f9;
        }
        .barcode {
          text-align: center;
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px dashed #000;
        }
        .barcode-bars {
          letter-spacing: 3px;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 2px;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          margin-top: 8px;
          color: #444;
        }
        @media print {
          body {
            padding: 0;
            width: 100%;
            max-width: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="shop-name">${escapeHtml(receipt.shopName)}</div>
        <div class="shop-address">${escapeHtml(receipt.shopAddress || 'Local Market')}</div>
        <div class="memo-badge">Tax Invoice / Cash Receipt</div>
      </div>

      <table class="meta-table">
        <tr>
          <td><strong>Bill No:</strong> ${escapeHtml(receipt.receiptNumber)}</td>
          <td style="text-align: right;"><strong>Date:</strong> ${escapeHtml(receipt.date)}</td>
        </tr>
        <tr>
          <td><strong>Mode:</strong> Digital / Cash</td>
          <td style="text-align: right;"><strong>Items:</strong> ${receipt.items.length}</td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: left;">Item</th>
            <th style="text-align: center; width: 35px;">Qty</th>
            <th style="text-align: right; width: 60px;">Rate</th>
            <th style="text-align: right; width: 65px;">Amt</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <table class="totals-table">
        <tr>
          <td>Subtotal</td>
          <td style="text-align: right;">₹${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Tax / GST</td>
          <td style="text-align: right;">₹${Number(receipt.tax || 0).toFixed(2)}</td>
        </tr>
        <tr class="grand-total-row">
          <td>TOTAL AMOUNT</td>
          <td style="text-align: right;">₹${Number(receipt.grandTotal || 0).toFixed(2)}</td>
        </tr>
      </table>

      ${
        receipt.healthSummary
          ? `
        <div class="nutrition-note">
          <strong>Expense Insight:</strong> ${escapeHtml(typeof receipt.healthSummary === 'string' ? receipt.healthSummary : 'Purchase categorized.')}
        </div>
      `
          : ''
      }

      <div class="barcode">
        <div class="barcode-bars">||||| | |||| ||| || | |||| ||| |</div>
        <div style="font-size: 9px; font-family: monospace;">*${escapeHtml(receipt.receiptNumber)}*</div>
      </div>

      <div class="footer">
        <div>Thank you for your visit!</div>
        <div style="font-size: 9px; color: #777; margin-top: 2px;">Expense Insight Hub • Verified Digital Receipt</div>
      </div>
    </body>
    </html>
  `;

  // Hidden print iframe strategy ensures isolation and doesn't affect main window or get blocked by popups
  let printIframe = document.getElementById('expense-insight-print-frame') as HTMLIFrameElement | null;
  if (!printIframe) {
    printIframe = document.createElement('iframe');
    printIframe.id = 'smartreceipt-print-frame';
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    printIframe.style.visibility = 'hidden';
    document.body.appendChild(printIframe);
  }

  const iframeDoc = printIframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(printHtml);
    iframeDoc.close();

    // Trigger printing once content is rendered
    setTimeout(() => {
      try {
        printIframe?.contentWindow?.focus();
        printIframe?.contentWindow?.print();
      } catch (err) {
        // Fallback for iframe restrictions: open standalone print window
        const win = window.open('', '_blank', 'width=450,height=650');
        if (win) {
          win.document.open();
          win.document.write(printHtml);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 300);
        } else {
          window.print();
        }
      }
    }, 250);
  } else {
    window.print();
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
