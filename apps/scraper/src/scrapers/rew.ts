import { Browser, Page } from 'playwright';
import { saveDebugContent } from '../utils/fileUtils';

interface RewScraperConfig {
  baseUrl: string;
  searchArea: string;
  listingType: 'rent' | 'sale';
}

/**
 * Scraper for REW.ca real estate listings
 * Handles both rental and sale property listings
 */
export class RewScraper {
  private browser: Browser;
  private config: RewScraperConfig;

  constructor(browser: Browser, config: RewScraperConfig) {
    this.browser = browser;
    this.config = config;
  }

  /**
   * Constructs the search URL based on listing type and search area
   * Example: https://www.rew.ca/rentals/areas/kitsilano-vancouver-bc
   */
  private getSearchUrl(): string {
    const path = this.config.listingType === 'rent' ? 'rentals' : 'properties';
    return `${this.config.baseUrl}/${path}/areas/${this.config.searchArea}`;
  }

  /**
   * Main scraping function that extracts property listings from REW.ca
   * Returns an array of listing objects containing price, address, specs, etc.
   */
  async scrapeListings(): Promise<any[]> {
    const page = await this.browser.newPage();
    
    try {
      // Navigate to the search results page
      const searchUrl = this.getSearchUrl();
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });

      // Wait for the listings container to be present in the DOM
      await page.waitForSelector('[data-listings-container]', { timeout: 15000 });

      // Store the page HTML for debugging purposes
      const content = await page.content();
      await saveDebugContent(content, 'rew_search_page');

      // Extract data from each listing on the page
      const listings = await page.evaluate(() => {
        const listingElements = document.querySelectorAll('article.displaypanel');
        
        return Array.from(listingElements).map(listing => {
          // Extract all relevant elements from the listing
          const priceEl = listing.querySelector('.displaypanel-price');
          const addressEl = listing.querySelector('.displaypanel-address');
          const locationEl = listing.querySelector('.displaypanel-info li');
          const specsList = listing.querySelector('.displaypanel-section .inlinelist');
          const specs = specsList 
            ? Array.from(specsList.children)
                .map(li => li.textContent?.trim())
                .filter(Boolean)
            : [];
          const typeEl = listing.querySelector('.displaypanel-info:not(:has(li))');
          const linkEl = listing.querySelector('a.displaypanel-link') as HTMLAnchorElement | null;
          const imgEl = listing.querySelector('.displaypanel-photo img') as HTMLImageElement | null;
          
          // Construct and return the listing object
          return {
            price: priceEl?.textContent?.trim() || '',
            address: addressEl?.textContent?.trim() || '',
            location: locationEl?.textContent?.trim() || '',
            specs: specs.join(' • '),
            propertyType: typeEl?.textContent?.trim() || '',
            url: linkEl?.href || '',
            imageUrl: imgEl?.src || '',
            imageAlt: imgEl?.alt || ''
          };
        });
      });

      // Take a screenshot if no listings were found (for debugging)
      if (listings.length === 0) {
        await page.screenshot({ path: 'no-listings.png', fullPage: true });
      }

      return listings;

    } catch (error) {
      console.error('Error during scraping:', error);
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
      throw error;
    } finally {
      await page.close();
    }
  }
}
