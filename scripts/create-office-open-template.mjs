import { generateDocument } from "@office-open/docx";
import { writeFileSync } from "node:fs";

const result = await generateDocument({
  sections: [{
    paragraphs: [
      {
        type: "paragraph",
        runs: [
          { type: "text", text: "Cost Analysis Report", bold: true, size: 40 }
        ]
      },
      {
        type: "paragraph",
        runs: [
          { type: "text", text: "Application: " },
          { type: "text", text: "{{appName}}" }
        ]
      },
      {
        type: "paragraph",
        runs: [
          { type: "text", text: "Generated: " },
          { type: "text", text: "{{generatedAt}}" }
        ]
      },
      {
        type: "paragraph",
        runs: [
          { type: "text", text: "Summary: " },
          { type: "text", text: "{{summary}}" }
        ]
      }
    ]
  }]
});

writeFileSync("templates/office-open-template.docx", result);
console.log("Template saved: " + result.length + " bytes");
