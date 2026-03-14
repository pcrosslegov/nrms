import { GenerationService } from './generation.service';

describe('GenerationService', () => {
  let service: GenerationService;

  beforeEach(() => {
    service = new GenerationService();
  });

  const mockRelease = {
    id: 'r-1',
    reference: 'NEWS-00042',
    key: '2026DH0001-000001',
    releaseType: 'RELEASE',
    releaseDateTime: new Date('2026-03-13T12:00:00Z'),
    publishDateTime: null,
    ministry: { displayName: 'Department of Health', abbreviation: 'DH' },
    languages: [{ languageId: 'en', location: 'Fredericton', summary: 'Test summary' }],
    documents: [
      {
        id: 'd-1',
        sortIndex: 0,
        languages: [
          {
            languageId: 'en',
            headline: 'Test Headline',
            subheadline: 'Test Subheadline',
            organizations: 'Department of Health',
            byline: 'By Jane Doe',
            bodyHtml: '<p>This is the body content.</p>',
          },
        ],
        contacts: [
          { languageId: 'en', sortIndex: 0, information: 'John Smith, 555-1234' },
        ],
      },
    ],
  };

  describe('generateHtml', () => {
    it('should produce valid HTML with release data', () => {
      const html = service.generateHtml(mockRelease);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Headline');
      expect(html).toContain('Test Subheadline');
      expect(html).toContain('Department of Health');
      expect(html).toContain('NEWS-00042');
      expect(html).toContain('This is the body content.');
      expect(html).toContain('John Smith, 555-1234');
      expect(html).toContain('Fredericton');
    });

    it('should escape HTML in metadata fields', () => {
      const release = {
        ...mockRelease,
        ministry: { displayName: '<script>alert(1)</script>', abbreviation: 'X' },
      };
      const html = service.generateHtml(release);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('generateTxt', () => {
    it('should produce plain text with release data', () => {
      const txt = service.generateTxt(mockRelease);

      expect(txt).toContain('Department of Health');
      expect(txt).toContain('NEWS-00042');
      expect(txt).toContain('Test Headline');
      expect(txt).toContain('This is the body content.');
      expect(txt).toContain('John Smith, 555-1234');
      expect(txt).not.toContain('<p>');
    });
  });
});
