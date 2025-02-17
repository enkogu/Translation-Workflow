const fs = require('fs');
const path = require('path');

function parseMarkdownToJSON(content) {
    const lines = content.split('\n');
    const root = { children: [] };
    const stack = [{ node: root, level: 0 }];

    lines.forEach(line => {
        const headerMatch = line.match(/^(#+)\s*(.*?)\s*(#*)$/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const header = headerMatch[2].trim();
            
            const newNode = {
                header,
                level,
                text: '',
                children: []
            };

            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            stack[stack.length - 1].node.children.push(newNode);
            stack.push({ node: newNode, level });
        } else if (stack.length > 1) {
            const current = stack[stack.length - 1].node;
            if (line.trim()) {
                current.text += line.trim() + '\n';
            }
        }
    });

    // Cleanup trailing newlines
    function cleanupText(node) {
        if (node.text) node.text = node.text.trim();
        node.children.forEach(cleanupText);
    }
    cleanupText(root);
    
    return root.children;
}

// Usage
const bookPath = path.join(__dirname, 'book_ru.md');
const outputPath = path.join(__dirname, 'book-structure.json');

const content = fs.readFileSync(bookPath, 'utf8');
const jsonData = parseMarkdownToJSON(content);

fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
console.log('Book structure saved to', outputPath);