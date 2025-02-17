export const createPrompt = (currentText, prevTextForContext, styleguide) => {
    return `
Translate the following text from Russian to English. 
Use the previous text for context to ensure continuity and coherence. 
The translation should be as close as possible to the original text, preserving all details and nuances. 
Additionally, adhere to the style provided by the reference style guide.
Keep the structure and formatting of the original text.

Output format: only translated text in English, nothing else.

Previous Text for Context:
${prevTextForContext}

Current Text to Translate:
${currentText}

Style Guide:
${styleguide}
`;
};