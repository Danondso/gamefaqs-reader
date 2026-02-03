import GuideParserService from '../services/GuideParserService';

// Get access to the File mock
const mockFileText = jest.fn();

jest.mock('expo-file-system/next', () => ({
  File: jest.fn().mockImplementation((filePath: string) => ({
    filePath,
    text: mockFileText,
  })),
}));

describe('GuideParserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseGuide', () => {
    describe('txt format', () => {
      it('should parse a txt guide with content', async () => {
        mockFileText.mockResolvedValue(
          'Super Mario Bros. Guide\nby John Doe\n\nThis is a complete walkthrough...'
        );

        const result = await GuideParserService.parseGuide(
          '/path/to/588690-super-mario-bros-faqs.txt'
        );

        expect(result.format).toBe('txt');
        expect(result.content).toContain('Super Mario Bros. Guide');
      });

      it('should handle empty txt files', async () => {
        mockFileText.mockResolvedValue('');

        const result = await GuideParserService.parseGuide(
          '/path/to/empty-guide.txt'
        );

        expect(result.title).toContain('(Empty Guide)');
        expect(result.content).toContain('appears to be empty');
      });

      it('should handle whitespace-only txt files', async () => {
        mockFileText.mockResolvedValue('   \n\n   \t\t   ');

        const result = await GuideParserService.parseGuide(
          '/path/to/whitespace-guide.txt'
        );

        expect(result.title).toContain('(Empty Guide)');
      });
    });

    describe('html format', () => {
      it('should parse an html guide', async () => {
        mockFileText.mockResolvedValue(
          '<html><head><title>Test Guide</title></head><body><p>Content here</p></body></html>'
        );

        const result = await GuideParserService.parseGuide(
          '/path/to/guide.html'
        );

        expect(result.format).toBe('html');
        expect(result.title).toBe('Test Guide');
        expect(result.content).toContain('Content here');
        expect(result.content).not.toContain('<p>');
      });

      it('should handle htm extension', async () => {
        mockFileText.mockResolvedValue('<h1>Guide Title</h1>');

        const result = await GuideParserService.parseGuide('/path/to/guide.htm');

        expect(result.format).toBe('html');
      });

      it('should strip script tags', async () => {
        mockFileText.mockResolvedValue(
          '<html><script>alert("xss")</script><p>Safe content</p></html>'
        );

        const result = await GuideParserService.parseGuide(
          '/path/to/guide.html'
        );

        expect(result.content).not.toContain('script');
        expect(result.content).not.toContain('alert');
        expect(result.content).toContain('Safe content');
      });

      it('should strip style tags', async () => {
        mockFileText.mockResolvedValue(
          '<html><style>.foo { color: red; }</style><p>Content</p></html>'
        );

        const result = await GuideParserService.parseGuide(
          '/path/to/guide.html'
        );

        expect(result.content).not.toContain('style');
        expect(result.content).not.toContain('color');
      });

      it('should convert br tags to newlines', async () => {
        mockFileText.mockResolvedValue('<p>Line one<br>Line two<br/>Line three</p>');

        const result = await GuideParserService.parseGuide(
          '/path/to/guide.html'
        );

        expect(result.content).toContain('Line one');
        expect(result.content).toContain('Line two');
      });

      it('should decode HTML entities', async () => {
        mockFileText.mockResolvedValue(
          '<p>&lt;tag&gt; &amp; &quot;quotes&quot; &#39;apostrophe&#39;</p>'
        );

        const result = await GuideParserService.parseGuide(
          '/path/to/guide.html'
        );

        expect(result.content).toContain('<tag>');
        expect(result.content).toContain('&');
        expect(result.content).toContain('"quotes"');
        expect(result.content).toContain("'apostrophe'");
      });
    });

    describe('markdown format', () => {
      it('should parse an md guide', async () => {
        mockFileText.mockResolvedValue(
          '# Markdown Guide Title\n\nThis is the content.\n'
        );

        const result = await GuideParserService.parseGuide('/path/to/guide.md');

        expect(result.format).toBe('md');
        expect(result.title).toBe('Markdown Guide Title');
      });

      it('should handle .markdown extension', async () => {
        mockFileText.mockResolvedValue('# Test\n\nContent');

        const result = await GuideParserService.parseGuide(
          '/path/to/guide.markdown'
        );

        expect(result.format).toBe('md');
      });
    });

    describe('pdf format', () => {
      it('should throw error for pdf files', async () => {
        await expect(
          GuideParserService.parseGuide('/path/to/guide.pdf')
        ).rejects.toThrow('PDF guides cannot be imported from local files');
      });
    });

    describe('unknown format', () => {
      it('should default to txt for unknown extensions', async () => {
        mockFileText.mockResolvedValue('Some content');

        const result = await GuideParserService.parseGuide(
          '/path/to/guide.xyz'
        );

        expect(result.format).toBe('txt');
      });
    });
  });

  describe('extractTitleFromFilename', () => {
    it('should remove ID prefix from filename', async () => {
      mockFileText.mockResolvedValue('');

      const result = await GuideParserService.parseGuide(
        '/path/to/588690-star-fox.txt'
      );

      // Title should not start with the ID
      expect(result.title).not.toContain('588690');
      expect(result.title).toContain('Star');
    });

    it('should remove faq suffixes', async () => {
      mockFileText.mockResolvedValue('');

      const result = await GuideParserService.parseGuide(
        '/path/to/588690-zelda-faqs-123.txt'
      );

      expect(result.title).not.toContain('faqs');
    });

    it('should handle underscores and hyphens', async () => {
      mockFileText.mockResolvedValue('');

      const result = await GuideParserService.parseGuide(
        '/path/to/game_name_with_underscores.txt'
      );

      // Should convert to spaces
      expect(result.title).toContain(' ');
    });

    it('should capitalize words intelligently', async () => {
      // Use content that won't be extracted as title (all lines too short/decorative)
      mockFileText.mockResolvedValue('===\n---\n***');

      const result = await GuideParserService.parseGuide(
        '/path/to/legend-of-zelda.txt'
      );

      // Falls back to filename extraction: "Legend of Zelda"
      expect(result.title).toBe('Legend of Zelda');
    });
  });

  describe('extractTitleFromContent', () => {
    it('should extract title containing guide keyword', async () => {
      mockFileText.mockResolvedValue(
        '================\nFinal Fantasy VII Guide\n================\n\nContent here...'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.txt');

      expect(result.title).toContain('Final Fantasy');
    });

    it('should extract title containing walkthrough keyword', async () => {
      mockFileText.mockResolvedValue(
        'Super Mario 64 Walkthrough\n\nContent...'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.txt');

      expect(result.title).toContain('Super Mario');
    });

    it('should extract title containing faq keyword', async () => {
      mockFileText.mockResolvedValue('Pokemon Red/Blue FAQ\n\nContent...');

      const result = await GuideParserService.parseGuide('/path/to/guide.txt');

      expect(result.title).toContain('Pokemon');
    });

    it('should skip decorative lines', async () => {
      mockFileText.mockResolvedValue(
        '===============\n---------------\nActual Title Here\n\nContent'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.txt');

      expect(result.title).not.toMatch(/^[=\-]+$/);
    });

    it('should skip URLs', async () => {
      mockFileText.mockResolvedValue(
        'http://example.com\nReal Title Guide\n\nContent'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.txt');

      expect(result.title).not.toContain('http');
    });
  });

  describe('extractHtmlTitle', () => {
    it('should extract title from title tag', async () => {
      mockFileText.mockResolvedValue(
        '<html><head><title>HTML Guide Title</title></head><body></body></html>'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.html');

      expect(result.title).toBe('HTML Guide Title');
    });

    it('should extract title from h1 tag when no title tag', async () => {
      mockFileText.mockResolvedValue(
        '<html><body><h1>H1 Guide Title</h1></body></html>'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.html');

      expect(result.title).toBe('H1 Guide Title');
    });

    it('should prefer title tag over h1', async () => {
      mockFileText.mockResolvedValue(
        '<html><head><title>Title Tag</title></head><body><h1>H1 Tag</h1></body></html>'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.html');

      expect(result.title).toBe('Title Tag');
    });

    it('should fall back to filename when no title found', async () => {
      mockFileText.mockResolvedValue('<html><body><p>No title here</p></body></html>');

      const result = await GuideParserService.parseGuide(
        '/path/to/fallback-title.html'
      );

      expect(result.title).toContain('Fallback');
    });
  });

  describe('extractMetadataFromContent', () => {
    it('should extract author from "by" pattern', async () => {
      mockFileText.mockResolvedValue(
        'Guide Title\nby John Smith\n\nContent here...'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.txt');

      expect(result.metadata.author).toBe('John Smith');
    });

    it('should extract author from "author:" pattern', async () => {
      mockFileText.mockResolvedValue(
        'Guide Title\nAuthor: Jane Doe\n\nContent here...'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.txt');

      expect(result.metadata.author).toBe('Jane Doe');
    });

    it('should extract author from "written by" pattern', async () => {
      mockFileText.mockResolvedValue(
        'Guide Title\nWritten by Bob Johnson\n\nContent...'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.txt');

      expect(result.metadata.author).toBe('Bob Johnson');
    });

    it('should extract version number', async () => {
      mockFileText.mockResolvedValue(
        'Guide Title\nVersion: 1.5\n\nContent here...'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.txt');

      expect(result.metadata.version).toBe('1.5');
    });

    it('should extract version with "version" prefix', async () => {
      mockFileText.mockResolvedValue(
        'Guide Title\nversion 2.0.1\n\nContent here...'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.txt');

      expect(result.metadata.version).toBe('2.0.1');
    });

    it('should extract platform from content', async () => {
      mockFileText.mockResolvedValue(
        'This guide is for the SNES version of the game.\n\nContent...'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.txt');

      expect(result.metadata.platform).toBe('SNES');
    });

    it('should detect various platforms', async () => {
      const platforms = ['NES', 'N64', 'PS1', 'PS2', 'Xbox', 'PC', 'GBA'];

      for (const platform of platforms) {
        mockFileText.mockResolvedValue(
          `This guide covers the ${platform} version.\n\nContent...`
        );

        const result = await GuideParserService.parseGuide('/path/to/guide.txt');

        expect(result.metadata.platform).toBe(platform);
      }
    });
  });

  describe('generateAutoTags', () => {
    // Consolidated tag detection tests
    const tagTestCases = [
      // Filename-based tags
      { content: 'content', filename: 'game-faq.txt', expectedTag: 'FAQ' },
      { content: 'content', filename: 'game-walkthrough.txt', expectedTag: 'Walkthrough' },
      { content: 'content', filename: 'complete-guide.txt', expectedTag: 'Guide' },
      { content: 'content', filename: 'game-maps.txt', expectedTag: 'Maps' },
      { content: 'content', filename: 'cheats.txt', expectedTag: 'Cheats' },
      // Content-based tags
      { content: 'Complete all achievement requirements...', filename: 'guide.txt', expectedTag: 'Achievements' },
      { content: 'Earn the platinum trophy...', filename: 'guide.txt', expectedTag: 'Trophies' },
      { content: 'Find all hidden secrets...', filename: 'guide.txt', expectedTag: 'Secrets' },
      { content: 'Defeat the final boss...', filename: 'guide.txt', expectedTag: 'Boss Guide' },
      { content: 'All playable character abilities...', filename: 'guide.txt', expectedTag: 'Characters' },
      { content: 'Complete item list:\n- Sword', filename: 'guide.txt', expectedTag: 'Items' },
      { content: 'All weapon locations and stats...', filename: 'guide.txt', expectedTag: 'Weapons' },
      { content: 'Find all collectible items...', filename: 'guide.txt', expectedTag: 'Collectibles' },
      { content: 'How to unlock all characters...', filename: 'guide.txt', expectedTag: 'Unlockables' },
      // Genre tags
      { content: 'This RPG features turn-based combat...', filename: 'guide.txt', expectedTag: 'RPG' },
      { content: 'A classic FPS shooter...', filename: 'guide.txt', expectedTag: 'FPS' },
      { content: 'A challenging platformer game...', filename: 'guide.txt', expectedTag: 'Platformer' },
      { content: 'The best fighting game of the era...', filename: 'guide.txt', expectedTag: 'Fighting' },
      { content: 'A fun racing game with...', filename: 'guide.txt', expectedTag: 'Racing' },
      { content: 'Solve challenging puzzle rooms...', filename: 'guide.txt', expectedTag: 'Puzzle' },
      { content: 'A turn-based strategy game...', filename: 'guide.txt', expectedTag: 'Strategy' },
      { content: 'An epic adventure awaits...', filename: 'guide.txt', expectedTag: 'Adventure' },
      { content: 'Fast-paced action gameplay...', filename: 'guide.txt', expectedTag: 'Action' },
      { content: 'A farming simulation game...', filename: 'guide.txt', expectedTag: 'Simulation' },
      { content: 'Cover all sports modes...', filename: 'guide.txt', expectedTag: 'Sports' },
      // Completeness tags
      { content: 'A 100% complete guide covering everything...', filename: 'guide.txt', expectedTag: 'Complete Guide' },
      { content: 'Perfect for beginner players...', filename: 'guide.txt', expectedTag: 'Beginner Friendly' },
      { content: 'For advanced players looking for...', filename: 'guide.txt', expectedTag: 'Advanced' },
      { content: 'Speedrun strategies for world record...', filename: 'guide.txt', expectedTag: 'Speedrun' },
      { content: 'TABLE OF CONTENTS\n1. Introduction', filename: 'guide.txt', expectedTag: 'Table of Contents' },
    ];

    it.each(tagTestCases)(
      'should detect "$expectedTag" tag',
      ({ content, filename, expectedTag }) => {
        const tags = GuideParserService.generateAutoTags(content, filename);
        expect(tags).toContain(expectedTag);
      }
    );

    it('should add multiple tags when applicable', () => {
      const tags = GuideParserService.generateAutoTags(
        'Complete walkthrough with all achievements and secrets for this RPG',
        'game-faq.txt'
      );

      expect(tags).toContain('FAQ');
      expect(tags).toContain('Walkthrough');
      expect(tags).toContain('Achievements');
      expect(tags).toContain('Secrets');
      expect(tags).toContain('RPG');
      expect(tags).toContain('Complete Guide');
    });

    it('should return empty array for content with no matching tags', () => {
      const tags = GuideParserService.generateAutoTags('Hello world', 'file.txt');
      expect(tags).toEqual([]);
    });

    it('should detect ASCII art and add tag', () => {
      const asciiArt = `
  _______ _     _ _______
 |__   __| |   | |__   __|
    | |  | |___| |  | |
    | |  |  ___  |  | |
    | |  | |   | |  | |
    |_|  |_|   |_|  |_|
Regular content follows...
      `.repeat(3);

      const tags = GuideParserService.generateAutoTags(asciiArt, 'guide.txt');
      expect(tags).toContain('ASCII Art');
    });
  });

  describe('extractGameInfoFromFilename', () => {
    it('should extract game ID and name from standard format', () => {
      const result = GuideParserService.extractGameInfoFromFilename(
        '/path/to/588690-star-fox-faqs-123.txt'
      );

      expect(result.gameId).toBe('588690');
      expect(result.gameName).toBe('Star Fox');
    });

    it('should handle filenames without ID prefix', () => {
      const result = GuideParserService.extractGameInfoFromFilename(
        '/path/to/zelda-guide.txt'
      );

      expect(result.gameId).toBeNull();
      expect(result.gameName).toBeTruthy();
    });

    it('should extract game name up to faqs separator', () => {
      const result = GuideParserService.extractGameInfoFromFilename(
        '/path/to/12345-final-fantasy-vii-faqs-99.txt'
      );

      expect(result.gameId).toBe('12345');
      expect(result.gameName).toBe('Final Fantasy Vii');
    });

    it('should extract game name up to guides separator', () => {
      const result = GuideParserService.extractGameInfoFromFilename(
        '/path/to/12345-mario-kart-guides-1.txt'
      );

      expect(result.gameId).toBe('12345');
      expect(result.gameName).toBe('Mario Kart');
    });

    it('should extract game name up to walkthrough separator', () => {
      const result = GuideParserService.extractGameInfoFromFilename(
        '/path/to/12345-sonic-adventure-walkthrough.txt'
      );

      expect(result.gameId).toBe('12345');
      expect(result.gameName).toBe('Sonic Adventure');
    });

    it('should return Unknown Game for empty game name part', () => {
      const result = GuideParserService.extractGameInfoFromFilename(
        '/path/to/12345-faqs.txt'
      );

      expect(result.gameId).toBe('12345');
      expect(result.gameName).toBe('Unknown Game');
    });
  });

  describe('extractGameInfoFromPath', () => {
    it('should extract info from path with faqs directory', () => {
      const result = GuideParserService.extractGameInfoFromPath(
        '/archive/snes/960943-game-box-serie/faqs/guide.txt'
      );

      expect(result.gameId).toBe('960943');
      expect(result.gameName).toBe('Game Box Serie');
      expect(result.platform).toBe('SNES');
    });

    it('should extract platform from directory structure', () => {
      const result = GuideParserService.extractGameInfoFromPath(
        '/archive/n64/12345-mario-game/faqs/walkthrough.txt'
      );

      expect(result.platform).toBe('N64');
    });

    it('should handle path without platform directory', () => {
      const result = GuideParserService.extractGameInfoFromPath(
        '/archive/12345-game-name/faqs/guide.txt'
      );

      expect(result.gameId).toBe('12345');
      expect(result.gameName).toBe('Game Name');
      expect(result.platform).toBeNull();
    });

    it('should fall back to filename extraction when no faqs dir', () => {
      const result = GuideParserService.extractGameInfoFromPath(
        '/path/to/12345-game-name-faqs.txt'
      );

      expect(result.gameId).toBe('12345');
      expect(result.gameName).toBe('Game Name');
    });

    it('should normalize various platform directory names', () => {
      const platformTests: Array<{ dir: string; expected: string }> = [
        { dir: 'nes', expected: 'NES' },
        { dir: 'snes', expected: 'SNES' },
        { dir: 'n64', expected: 'N64' },
        { dir: 'gamecube', expected: 'GameCube' },
        { dir: 'wii', expected: 'Wii' },
        { dir: 'switch', expected: 'Switch' },
        { dir: 'genesis', expected: 'Genesis' },
        { dir: 'saturn', expected: 'Saturn' },
        { dir: 'dreamcast', expected: 'Dreamcast' },
        { dir: 'ps1', expected: 'PS1' },
        { dir: 'ps2', expected: 'PS2' },
        { dir: 'psp', expected: 'PSP' },
        { dir: 'vita', expected: 'Vita' },
        { dir: 'xbox', expected: 'Xbox' },
        { dir: 'xbox360', expected: 'Xbox 360' },
        { dir: 'gba', expected: 'GBA' },
        { dir: 'ds', expected: 'DS' },
        { dir: '3ds', expected: '3DS' },
        { dir: 'pc', expected: 'PC' },
      ];

      for (const { dir, expected } of platformTests) {
        const result = GuideParserService.extractGameInfoFromPath(
          `/archive/${dir}/12345-test-game/faqs/guide.txt`
        );
        expect(result.platform).toBe(expected);
      }
    });

    it('should return null platform for unknown directory', () => {
      const result = GuideParserService.extractGameInfoFromPath(
        '/archive/unknown-platform/12345-test-game/faqs/guide.txt'
      );

      expect(result.platform).toBeNull();
    });
  });

  describe('HTML sanitization', () => {
    it('should remove noscript tags', async () => {
      mockFileText.mockResolvedValue(
        '<html><noscript>Enable JavaScript</noscript><p>Content</p></html>'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.html');

      expect(result.content).not.toContain('noscript');
      expect(result.content).not.toContain('Enable JavaScript');
    });

    it('should remove event handlers', async () => {
      mockFileText.mockResolvedValue(
        '<html><div onclick="alert(1)" onmouseover="hack()">Content</div></html>'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.html');

      expect(result.content).not.toContain('onclick');
      expect(result.content).not.toContain('onmouseover');
      expect(result.content).not.toContain('alert');
    });

    it('should remove javascript: URLs', async () => {
      mockFileText.mockResolvedValue(
        '<html><a href="javascript:alert(1)">Click</a></html>'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.html');

      expect(result.content).not.toContain('javascript:');
    });

    it('should remove data: URLs', async () => {
      mockFileText.mockResolvedValue(
        '<html><a href="data:text/html,<script>alert(1)</script>">Click</a></html>'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.html');

      expect(result.content).not.toContain('data:');
    });

    it('should remove object tags', async () => {
      mockFileText.mockResolvedValue(
        '<html><object data="malicious.swf"></object><p>Content</p></html>'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.html');

      expect(result.content).not.toContain('object');
      expect(result.content).not.toContain('malicious');
    });

    it('should remove embed tags', async () => {
      mockFileText.mockResolvedValue(
        '<html><embed src="malicious.swf"><p>Content</p></html>'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.html');

      expect(result.content).not.toContain('embed');
    });

    it('should remove iframe tags', async () => {
      mockFileText.mockResolvedValue(
        '<html><iframe src="http://evil.com"></iframe><p>Content</p></html>'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.html');

      expect(result.content).not.toContain('iframe');
      expect(result.content).not.toContain('evil.com');
    });

    it('should remove form tags', async () => {
      mockFileText.mockResolvedValue(
        '<html><form action="/steal"><input type="text"></form><p>Content</p></html>'
      );

      const result = await GuideParserService.parseGuide('/path/to/guide.html');

      expect(result.content).not.toContain('form');
      expect(result.content).not.toContain('steal');
    });
  });
});
