import { PaymentRecord } from '@/contexts/PaymentsCacheContext';

const STATUS_LABEL: Record<string, string> = {
  approved: 'Согласован',
  pending: 'На согласовании',
  rejected: 'Отклонён',
  paid: 'Оплачен',
  cancelled: 'Отменён',
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  cash: 'Наличные',
  legal: 'Безналичные',
  card: 'Карта',
};

const fmtDate = (s: string) => {
  const d = new Date(s.includes('T') ? s : s + 'T00:00:00');
  if (isNaN(d.getTime())) return s;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const escXml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const cell = (value: string | number, isNum = false): string => {
  if (isNum) {
    return `<c t="n"><v>${value}</v></c>`;
  }
  const safe = escXml(String(value ?? ''));
  return `<c t="inlineStr"><is><t>${safe}</t></is></c>`;
};

const headerCell = (value: string): string => {
  const safe = escXml(value);
  return `<c t="inlineStr" s="1"><is><t>${safe}</t></is></c>`;
};

export const exportDrillDownToExcel = (
  payments: PaymentRecord[],
  label: string
): void => {
  const HEADERS = [
    'Описание / Сервис',
    'Категория',
    'Отдел',
    'Тип расчёта',
    'Дата',
    'Сумма (₽)',
  ];

  const headerRow = `<row r="1">
    ${HEADERS.map(h => headerCell(h)).join('')}
  </row>`;

  const dataRows = payments.map((p, i) => {
    const rowNum = i + 2;
    const description = p.description || p.service_name || p.contractor_name || '—';
    return `<row r="${rowNum}">
      ${cell(description)}
      ${cell(p.category_name || '—')}
      ${cell(p.department_name || '—')}
      ${cell(PAYMENT_TYPE_LABEL[p.payment_type || ''] || p.payment_type || '—')}
      ${cell(p.payment_date ? fmtDate(String(p.payment_date)) : '—')}
      ${cell(p.amount, true)}
    </row>`;
  });

  const totalRow = `<row r="${payments.length + 2}">
    ${cell('ИТОГО')}
    ${cell('')}${cell('')}${cell('')}${cell('')}
    ${cell(payments.reduce((s, p) => s + p.amount, 0), true)}
  </row>`;

  const sheetData = [headerRow, ...dataRows, totalRow].join('\n');

  const colWidths = [32, 22, 22, 16, 14, 16]
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colWidths}</cols>
  <sheetData>
${sheetData}
  </sheetData>
</worksheet>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF7551E9"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
  </cellXfs>
</styleSheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Детализация" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const files: Record<string, string> = {
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rootRels,
    'xl/workbook.xml': workbookXml,
    'xl/_rels/workbook.xml.rels': workbookRels,
    'xl/worksheets/sheet1.xml': sheetXml,
    'xl/styles.xml': stylesXml,
  };

  const zipBytes = buildZip(files);
  const blob = new Blob([zipBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `Детализация_${label}_${dateStr}.xlsx`;
  a.style.position = 'fixed';
  a.style.top = '-9999px';
  a.style.left = '-9999px';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode === document.body) document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
};

export const exportPaymentsToExcel = (
  payments: PaymentRecord[],
  periodLabel: string
): void => {
  const sorted = [...payments].sort((a, b) => {
    const da = new Date(String(a.payment_date)).getTime();
    const db = new Date(String(b.payment_date)).getTime();
    return da - db;
  });

  const HEADERS = [
    'Дата платежа',
    'Сервис',
    'Категория',
    'Отдел-заказчик',
    'Контрагент',
    'Юридическое лицо',
    'Тип расчёта',
    'Сумма (₽)',
    'Статус',
  ];

  const headerRow = `<row r="1">
    ${HEADERS.map(h => headerCell(h)).join('')}
  </row>`;

  const dataRows = sorted.map((p, i) => {
    const rowNum = i + 2;
    return `<row r="${rowNum}">
      ${cell(p.payment_date ? fmtDate(String(p.payment_date)) : '—')}
      ${cell(p.service_name || '—')}
      ${cell(p.category_name || '—')}
      ${cell(p.department_name || '—')}
      ${cell(p.contractor_name || '—')}
      ${cell(p.legal_entity_name || '—')}
      ${cell(PAYMENT_TYPE_LABEL[p.payment_type || ''] || p.payment_type || '—')}
      ${cell(p.amount, true)}
      ${cell(STATUS_LABEL[p.status || ''] || p.status || '—')}
    </row>`;
  });

  const totalRow = `<row r="${sorted.length + 2}">
    ${cell('ИТОГО')}
    ${cell('')}${cell('')}${cell('')}${cell('')}${cell('')}${cell('')}
    ${cell(sorted.reduce((s, p) => s + p.amount, 0), true)}
    ${cell('')}
  </row>`;

  const sheetData = [headerRow, ...dataRows, totalRow].join('\n');

  const colWidths = [16, 22, 22, 22, 22, 24, 16, 16, 18]
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colWidths}</cols>
  <sheetData>
${sheetData}
  </sheetData>
</worksheet>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF7551E9"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
  </cellXfs>
</styleSheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Платежи" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  // ZIP-формат вручную (OOXML = zip-архив)
  const files: Record<string, string> = {
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rootRels,
    'xl/workbook.xml': workbookXml,
    'xl/_rels/workbook.xml.rels': workbookRels,
    'xl/worksheets/sheet1.xml': sheetXml,
    'xl/styles.xml': stylesXml,
  };

  const zipBytes = buildZip(files);
  const blob = new Blob([zipBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `Платежи_${periodLabel}_${dateStr}.xlsx`;
  a.style.position = 'fixed';
  a.style.top = '-9999px';
  a.style.left = '-9999px';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode === document.body) document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
};

// ─── Минимальный ZIP builder ─────────────────────────────────────────────────

function strToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function crc32(data: Uint8Array): number {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff]);
}

function u32(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

function buildZip(files: Record<string, string>): Uint8Array {
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = strToBytes(name);
    const data = strToBytes(content);
    const crc = crc32(data);
    const size = data.length;

    const localHeader = concat(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      u16(20), u16(0), u16(0),
      u16(0), u16(0),
      u32(crc), u32(size), u32(size),
      u16(nameBytes.length), u16(0),
      nameBytes, data,
    );

    const centralHeader = concat(
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
      u16(20), u16(20), u16(0), u16(0),
      u16(0), u16(0),
      u32(crc), u32(size), u32(size),
      u16(nameBytes.length), u16(0), u16(0),
      u16(0), u16(0), u32(0),
      u32(offset),
      nameBytes,
    );

    localHeaders.push(localHeader);
    centralHeaders.push(centralHeader);
    offset += localHeader.length;
  }

  const centralDir = concat(...centralHeaders);
  const centralSize = centralDir.length;
  const fileCount = Object.keys(files).length;

  const eocd = concat(
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    u16(0), u16(0),
    u16(fileCount), u16(fileCount),
    u32(centralSize), u32(offset),
    u16(0),
  );

  return concat(...localHeaders, centralDir, eocd);
}