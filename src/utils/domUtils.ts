// Count non-whitespace characters in a string
function countNonWs(str: string): number {
  return str.replace(/\s/g, '').length;
}

// Get the non-whitespace character offset of a specific DOM node/offset relative to its textLayer
export function getNonWsOffset(textLayer: HTMLElement, targetNode: Node, targetOffset: number): number {
  // Normalize element nodes to text nodes
  let resolvedNode = targetNode;
  let resolvedOffset = targetOffset;
  
  if (resolvedNode.nodeType !== Node.TEXT_NODE) {
    if (resolvedOffset < resolvedNode.childNodes.length) {
      const child = resolvedNode.childNodes[resolvedOffset];
      const walker = document.createTreeWalker(child, NodeFilter.SHOW_TEXT, null);
      const firstText = walker.nextNode();
      if (firstText) {
        resolvedNode = firstText;
        resolvedOffset = 0;
      }
    }
  }

  const treeWalker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT, null);
  let count = 0;
  let currentNode = treeWalker.nextNode();
  
  while (currentNode) {
    // Check against both the resolved text node and the original target
    if (currentNode === resolvedNode || currentNode === targetNode) {
      const textBefore = (currentNode.textContent || '').substring(0, resolvedOffset);
      return count + countNonWs(textBefore);
    }
    count += countNonWs(currentNode.textContent || '');
    currentNode = treeWalker.nextNode();
  }
  return count;
}

// Find a DOM Range in the textLayer based on a global non-whitespace offset and length
export function getRangeByNonWs(textLayer: HTMLElement, startNonWs: number, lengthNonWs: number): Range | null {
  if (lengthNonWs <= 0) return null;
  
  const treeWalker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT, null);
  
  let currentNonWs = 0;
  let currentNode = treeWalker.nextNode();
  
  let startNode: Node | null = null;
  let startOffset = 0;
  let endNode: Node | null = null;
  let endOffset = 0;

  while (currentNode) {
    const nodeText = currentNode.textContent || '';
    
    for (let i = 0; i < nodeText.length; i++) {
      if (!/\s/.test(nodeText[i])) {
        // If we hit the start non-ws index
        if (!startNode && currentNonWs === startNonWs) {
          startNode = currentNode;
          startOffset = i;
        }
        
        currentNonWs++;
        
        // If we hit the end non-ws index
        if (startNode && currentNonWs === startNonWs + lengthNonWs) {
          endNode = currentNode;
          endOffset = i + 1; // Include this character
          break;
        }
      }
    }
    
    if (endNode) break;
    currentNode = treeWalker.nextNode();
  }

  // If we found the start but hit the end of the text layer before finding the end,
  // just cap it at the very last character we processed.
  if (startNode && !endNode && currentNonWs > startNonWs) {
     endNode = currentNode || startNode; // Fallback to last known node
     endOffset = (endNode.textContent || '').length;
  }

  if (startNode && endNode) {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  }

  return null;
}
