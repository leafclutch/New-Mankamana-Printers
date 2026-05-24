import PDFDocument from "pdfkit";

export interface InvoiceData {
  orderId: string;
  businessName: string;
  customerName?: string | null;
  clientCode: string;
  clientPanVatNo?: string | null;
  clientAddress?: string | null;
  deliveryAddress?: string | null;
  email?: string | null;
  phone: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  designSurcharge: number;
  finalAmount: number;
  configurations: Array<{ group_label: string; selected_label: string }>;
  notes?: string | null;
  paymentMethod: string;
  acceptedAt: Date;
}

const COMPANY_NAME       = "New Mankamana Printers";
const COMPANY_NAME_L1    = "NEW MANKAMANA";
const COMPANY_NAME_L2    = "Printers";
const COMPANY_PAN        = "992762089";
const COMPANY_TAGLINE    = "Providing premium quality printing services across Nepal since 1995.\nYour trusted partner for corporate branding and wholesale print solutions.";
const COMPANY_ADDRESS    = "Traffic Chowk, (Jagriti Path), Butwal, Rupandehi, Nepal";
const COMPANY_PHONES     = [
  "+977 9804458995 (Office)",
  "+977 9705396330 (Office)",
];
const COMPANY_EMAIL      = "nmprinters2083@gmail.com";
const COMPANY_WEBSITE    = "https://www.mankamanaprinters.com.np/";

const money = (v: number) =>
  `NPR ${v.toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: "A4" });
    // Prevent PDFKit from ever adding a second page.
    doc.addPage = (() => doc) as typeof doc.addPage;

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const invoiceNumber = `INV-${data.orderId.slice(0, 8).toUpperCase()}`;
    const acceptedStr   = data.acceptedAt.toLocaleDateString("en-NP", { dateStyle: "long" });
    const baseTotal     = Number((data.unitPrice * data.quantity).toFixed(2));

    const LM       = 36;                          // left margin
    const RM       = doc.page.width - 36;         // right edge
    const tableW   = doc.page.width - 72;         // usable width
    const footerY  = doc.page.height - 55;        // footer separator position

    let y = LM;

    doc.fillColor("#000000");

    // ── HEADER ─────────────────────────────────────────────────────────────
    // Left block: company name + tagline
    doc.font("Helvetica-Bold").fontSize(19).text(COMPANY_NAME_L1, LM, y);
    doc.font("Helvetica-Bold").fontSize(14).text(COMPANY_NAME_L2, LM, y + 23);
    const taglineY = y + 42;
    doc.font("Helvetica").fontSize(7).fillColor("#444444")
      .text(COMPANY_TAGLINE, LM, taglineY, { width: 265, lineGap: 1 });
    const leftBottom = taglineY + doc.heightOfString(COMPANY_TAGLINE, { width: 265, lineGap: 1 });

    // Right block: contact details
    const CX = 335;
    const CW = RM - CX;
    doc.fillColor("#000000");
    doc.font("Helvetica-Bold").fontSize(8).text("Head Office", CX, y, { width: CW });
    const contactBlockY = y + 11;
    const contactBlock = [
      COMPANY_ADDRESS,
      ...COMPANY_PHONES,
      COMPANY_EMAIL,
      COMPANY_WEBSITE,
    ].join("\n");
    doc.font("Helvetica").fontSize(7.5)
      .text(contactBlock, CX, contactBlockY, { width: CW, lineGap: 1 });
    const rightBottom = contactBlockY + doc.heightOfString(contactBlock, { width: CW, lineGap: 1 });

    y = Math.max(leftBottom, rightBottom) + 10;

    // Header separator (thick)
    doc.moveTo(LM, y).lineTo(RM, y).strokeColor("#000000").lineWidth(1.5).stroke();
    y += 8;

    // ── INVOICE TITLE ──────────────────────────────────────────────────────
    doc.fillColor("#000000");
    doc.font("Helvetica-Bold").fontSize(13).text("TAX INVOICE", LM, y);
    doc.font("Helvetica").fontSize(8.5)
      .text(invoiceNumber,       RM - 200, y,      { width: 200, align: "right" })
      .text(`Date: ${acceptedStr}`, RM - 200, y + 13, { width: 200, align: "right" });

    y += 32;
    doc.moveTo(LM, y).lineTo(RM, y).strokeColor("#000000").lineWidth(0.5).stroke();
    y += 10;

    // ── BILL TO / ORDER DETAILS ────────────────────────────────────────────
    const billToX  = LM;
    const orderX   = 320;
    const billToW  = 260;
    const orderW   = RM - orderX;

    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#666666")
      .text("BILL TO", billToX, y)
      .text("ORDER DETAILS", orderX, y);
    y += 12;

    // Business name (large)
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#000000")
      .text(data.businessName, billToX, y, { width: billToW });
    const nameH = doc.heightOfString(data.businessName, { width: billToW });
    let clientY = y + nameH + 4;

    // Contact person if different from business name
    if (data.customerName && data.customerName !== data.businessName) {
      doc.font("Helvetica").fontSize(8.5).fillColor("#333333")
        .text(data.customerName, billToX, clientY, { width: billToW });
      clientY += 12;
    }

    // Remaining client detail rows
    type DetailRow = [string, string];
    const detailRows: DetailRow[] = [];
    if (data.clientCode)     detailRows.push(["Client Code", data.clientCode]);
    if (data.clientAddress)  detailRows.push(["Address", data.clientAddress]);
    if (data.deliveryAddress && data.deliveryAddress !== data.clientAddress)
                             detailRows.push(["Delivery", data.deliveryAddress]);
    if (data.phone)          detailRows.push(["Phone", data.phone]);
    if (data.email)          detailRows.push(["Email", data.email]);
    if (data.clientPanVatNo) detailRows.push(["PAN/VAT No.", data.clientPanVatNo]);

    const LABEL_W = 64;
    const VALUE_X = billToX + LABEL_W + 4;
    const VALUE_W = billToW - LABEL_W - 4;

    doc.font("Helvetica").fontSize(8);
    for (const [label, value] of detailRows) {
      const rowH = Math.max(11, doc.heightOfString(value, { width: VALUE_W }));
      doc.fillColor("#888888").text(`${label}:`, billToX, clientY, { width: LABEL_W });
      doc.fillColor("#000000").text(value, VALUE_X, clientY, { width: VALUE_W, lineGap: 0 });
      clientY += rowH + 2;
    }

    // Order details column
    const orderRows: DetailRow[] = [
      ["Invoice No.", invoiceNumber],
      ["Order No.", `#${data.orderId.slice(0, 8).toUpperCase()}`],
      ["Date", acceptedStr],
      ["Payment", data.paymentMethod],
    ];
    let orderY = y;
    doc.font("Helvetica").fontSize(8);
    for (const [label, value] of orderRows) {
      doc.fillColor("#888888").text(`${label}:`, orderX, orderY, { width: 62 });
      doc.fillColor("#000000").text(value, orderX + 66, orderY, { width: orderW - 66 });
      orderY += 13;
    }

    y = Math.max(clientY, orderY) + 10;

    // ── ITEM TABLE ─────────────────────────────────────────────────────────
    const ROW_H = 22;

    // Header row (shaded)
    doc.rect(LM, y, tableW, ROW_H).fillColor("#eeeeee").strokeColor("#000000").lineWidth(1).fillAndStroke();
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(8);
    doc.text("DESCRIPTION", LM + 8,      y + 7);
    doc.text("UNIT PRICE",  300,          y + 7);
    doc.text("QTY",         390,          y + 7);
    doc.text("AMOUNT",      RM - 90, y + 7, { width: 90, align: "right" });
    y += ROW_H;

    // Product row
    doc.rect(LM, y, tableW, 40).strokeColor("#000000").lineWidth(1).stroke();
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9.5)
      .text(data.productName, LM + 8, y + 6, { width: 220 });
    doc.font("Helvetica").fontSize(8.5)
      .text(data.variantName, LM + 8, y + 19, { width: 220 })
      .text(money(data.unitPrice),                 300,    y + 6)
      .text(String(data.quantity.toLocaleString()), 390,    y + 6);
    doc.font("Helvetica-Bold")
      .text(money(baseTotal), RM - 90, y + 6, { width: 90, align: "right" });
    y += 40;

    // Discount row (optional)
    if (data.discountAmount > 0) {
      doc.rect(LM, y, tableW, 24).strokeColor("#000000").lineWidth(1).stroke();
      doc.font("Helvetica").fontSize(9).fillColor("#000000").text("Discount", LM + 8, y + 7);
      doc.text(`- ${money(data.discountAmount)}`, RM - 100, y + 7, { width: 100, align: "right" });
      y += 24;
    }

    // Total row (shaded)
    doc.rect(LM, y, tableW, 30).fillColor("#f5f5f5").strokeColor("#000000").lineWidth(1).fillAndStroke();
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(10).text("TOTAL AMOUNT", LM + 8, y + 9);
    doc.fontSize(12).text(money(data.finalAmount), RM - 120, y + 8, { width: 120, align: "right" });
    y += 42;

    // ── PRINT SPECIFICATIONS ───────────────────────────────────────────────
    if (data.configurations.length > 0) {
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000000").text("PRINT SPECIFICATIONS", LM, y);
      y += 13;
      for (const c of data.configurations) {
        if (y + 19 > footerY - 75) break;
        doc.rect(LM, y, tableW, 19).strokeColor("#000000").lineWidth(0.5).stroke();
        doc.font("Helvetica").fontSize(8.5).fillColor("#000000")
          .text(c.group_label,   LM + 8, y + 5, { width: 180 });
        doc.font("Helvetica-Bold")
          .text(c.selected_label, 250,    y + 5, { width: 280 });
        y += 19;
      }
      y += 8;
    }

    // ── REMARKS ────────────────────────────────────────────────────────────
    if (data.notes) {
      const noteH = Math.min(44, Math.max(26,
        doc.heightOfString(data.notes, { width: tableW - 16 }) + 12));
      if (y + noteH + 13 < footerY - 58) {
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000000").text("REMARKS", LM, y);
        y += 12;
        doc.rect(LM, y, tableW, noteH).strokeColor("#000000").lineWidth(0.5).stroke();
        doc.font("Helvetica").fontSize(8.5)
          .text(data.notes, LM + 8, y + 6, { width: tableW - 16, height: noteH - 12 });
        y += noteH + 10;
      }
    }

    // ── TERMS & CONDITIONS ─────────────────────────────────────────────────
    if (y > footerY - 68) y = footerY - 68;
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#000000").text("TERMS & CONDITIONS", LM, y);
    y += 11;
    const tcLines = [
      "1. B2B orders only. Submitted content remains the client's legal responsibility.",
      "2. Exact colour matching between separate print runs is not guaranteed.",
      "3. Risk transfers to the client or nominated delivery agent after dispatch.",
      "4. Maximum liability is limited to the invoice value of the disputed order.",
    ];
    doc.font("Helvetica").fontSize(6.5).fillColor("#000000");
    for (const line of tcLines) {
      if (y + doc.currentLineHeight() > footerY - 6) break;
      doc.text(line, LM, y, { width: tableW, lineGap: 0 });
      y += doc.currentLineHeight() + 2;
    }

    // ── FOOTER ─────────────────────────────────────────────────────────────
    doc.moveTo(LM, footerY).lineTo(RM, footerY).strokeColor("#000000").lineWidth(1).stroke();
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000000")
      .text(COMPANY_NAME, LM, footerY + 7, { width: tableW, align: "center" });
    doc.font("Helvetica").fontSize(7.2)
      .text(
        `PAN/VAT: ${COMPANY_PAN}`,
        LM, footerY + 20,
        { width: tableW, align: "center" },
      );
    doc.text(
      `Head Office: ${COMPANY_ADDRESS}`,
      LM, footerY + 30,
      { width: tableW, align: "center" },
    );
    doc.text(
      `Contact: ${COMPANY_PHONES.join(" | ")}  |  Email: ${COMPANY_EMAIL}  |  Web: ${COMPANY_WEBSITE}`,
      LM, footerY + 40,
      { width: tableW, align: "center" },
    );

    doc.end();
  });
}
