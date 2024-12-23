import { chromium } from 'playwright';
import { RewScraper } from './scrapers/rew';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Saves scraped listings to a JSON file in the results directory
 * Filename format: {searchArea}_{timestamp}.json
 */
async function saveListings(listings: any[], searchArea: string) {
  const resultsDir = path.join(__dirname, '..', 'results');
  await fs.mkdir(resultsDir, { recursive: true });

  // Create a timestamped filename to avoid overwrites
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${searchArea}_${timestamp}.json`;
  const filepath = path.join(resultsDir, filename);

  // Save listings as formatted JSON
  await fs.writeFile(
    filepath,
    JSON.stringify(listings, null, 2),
    'utf-8'
  );

  return filepath;
}

/**
 * Main execution function
 * Initializes the browser, runs the scraper, and saves the results
 */
async function main() {
  // Launch browser in visible mode with slight delay between actions
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });

  // Configure scraper for Kitsilano rental listings
  const searchArea = 'kitsilano-vancouver-bc';
  const scraper = new RewScraper(browser, {
    baseUrl: 'https://www.rew.ca',
    searchArea,
    listingType: 'rent'
  });

  try {
    // Run the scraper and save results
    const listings = await scraper.scrapeListings();
    
    if (listings.length === 0) {
      console.error('No listings found - check debug/no-listings.png');
    } else {
      const savedFilePath = await saveListings(listings, searchArea);
      console.log(`Saved ${listings.length} listings to ${savedFilePath}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

main(); 