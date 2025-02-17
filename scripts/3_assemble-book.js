import fs from 'fs';
import path from 'path';

// Set the base directory to where your translated JSON is located
const baseDir = '';
const inputPath = path.join(baseDir, 'book-structure-translated.json');
const outputPath = path.join(baseDir, 'book.md');

// Function to convert a node to Markdown
function nodeToMarkdown(node) {
  let md = "";

  // If header exists and is not exactly three dashes, output it as a Markdown header based on level
  if (node.header && node.header.trim() !== '---') {
    const headerPrefix = "#".repeat(node.level);
    md += `${headerPrefix} ${node.header.trim()}\n\n`;
  }

  // Always output the node text (trimmed)
  if (node.text) {
    md += `${node.text.trim()}\n\n`;
  }

  // Recursively process children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      md += nodeToMarkdown(child);
    }
  }

  return md;
}

// Function to assemble the entire book from an array of nodes
function assembleMarkdown(bookStructure) {
  let markdown = "";
  for (const node of bookStructure) {
    markdown += nodeToMarkdown(node);
  }
  return markdown;
}

// Main function to read JSON, assemble markdown, and write to file
function main() {
  try {
    const data = fs.readFileSync(inputPath, 'utf8');
    const bookStructure = JSON.parse(data);
    const markdown = assembleMarkdown(bookStructure);
    fs.writeFileSync(outputPath, markdown);
    console.log(`Assembled markdown file saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error during assembling the markdown: ${error}`);
  }
}

main(); 