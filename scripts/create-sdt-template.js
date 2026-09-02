const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

// Create a minimal DOCX with content controls (w:sdt) that Maven Mule might recognize
const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
<w:p><w:r><w:t>Hello World</w:t></w:r></w:p>
<w:p>
<w:sdt>
<w:sdtPr>
<w:tag w:val="appName"/>
<w:id w:val="1"/>
</w:sdtPr>
<w:sdtContent>
<w:r><w:t>placeholder</w:t></w:r>
</w:sdtContent>
</w:sdt>
</w:p>
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
</w:body>
</w:document>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

async function createDocx() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rels);
  zip.file('word/document.xml', docXml);
  zip.file('word/_rels/document.xml.rels', wordRels);
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const outPath = path.join(__dirname, '..', 'templates', 'sdt-test.docx');
  fs.writeFileSync(outPath, buf);
  console.log('SDT template saved: ' + buf.length + ' bytes to ' + outPath);
}
createDocx().catch(console.error);
