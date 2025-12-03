import * as docx from "docx";

/**
 * Generate DOCX document from markdown content
 * Used for both client-side export and server-side storage
 */
export async function generateDocxFromMarkdown(
  markdownContent: string,
  symbol: string
): Promise<Buffer> {
  const markdownLines = markdownContent.split("\n");
  const docxChildren: docx.Paragraph[] = [];

  markdownLines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    let paragraph = new docx.Paragraph({});
    if (trimmedLine.startsWith("# ")) {
      paragraph = new docx.Paragraph({
        text: trimmedLine.replace("# ", ""),
        heading: docx.HeadingLevel.HEADING_1,
        spacing: { after: 300 },
        alignment: docx.AlignmentType.CENTER,
      });
    } else if (trimmedLine.startsWith("## ")) {
      paragraph = new docx.Paragraph({
        text: trimmedLine.replace("## ", ""),
        heading: docx.HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 150 },
      });
    } else if (trimmedLine.startsWith("### ")) {
      paragraph = new docx.Paragraph({
        text: trimmedLine.replace("### ", ""),
        heading: docx.HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 },
      });
    } else if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ")) {
      paragraph = new docx.Paragraph({
        text: trimmedLine.substring(2).trim(),
        bullet: { level: 0 },
        spacing: { before: 50, after: 50 },
      });
    } else {
      const runs: docx.Run[] = [];
      const parts = trimmedLine.split("**");
      parts.forEach((part, index) => {
        const isBold = index % 2 === 1;
        runs.push(
          new docx.Run({
            text: part,
            bold: isBold,
            font: { name: "Microsoft YaHei" },
          })
        );
      });
      paragraph = new docx.Paragraph({ children: runs, spacing: { before: 100, after: 100 } });
    }

    docxChildren.push(paragraph);
  });

  const docFile = new docx.Document({
    styles: {
      default: {
        document: {
          run: {
            font: { name: "Microsoft YaHei" },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: docx.convertInchesToTwip(1),
              right: docx.convertInchesToTwip(1),
              bottom: docx.convertInchesToTwip(1),
              left: docx.convertInchesToTwip(1),
            },
          },
        },
        children: docxChildren,
      },
    ],
  });

  const blob = await docx.Packer.toBlob(docFile);
  return Buffer.from(await blob.arrayBuffer());
}
