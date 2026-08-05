export function getWordRange(selectionRange: Range, charIndex: number, charLength: number): Range | null {
  const treeWalker = document.createTreeWalker(
    selectionRange.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!selectionRange.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let currentLength = 0;
  let currentNode = treeWalker.nextNode();

  while (currentNode) {
    let nodeStartOffset = 0;
    let nodeEndOffset = currentNode.textContent?.length || 0;

    if (currentNode === selectionRange.startContainer) {
      nodeStartOffset = selectionRange.startOffset;
    }
    if (currentNode === selectionRange.endContainer) {
      nodeEndOffset = selectionRange.endOffset;
    }

    const nodeLength = nodeEndOffset - nodeStartOffset;

    // Check if the target charIndex starts in this node or spans it
    if (charIndex >= currentLength && charIndex < currentLength + nodeLength) {
      const startOffsetInNode = nodeStartOffset + (charIndex - currentLength);
      
      const newRange = document.createRange();
      newRange.setStart(currentNode, startOffsetInNode);
      
      let charsRemaining = charLength;
      let charsInThisNode = nodeEndOffset - startOffsetInNode;
      
      if (charsRemaining <= charsInThisNode) {
        newRange.setEnd(currentNode, startOffsetInNode + charsRemaining);
        return newRange;
      } else {
        // Handle spanning multiple text nodes
        // For simplicity, we just highlight to the end of this node.
        // PDF.js words rarely cross span boundaries unless hyphenated.
        newRange.setEnd(currentNode, nodeEndOffset);
        return newRange;
      }
    }

    currentLength += nodeLength;
    // PDF.js often has physical space gaps between spans that the browser's Selection.toString() turns into spaces or newlines.
    // If the browser adds a newline for block elements, we should increment currentLength.
    // We will assume 1 extra character for span breaks as a heuristic to keep in sync.
    // However, exact synchronization is hard without fully mocking toString().
    
    // We'll skip the heuristic for now and rely on exact match if possible.
    currentNode = treeWalker.nextNode();
  }
  
  return null;
}
