import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useRelease,
  useUpdateRelease,
  useUpdateReleaseLanguage,
  useUpdateAssociations,
  useUpdateDocumentLanguage,
  useSetDocumentContacts,
  useCreateDocument,
  useDeleteDocument,
  type ReleaseDocument,
} from '../api/releases';
import { useMinistries, useSectors, useThemes, useTags } from '../api/reference-data';
import RichTextEditor from '../components/RichTextEditor';
import WorkflowActions from '../components/WorkflowActions';
import MultiSelect from '../components/MultiSelect';
import AuditLog from '../components/AuditLog';

function DocumentEditor({
  doc,
  releaseId,
  canDelete,
}: {
  doc: ReleaseDocument;
  releaseId: string;
  canDelete: boolean;
}) {
  const [activeLang, setActiveLang] = useState('en');
  const lang = doc.languages.find((l) => l.languageId === activeLang);

  const [headline, setHeadline] = useState(lang?.headline ?? '');
  const [subheadline, setSubheadline] = useState(lang?.subheadline ?? '');
  const [organizations, setOrganizations] = useState(lang?.organizations ?? '');
  const [byline, setByline] = useState(lang?.byline ?? '');
  const [bodyHtml, setBodyHtml] = useState(lang?.bodyHtml ?? '');
  const [contacts, setContacts] = useState(
    doc.contacts
      .filter((c) => c.languageId === activeLang)
      .map((c) => c.information),
  );

  // Reset fields when language tab changes
  useEffect(() => {
    const l = doc.languages.find((x) => x.languageId === activeLang);
    setHeadline(l?.headline ?? '');
    setSubheadline(l?.subheadline ?? '');
    setOrganizations(l?.organizations ?? '');
    setByline(l?.byline ?? '');
    setBodyHtml(l?.bodyHtml ?? '');
    setContacts(
      doc.contacts
        .filter((c) => c.languageId === activeLang)
        .map((c) => c.information),
    );
  }, [activeLang, doc]);

  const updateDocLang = useUpdateDocumentLanguage(releaseId);
  const setDocContacts = useSetDocumentContacts(releaseId);
  const deleteDoc = useDeleteDocument(releaseId);

  const save = useCallback(() => {
    updateDocLang.mutate({
      docId: doc.id,
      langId: activeLang,
      data: { headline, subheadline, organizations, byline, bodyHtml },
    });
    setDocContacts.mutate({
      docId: doc.id,
      langId: activeLang,
      contacts: contacts.filter((c) => c.trim() !== ''),
    });
  }, [doc.id, activeLang, headline, subheadline, organizations, byline, bodyHtml, contacts, updateDocLang, setDocContacts]);

  const hasFr = doc.languages.some((l) => l.languageId === 'fr');

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex gap-1">
          {['en', 'fr'].map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeLang === lang
                  ? 'bg-[#003366] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${lang === 'fr' && !hasFr ? 'opacity-50' : ''}`}
            >
              {lang.toUpperCase()}
              {lang === 'fr' && !hasFr && ' (add)'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={updateDocLang.isPending}
            className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {updateDocLang.isPending ? 'Saving...' : 'Save Document'}
          </button>
          {canDelete && (
            <button
              onClick={() => {
                if (confirm('Remove this document?')) deleteDoc.mutate(doc.id);
              }}
              className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline *</label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              maxLength={255}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
            <input
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              maxLength={100}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organizations</label>
            <input
              value={organizations}
              onChange={(e) => setOrganizations(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              maxLength={250}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Byline</label>
            <input
              value={byline}
              onChange={(e) => setByline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              maxLength={250}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
          <RichTextEditor
            key={`${doc.id}-${activeLang}`}
            content={bodyHtml}
            onUpdate={setBodyHtml}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contacts
          </label>
          {contacts.map((c, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={c}
                onChange={(e) => {
                  const updated = [...contacts];
                  updated[i] = e.target.value;
                  setContacts(updated);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
                placeholder="Contact information"
              />
              <button
                onClick={() => setContacts(contacts.filter((_, j) => j !== i))}
                className="text-red-500 hover:text-red-700 text-sm px-2"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => setContacts([...contacts, ''])}
            className="text-sm text-[#003366] hover:underline"
          >
            + Add contact
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReleaseEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: release, isLoading } = useRelease(id!);
  const updateRelease = useUpdateRelease(id!);
  const updateAssociations = useUpdateAssociations(id!);
  const createDocument = useCreateDocument(id!);

  const ministries = useMinistries();
  const sectors = useSectors();
  const themes = useThemes();
  const tags = useTags();

  // Local metadata state
  const [releaseType, setReleaseType] = useState('');
  const [ministryId, setMinistryId] = useState('');
  const [releaseDateTime, setReleaseDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [summary, setSummary] = useState('');
  const [keywords, setKeywords] = useState('');

  // Association state
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const updateReleaseLanguage = useUpdateReleaseLanguage(id!, 'en');

  // Populate from release data
  useEffect(() => {
    if (!release) return;
    setReleaseType(release.releaseType);
    setMinistryId(release.ministryId ?? '');
    setReleaseDateTime(
      release.releaseDateTime
        ? new Date(release.releaseDateTime).toISOString().slice(0, 16)
        : '',
    );
    setKeywords(release.keywords ?? '');
    const enLang = release.languages?.find((l) => l.languageId === 'en');
    setLocation(enLang?.location ?? '');
    setSummary(enLang?.summary ?? '');
    setSelectedMinistries(release.ministries?.map((m) => m.ministry.id) ?? []);
    setSelectedSectors(release.sectors?.map((s) => s.sector.id) ?? []);
    setSelectedThemes(release.themes?.map((t) => t.theme.id) ?? []);
    setSelectedTags(release.tags?.map((t) => t.tag.id) ?? []);
  }, [release]);

  function saveMetadata() {
    updateRelease.mutate({
      releaseType,
      ministryId: ministryId || null,
      releaseDateTime: releaseDateTime || null,
      keywords,
    });
    updateReleaseLanguage.mutate({ location, summary });
    updateAssociations.mutate({
      ministryIds: selectedMinistries,
      sectorIds: selectedSectors,
      themeIds: selectedThemes,
      tagIds: selectedTags,
    });
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Loading release...</div>;
  }

  if (!release) {
    return <div className="text-center py-12 text-gray-400">Release not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/releases')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1"
          >
            &larr; Back to releases
          </button>
          <h2 className="text-xl font-semibold">
            {release.reference || 'Draft Release'}
            {release.key && (
              <span className="text-sm text-gray-400 ml-2 font-mono">{release.key}</span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${
              release.isPublished
                ? 'bg-green-100 text-green-800'
                : release.isCommitted
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
            }`}
          >
            {release.isPublished ? 'Published' : release.isCommitted ? 'Scheduled' : 'Draft'}
          </span>
          <button
            onClick={saveMetadata}
            disabled={updateRelease.isPending}
            className="px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-md hover:bg-[#002244] disabled:opacity-50"
          >
            {updateRelease.isPending ? 'Saving...' : 'Save Metadata'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Documents */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Documents
            </h3>
            <button
              onClick={() => createDocument.mutate()}
              className="text-sm text-[#003366] hover:underline"
            >
              + Add document
            </button>
          </div>

          {release.documents?.map((doc) => (
            <DocumentEditor
              key={doc.id}
              doc={doc}
              releaseId={release.id}
              canDelete={(release.documents?.length ?? 0) > 1}
            />
          ))}
        </div>

        {/* Right: Sidebar metadata */}
        <div className="space-y-5">
          {/* Release type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={releaseType}
              onChange={(e) => setReleaseType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            >
              <option value="RELEASE">Release</option>
              <option value="STORY">Story</option>
              <option value="FACTSHEET">Factsheet</option>
              <option value="UPDATE">Update</option>
              <option value="ADVISORY">Advisory</option>
            </select>
          </div>

          {/* Ministry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead Ministry</label>
            <select
              value={ministryId}
              onChange={(e) => setMinistryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            >
              <option value="">— None —</option>
              {ministries.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Release date/time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Date/Time
            </label>
            <input
              type="datetime-local"
              value={releaseDateTime}
              onChange={(e) => setReleaseDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              maxLength={50}
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] resize-y"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              placeholder="Comma-separated"
            />
          </div>

          {/* Multi-selects */}
          <MultiSelect
            label="Ministries"
            options={ministries.data?.map((m) => ({ id: m.id, label: m.displayName })) ?? []}
            selected={selectedMinistries}
            onChange={setSelectedMinistries}
            loading={ministries.isLoading}
          />

          <MultiSelect
            label="Sectors"
            options={sectors.data?.map((s) => ({ id: s.id, label: s.displayName ?? s.key })) ?? []}
            selected={selectedSectors}
            onChange={setSelectedSectors}
            loading={sectors.isLoading}
          />

          <MultiSelect
            label="Themes"
            options={themes.data?.map((t) => ({ id: t.id, label: t.displayName ?? t.key })) ?? []}
            selected={selectedThemes}
            onChange={setSelectedThemes}
            loading={themes.isLoading}
          />

          <MultiSelect
            label="Tags"
            options={tags.data?.map((t) => ({ id: t.id, label: t.displayName ?? t.key })) ?? []}
            selected={selectedTags}
            onChange={setSelectedTags}
            loading={tags.isLoading}
          />

          {/* Audit log */}
          {/* Workflow */}
          <WorkflowActions release={release} />

          {/* Audit log */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Activity Log
            </h3>
            <AuditLog logs={release.logs ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}
