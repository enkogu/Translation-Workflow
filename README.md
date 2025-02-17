
# Use Case
Translate from one language to another in the specific style.
It's better to add examples and a comprehensive description.

# How To
1. Create a styleguide file – `styleguide.md`
2. Convert your book to markdown. 
3. Run `scripts/1_create_json_tree.js` to create a tree representation of the book. This script converts a markdown book to json tree
4. Run `scripts/2_translate-texts.js`. It translates each text section in parallel with the previous for context and styleguide and saves to the same structure.
5. Run `scripts/3_assemble-book.js` to get the final markdown.
