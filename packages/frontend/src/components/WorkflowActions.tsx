import { useState } from 'react';
import {
  useApprove,
  useSchedule,
  usePublish,
  useUnpublish,
  usePreview,
} from '../api/workflow';
import type { Release } from '../api/releases';

interface Props {
  release: Release;
}

export default function WorkflowActions({ release }: Props) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const approve = useApprove(release.id);
  const schedule = useSchedule(release.id);
  const publish = usePublish(release.id);
  const unpublish = useUnpublish(release.id);
  const preview = usePreview(release.id, showPreview);

  const isApproved = release.reference?.startsWith('NEWS-');
  const isScheduled = release.isCommitted && !release.isPublished;
  const isPublished = release.isPublished;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Workflow
      </h3>

      <div className="flex flex-wrap gap-2">
        {/* Approve — only if not yet approved */}
        {!isApproved && (
          <button
            onClick={() => {
              if (confirm('Approve this release? This will assign a NEWS reference number.')) {
                approve.mutate();
              }
            }}
            disabled={approve.isPending}
            className="px-3 py-1.5 text-sm font-medium bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
          >
            {approve.isPending ? 'Approving...' : 'Approve'}
          </button>
        )}

        {/* Schedule — only if approved and not published */}
        {isApproved && !isPublished && (
          <>
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Schedule
            </button>

            {/* Publish Now — only if approved */}
            <button
              onClick={() => {
                if (confirm('Publish this release immediately?')) {
                  publish.mutate();
                }
              }}
              disabled={publish.isPending}
              className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {publish.isPending ? 'Publishing...' : 'Publish Now'}
            </button>
          </>
        )}

        {/* Unpublish / Cancel — if committed or published */}
        {(isScheduled || isPublished) && (
          <button
            onClick={() => {
              const msg = isPublished
                ? 'Unpublish this release?'
                : 'Cancel the scheduled publish?';
              if (confirm(msg)) unpublish.mutate();
            }}
            disabled={unpublish.isPending}
            className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {unpublish.isPending
              ? 'Processing...'
              : isPublished
                ? 'Unpublish'
                : 'Cancel Schedule'}
          </button>
        )}

        {/* Preview */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
            showPreview
              ? 'bg-gray-200 border-gray-300 text-gray-700'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {showPreview ? 'Hide Preview' : 'Preview'}
        </button>

        {/* PDF download */}
        <a
          href={`/api/releases/${release.id}/workflow/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          PDF
        </a>
      </div>

      {/* Error messages */}
      {(approve.error || schedule.error || publish.error || unpublish.error) && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded border border-red-200">
          {(approve.error || schedule.error || publish.error || unpublish.error)?.message}
        </div>
      )}

      {/* Schedule date picker */}
      {showSchedule && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">
              Publish Date/Time
            </label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              if (scheduleDate) {
                schedule.mutate(new Date(scheduleDate).toISOString());
                setShowSchedule(false);
              }
            }}
            disabled={!scheduleDate || schedule.isPending}
            className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {schedule.isPending ? 'Scheduling...' : 'Confirm'}
          </button>
        </div>
      )}

      {/* Preview panel */}
      {showPreview && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              HTML Preview
            </span>
            <a
              href={`/api/releases/${release.id}/workflow/preview/html`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#003366] hover:underline"
            >
              Open in new tab
            </a>
          </div>
          {preview.isLoading ? (
            <div className="p-8 text-center text-gray-400">
              Generating preview...
            </div>
          ) : preview.data ? (
            <iframe
              srcDoc={preview.data.html}
              className="w-full border-0"
              style={{ height: '500px' }}
              title="Release preview"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
