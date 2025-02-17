import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import pLimit from 'p-limit';
import { createPrompt } from '../PROMPT.js';

const baseDir = '';
const inputPath = path.join(baseDir, 'book-structure.json');
const styleguidePath = path.join(baseDir, 'styleguide.md');
const outputPath = path.join(baseDir, 'book-structure-translated.json');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const concurrencyLimit = pLimit(30);

let totalNodes = 0;
let processedCount = 0;
let progressInterval;
let idCounter = 0;

// Modified flatten function to preserve original structure
function flattenNodes(nodes, parent = null) {
  if (!nodes || !Array.isArray(nodes)) return [];
  
  return nodes.reduce((acc, node) => {
    const nodeCopy = { 
      ...node,
      _parent: parent,
      _id: ++idCounter,
      _children: node.children || []
    };
    delete nodeCopy.children;
    return [
      ...acc,
      nodeCopy,
      ...flattenNodes(nodeCopy._children, nodeCopy)
    ];
  }, []);
}

// Modified rebuildTree function using _id as key
function rebuildTree(flattenedNodes) {
  const nodeMap = new Map();
  const rootNodes = [];

  // Create clean nodes without metadata using the unique _id
  flattenedNodes.forEach(node => {
    const cleanNode = {
      header: node.header,
      level: node.level,
      text: node.text,
      children: []
    };
    nodeMap.set(node._id, cleanNode);
  });

  // Rebuild hierarchy using parent's _id
  flattenedNodes.forEach(originalNode => {
    const cleanNode = nodeMap.get(originalNode._id);
    if (originalNode._parent) {
      const parent = nodeMap.get(originalNode._parent._id);
      if (parent) {
        parent.children.push(cleanNode);
      }
    } else {
      rootNodes.push(cleanNode);
    }
  });

  return rootNodes;
}

// Unified translation function
async function translateContent(content, context, styleguide, isHeader = false) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: createPrompt(content, context, styleguide, isHeader)
      }],
      temperature: 0.1,
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Translation error for content: ${content.slice(0, 50)}...`);
    return content; // Return original on failure
  }
}

// Updated processNode function using _parent directly
async function processNode(node, styleguide, allNodes) {
  // Get hierarchical context
  const context = [];
  if (node._parent) {
    // Use the parent pointer directly instead of searching in allNodes by id
    const parent = node._parent;
    context.push(`Parent Header: ${parent.header}`);
    context.push(`Parent Content: ${parent.text.slice(0, 200)}...`);
  }

  // Translate header
  const translatedHeader = node.header 
    ? await translateContent(node.header, context.join('\n'), styleguide, true)
    : node.header;

  // Translate text with header context
  const textContext = [
    ...context,
    `Current Header: ${translatedHeader}`
  ].join('\n');
  
  const translatedText = await translateContent(node.text, textContext, styleguide);

  processedCount++;
  return { ...node, header: translatedHeader, text: translatedText };
}

// Main function remains similar with improved logging
async function translateBookStructure() {
  try {
    const bookStructure = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const styleguide = fs.readFileSync(styleguidePath, 'utf8');

    const flattenedNodes = flattenNodes(bookStructure);
    totalNodes = flattenedNodes.length;

    progressInterval = setInterval(() => {
      console.log(`Translated ${processedCount}/${totalNodes} nodes (${Math.round((processedCount/totalNodes)*100)}%)`);
    }, 5000);

    const processingQueue = flattenedNodes.map(node => 
      concurrencyLimit(() => processNode(node, styleguide, flattenedNodes))
    );

    const results = await Promise.allSettled(processingQueue);
    clearInterval(progressInterval);

    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const translatedStructure = rebuildTree(successful);

    fs.writeFileSync(outputPath, JSON.stringify(translatedStructure, null, 2));
    console.log(`Translation complete! Saved to ${outputPath}`);

  } catch (err) {
    clearInterval(progressInterval);
    console.error('Critical error:', err);
    process.exit(1);
  }
}

translateBookStructure();