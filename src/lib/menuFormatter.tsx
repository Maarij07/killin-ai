/**
 * Format menu text with proper styling for headings, items, prices, and descriptions
 * Also handles **bold** text formatting
 * @param text The raw menu text from the API
 * @returns Formatted JSX elements
 */

// Helper function to parse bold text (**text**)
const parseBoldText = (text: string) => {
  const parts: (string | React.ReactNode)[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add bold text
    parts.push(
      <strong key={`bold-${keyCounter++}`} className="font-bold">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

export const formatMenuText = (text: string) => {
  if (!text) return null;

  return text.split('\n').map((line, index) => {
    // Handle headings (## Heading)
    if (line.startsWith('##')) {
      const heading = line.substring(2).trim();
      return (
        <h3 key={index} className="font-bold text-lg mt-4 mb-2">
          {parseBoldText(heading)}
        </h3>
      );
    }
    
    // Handle menu items (- Item - $Price - Description)
    if (line.startsWith('-')) {
      const itemMatch = line.match(/-\s*(.*?)\s*-\s*\$([0-9.]+)\s*-\s*(.*)/);
      if (itemMatch) {
        const [, item, price, description] = itemMatch;
        return (
          <div key={index} className="flex items-start mb-1">
            <span className="mr-2">•</span>
            <span className="font-medium">{parseBoldText(item)}</span>
            <span className="font-bold mx-2">${price}</span>
            <span className="italic text-sm opacity-80">{parseBoldText(description)}</span>
          </div>
        );
      }
      
      // Handle simple list items (- Item)
      const simpleItem = line.substring(1).trim();
      return (
        <div key={index} className="flex items-start mb-1">
          <span className="mr-2">•</span>
          <span>{parseBoldText(simpleItem)}</span>
        </div>
      );
    }
    
    // Handle empty lines
    if (line.trim() === '') {
      return <br key={index} />;
    }
    
    // Handle regular text
    return (
      <div key={index} className="mb-1">
        {parseBoldText(line)}
      </div>
    );
  });
};
