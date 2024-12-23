import { chromium } from 'playwright';
import { RewScraper } from './scrapers/rew';

async function main() {
  const browser = await chromium.launch({
    headless: false // Set to true in production
  });

  const scraper = new RewScraper(browser, {
    baseUrl: 'https://www.rew.ca',
    searchArea: 'kitsilano-vancouver-bc',
    listingType: 'rent'
  });

  try {
    await scraper.initialize();
    const listings = await scraper.scrapeListings();
    console.log('Scraped listings:', listings);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

main(); 