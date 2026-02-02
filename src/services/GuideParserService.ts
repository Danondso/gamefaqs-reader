import { File } from 'expo-file-system/next';
import type { GuideMetadata } from '../types';

export interface ParsedGuide {
  title: string;
  content: string;
  format: 'txt' | 'html' | 'md';
  metadata: GuideMetadata;
}

class GuideParserService {
  /**
   * Parse a guide file and extract content and metadata
   */
  async parseGuide(filePath: string): Promise<ParsedGuide> {
    const format = this.detectFormat(filePath);

    switch (format) {
      case 'txt':
        return await this.parseTxtGuide(filePath);
      case 'html':
        return await this.parseHtmlGuide(filePath);
      case 'md':
        return await this.parseMarkdownGuide(filePath);
      default:
        throw new Error(`Unsupported file format: ${format}`);
    }
  }

  /**
   * Detect file format from extension
   * Note: PDF files are not supported for local import - use server import instead
   */
  private detectFormat(filePath: string): 'txt' | 'html' | 'md' {
    const extension = filePath.toLowerCase().split('.').pop();

    switch (extension) {
      case 'txt':
        return 'txt';
      case 'html':
      case 'htm':
        return 'html';
      case 'md':
      case 'markdown':
        return 'md';
      case 'pdf':
        throw new Error(
          'PDF guides cannot be imported from local files. To use a PDF guide, upload it to the companion server and import it from there. If server-based PDF import is not yet configured in this app, this feature may be available in a future update.'
        );
      default:
        // Default to txt for unknown formats
        return 'txt';
    }
  }

  /**
   * Parse plain text guide
   * Preserves ASCII art and formatting
   */
  private async parseTxtGuide(filePath: string): Promise<ParsedGuide> {
    const file = new File(filePath);
    const content = await file.text();

    // Check if content is empty or just whitespace
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      const filenameTitle = this.extractTitleFromFilename(filePath);
      return {
        title: `${filenameTitle} (Empty Guide)`,
        content: '[This guide appears to be empty or contains no readable content]',
        format: 'txt',
        metadata: {},
      };
    }

    const metadata = this.extractMetadataFromContent(content);
    const title = this.extractTitleFromContent(content) || this.extractTitleFromFilename(filePath);

    return {
      title,
      content,
      format: 'txt',
      metadata,
    };
  }

  /**
   * Parse HTML guide
   * Strips HTML tags and preserves text content
   */
  private async parseHtmlGuide(filePath: string): Promise<ParsedGuide> {
    const file = new File(filePath);
    const htmlContent = await file.text();

    // Extract title from <title> tag or <h1>
    let title = this.extractHtmlTitle(htmlContent) || this.extractTitleFromFilename(filePath);

    // Sanitize HTML to text conversion
    // Remove script and style tags completely (including content)
    let content = htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove noscript tags
    content = content.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

    // Remove event handlers (onclick, onerror, onload, etc.)
    content = content.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    content = content.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

    // Remove javascript: URLs from href and src attributes
    content = content.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
    content = content.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');

    // Remove data: URLs that could contain scripts
    content = content.replace(/href\s*=\s*["']data:[^"']*["']/gi, '');
    content = content.replace(/src\s*=\s*["']data:text\/html[^"']*["']/gi, '');

    // Remove object, embed, iframe, and form tags (potential security risks)
    content = content.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    content = content.replace(/<embed[^>]*>/gi, '');
    content = content.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    content = content.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');

    // Convert common HTML elements to text equivalents
    content = content.replace(/<br\s*\/?>/gi, '\n');
    content = content.replace(/<\/p>/gi, '\n\n');
    content = content.replace(/<\/div>/gi, '\n');
    content = content.replace(/<\/h[1-6]>/gi, '\n');

    // Remove all remaining HTML tags
    content = content.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    content = this.decodeHtmlEntities(content);

    // Normalize whitespace but preserve intentional line breaks
    content = content.split('\n').map(line => line.trim()).join('\n');
    content = content.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines

    const metadata = this.extractMetadataFromContent(content);

    return {
      title,
      content,
      format: 'html',
      metadata,
    };
  }

  /**
   * Parse Markdown guide
   */
  private async parseMarkdownGuide(filePath: string): Promise<ParsedGuide> {
    const file = new File(filePath);
    const content = await file.text();

    // Extract title from first # heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : this.extractTitleFromFilename(filePath);

    const metadata = this.extractMetadataFromContent(content);

    return {
      title,
      content,
      format: 'md',
      metadata,
    };
  }

  /**
   * Extract title from guide content (first non-empty line or title-like pattern)
   */
  private extractTitleFromContent(content: string): string | null {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length === 0) return null;

    // Look for common title patterns in first 30 lines
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];

      // Skip obvious decorative lines
      if (/^[=\-*_#]+$/.test(line)) continue;
      if (line.length > 120) continue; // Titles are usually shorter
      if (line.length < 3) continue; // Too short to be a title
      if (line.startsWith('http')) continue; // URLs aren't titles

      // Strong title indicators
      if (line.match(/^(.*?)(guide|walkthrough|faq)/i)) {
        // Clean up the title
        return this.cleanTitle(line);
      }

      // Check for centered titles (common in ASCII art headers)
      const leadingSpaces = content.split('\n')[i].match(/^\s*/)?.[0].length || 0;
      if (leadingSpaces > 10 && line.length < 80 && line.length > 5) {
        return this.cleanTitle(line);
      }
    }

    // Fall back to first substantive line
    for (const line of lines.slice(0, 10)) {
      if (line.length >= 10 && line.length < 100 && !line.startsWith('http') && !/^[=\-*_#]+$/.test(line)) {
        return this.cleanTitle(line);
      }
    }

    return null;
  }

  /**
   * Clean up extracted title by removing common artifacts
   */
  private cleanTitle(title: string): string {
    let cleaned = title;

    // Remove version numbers at the end
    cleaned = cleaned.replace(/\s+v?\d+\.\d+(\.\d+)?\s*$/i, '');

    // Remove "by author" at the end
    cleaned = cleaned.replace(/\s+by\s+.+$/i, '');

    // Remove excessive punctuation
    cleaned = cleaned.replace(/[*_=\-]{3,}/g, '');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Extract title from HTML content
   */
  private extractHtmlTitle(html: string): string | null {
    // Try <title> tag first
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].trim();

    // Try first <h1> tag
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) return h1Match[1].trim();

    return null;
  }

  /**
   * Extract title from filename
   * Format: id-game-name.txt -> "Game Name"
   */
  private extractTitleFromFilename(filePath: string): string {
    const filename = filePath.split('/').pop() || '';
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

    // Remove ID prefix if present (e.g., "588690-star-fox" -> "star-fox")
    let cleaned = nameWithoutExt.replace(/^\d+-/, '');

    // Remove common suffixes (faqs, guides, walkthroughs, etc.)
    cleaned = cleaned.replace(/-(faqs?|guides?|walkthroughs?|maps?|cheats?)-?\d*$/i, '');

    // Handle underscores and hyphens
    cleaned = cleaned.replace(/[_-]/g, ' ');

    // Remove multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Capitalize words intelligently
    return cleaned
      .split(' ')
      .map(word => {
        // Don't capitalize certain small words unless they're the first word
        const lowerWord = word.toLowerCase();
        if (['of', 'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for'].includes(lowerWord)) {
          return lowerWord;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .map((word, index) => {
        // Always capitalize first word
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      })
      .join(' ');
  }

  /**
   * Extract metadata from guide content using rule-based patterns
   */
  private extractMetadataFromContent(content: string): GuideMetadata {
    const metadata: GuideMetadata = {};

    // Extract author (common patterns)
    const authorPatterns = [
      /(?:by|author|written by|created by)[:\s]+([^\n]+)/i,
      /(?:^|\n)([A-Z][a-z]+ [A-Z][a-z]+)\s*$/m, // Name at end
    ];

    for (const pattern of authorPatterns) {
      const match = content.match(pattern);
      if (match) {
        metadata.author = match[1].trim();
        break;
      }
    }

    // Extract version
    const versionMatch = content.match(/version[:\s]+([0-9.]+)/i);
    if (versionMatch) {
      metadata.version = versionMatch[1];
    }

    // Extract platform hints from content
    const platforms = ['NES', 'SNES', 'N64', 'GameCube', 'Wii', 'Switch',
                       'Genesis', 'Saturn', 'Dreamcast',
                       'PS1', 'PS2', 'PS3', 'PS4', 'PS5', 'PSP', 'Vita',
                       'Xbox', 'Xbox 360', 'Xbox One',
                       'Game Boy', 'GBA', 'DS', '3DS',
                       'PC', 'Steam'];

    for (const platform of platforms) {
      const regex = new RegExp(`\\b${platform}\\b`, 'i');
      if (regex.test(content.slice(0, 1000))) { // Check first 1000 chars
        metadata.platform = platform;
        break;
      }
    }

    return metadata;
  }

  /**
   * Generate auto-tags from guide content and filename
   * Rule-based tagging for categorization
   */
  generateAutoTags(content: string, filename: string): string[] {
    const tags = new Set<string>();
    const lowerContent = content.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Guide type tags from filename
    if (lowerFilename.includes('faq')) tags.add('FAQ');
    if (lowerFilename.includes('walkthrough')) tags.add('Walkthrough');
    if (lowerFilename.includes('guide')) tags.add('Guide');
    if (lowerFilename.includes('maps')) tags.add('Maps');
    if (lowerFilename.includes('cheats')) tags.add('Cheats');

    // Guide type tags from content
    if (lowerContent.includes('walkthrough')) tags.add('Walkthrough');
    if (lowerContent.includes('achievement')) tags.add('Achievements');
    if (lowerContent.includes('trophy')) tags.add('Trophies');
    if (lowerContent.includes('secret')) tags.add('Secrets');
    if (lowerContent.includes('boss')) tags.add('Boss Guide');
    if (lowerContent.includes('character')) tags.add('Characters');
    if (lowerContent.includes('item list') || lowerContent.includes('items:')) tags.add('Items');
    if (lowerContent.includes('weapon')) tags.add('Weapons');
    if (lowerContent.includes('collectible')) tags.add('Collectibles');
    if (lowerContent.includes('unlock')) tags.add('Unlockables');

    // Genre hints
    if (lowerContent.match(/rpg|role.playing/)) tags.add('RPG');
    if (lowerContent.match(/fps|first.person.shooter/)) tags.add('FPS');
    if (lowerContent.match(/platformer|platform game/)) tags.add('Platformer');
    if (lowerContent.match(/fighting game|fighter/)) tags.add('Fighting');
    if (lowerContent.match(/racing/)) tags.add('Racing');
    if (lowerContent.match(/puzzle/)) tags.add('Puzzle');
    if (lowerContent.match(/strategy|rts|turn.based/)) tags.add('Strategy');
    if (lowerContent.match(/adventure/)) tags.add('Adventure');
    if (lowerContent.match(/action/)) tags.add('Action');
    if (lowerContent.match(/simulation|sim/)) tags.add('Simulation');
    if (lowerContent.match(/sports/)) tags.add('Sports');

    // Content completeness indicators
    if (lowerContent.includes('100%') || lowerContent.includes('complete')) tags.add('Complete Guide');
    if (lowerContent.includes('beginner')) tags.add('Beginner Friendly');
    if (lowerContent.includes('advanced') || lowerContent.includes('expert')) tags.add('Advanced');
    if (lowerContent.includes('speedrun')) tags.add('Speedrun');

    // Special content types
    if (lowerContent.includes('ascii art') || this.detectAsciiArt(content)) tags.add('ASCII Art');
    if (lowerContent.includes('table of contents') || lowerContent.includes('toc')) tags.add('Table of Contents');

    return Array.from(tags);
  }

  /**
   * Detect if content contains ASCII art
   * Simple heuristic: multiple lines with consistent non-alphanumeric characters
   */
  private detectAsciiArt(content: string): boolean {
    const lines = content.split('\n').slice(0, 100); // Check first 100 lines
    let artLineCount = 0;

    for (const line of lines) {
      // Count lines with lots of special characters (potential ASCII art)
      const specialChars = line.match(/[^\w\s]/g) || [];
      if (specialChars.length > line.length * 0.3 && line.length > 10) {
        artLineCount++;
      }
    }

    // If more than 5 lines look like ASCII art, it probably contains art
    return artLineCount > 5;
  }

  /**
   * Decode common HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&nbsp;': ' ',
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }

    return decoded;
  }

  /**
   * Extract game ID and name from archive filename structure
   * Format: id-game-name-faqs-id.txt -> { gameId: 'id', gameName: 'Game Name' }
   */
  extractGameInfoFromFilename(filePath: string): { gameId: string | null; gameName: string } {
    const filename = filePath.split('/').pop() || '';
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

    // Try to extract ID (numeric prefix)
    const idMatch = nameWithoutExt.match(/^(\d+)-(.+)$/);

    if (idMatch) {
      const gameId = idMatch[1];
      const restOfName = idMatch[2];

      // Extract game name (everything between gameId and 'faqs'/'guides'/etc.)
      const gameNameParts: string[] = [];
      const parts = restOfName.split('-');

      for (const part of parts) {
        // Stop when we hit known separators
        if (['faqs', 'guides', 'walkthrough', 'walkthroughs', 'maps', 'cheats'].includes(part.toLowerCase())) {
          break;
        }
        gameNameParts.push(part);
      }

      const gameName = gameNameParts
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return { gameId, gameName: gameName || 'Unknown Game' };
    }

    // No ID found
    return {
      gameId: null,
      gameName: this.extractTitleFromFilename(filePath),
    };
  }

  /**
   * Extract game info from full path including directory structure
   * Handles archive structure like: platform/system/game-id-name/faqs/guide.txt
   * Or: game-id-name/faqs/guide.txt
   */
  extractGameInfoFromPath(filePath: string): { gameId: string | null; gameName: string; platform: string | null } {
    const parts = filePath.split('/');

    // Look for the folder containing 'faqs' subdirectory
    const faqsIndex = parts.findIndex(p => p.toLowerCase() === 'faqs');

    if (faqsIndex > 0) {
      // The parent folder should be the game folder (e.g., "960943-game-box-serie-esportes")
      const gameFolder = parts[faqsIndex - 1];

      // Extract platform if it exists (usually 2 levels up from faqs)
      const platform = faqsIndex >= 2 ? this.normalizePlatform(parts[faqsIndex - 2]) : null;

      // Parse the game folder name
      const gameFolderMatch = gameFolder.match(/^(\d+)-(.+)$/);

      if (gameFolderMatch) {
        const gameId = gameFolderMatch[1];
        const gameNameSlug = gameFolderMatch[2];

        // Convert slug to readable name
        const gameName = gameNameSlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return { gameId, gameName, platform };
      }
    }

    // Fall back to filename-based extraction
    const fileInfo = this.extractGameInfoFromFilename(filePath);
    return { ...fileInfo, platform: null };
  }

  /**
   * Normalize platform names from directory structure
   */
  private normalizePlatform(dirName: string): string | null {
    const platformMap: Record<string, string> = {
      'nes': 'NES',
      'snes': 'SNES',
      'n64': 'N64',
      'gamecube': 'GameCube',
      'wii': 'Wii',
      'switch': 'Switch',
      'genesis': 'Genesis',
      'saturn': 'Saturn',
      'dreamcast': 'Dreamcast',
      'ps1': 'PS1',
      'ps2': 'PS2',
      'ps3': 'PS3',
      'ps4': 'PS4',
      'ps5': 'PS5',
      'psp': 'PSP',
      'vita': 'Vita',
      'xbox': 'Xbox',
      'xbox360': 'Xbox 360',
      'xboxone': 'Xbox One',
      'gameboy': 'Game Boy',
      'gba': 'GBA',
      'gbc': 'GBC',
      'ds': 'DS',
      '3ds': '3DS',
      'pc': 'PC',
      'sms': 'SMS',
      'x1': 'X1',
      '3rd': '3DO',
    };

    const normalized = dirName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return platformMap[normalized] || null;
  }
}

export default new GuideParserService();
