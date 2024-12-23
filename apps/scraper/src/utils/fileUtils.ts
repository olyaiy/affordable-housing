import fs from 'fs/promises';
import path from 'path';
import prettier from 'prettier';

export async function saveDebugContent(content: string, filename: string): Promise<void> {
  const debugDir = path.join(process.cwd(), 'debug');
  
  // Create debug directory if it doesn't exist
  await fs.mkdir(debugDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = `${filename}_${timestamp}`;
  
  // Save raw HTML
  await fs.writeFile(
    path.join(debugDir, `${baseFilename}.html`),
    content
  );
  
  try {
    // Save formatted HTML for better readability
    const formattedHtml = await prettier.format(content, {
      parser: 'html',
      printWidth: 120,
    });
    
    await fs.writeFile(
      path.join(debugDir, `${baseFilename}_formatted.html`),
      formattedHtml
    );
  } catch (error) {
    console.log('Error formatting HTML:', error);
    // If formatting fails, we still have the raw HTML
  }
} 