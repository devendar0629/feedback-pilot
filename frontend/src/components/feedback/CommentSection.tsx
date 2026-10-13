import React, { useState } from 'react';
import { Lock, MessageSquare, Send, ShieldAlert, User as UserIcon } from 'lucide-react';
import { Comment, UserRole } from '../../types';
import { Button } from '../ui/Button';

interface CommentSectionProps {
  comments: Comment[];
  userRole?: UserRole;
  onAddComment: (content: string, isInternal: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  userRole,
  onAddComment,
  isLoading = false,
}) => {
  const isStaff = userRole === 'administrator' || userRole === 'agent';
  const [activeTab, setActiveTab] = useState<'public' | 'internal'>('public');
  const [content, setContent] = useState('');
  const [isInternalPost, setIsInternalPost] = useState(false);

  const publicComments = comments.filter((c) => !c.is_internal);
  const internalComments = comments.filter((c) => c.is_internal);

  const displayedComments = activeTab === 'public' ? publicComments : internalComments;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onAddComment(content, isStaff && isInternalPost);
    setContent('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          Comments & Updates
        </h3>

        {/* Tab selection for Staff */}
        {isStaff && (
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('public');
                setIsInternalPost(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'public'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Public Responses ({publicComments.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('internal');
                setIsInternalPost(true);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'internal'
                  ? 'bg-amber-100 text-amber-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Internal Notes ({internalComments.length})
            </button>
          </div>
        )}
      </div>

      {/* Internal Note Banner Warning */}
      {isStaff && activeTab === 'internal' && (
        <div className="my-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Staff Only Area:</strong> Internal notes are strictly hidden from reporters and public tracking.
          </span>
        </div>
      )}

      {/* Comments List */}
      <div className="mt-4 flex flex-col gap-3.5 max-h-96 overflow-y-auto pr-1">
        {displayedComments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No {activeTab === 'internal' ? 'internal notes' : 'public responses'} yet.
          </div>
        ) : (
          displayedComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-xl border text-sm ${
                comment.is_internal
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      comment.is_internal
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {comment.author_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-900 text-xs">
                    {comment.author_name}
                  </span>
                  {comment.is_internal && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                      <Lock className="w-2.5 h-2.5" /> Staff Internal
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-xs leading-relaxed">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Input Form */}
      <form onSubmit={handleSubmit} className="mt-5 pt-4 border-t border-slate-100">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isStaff && isInternalPost
                ? 'Write private internal staff note...'
                : 'Write a public response to reporter...'
            }
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          {isStaff ? (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternalPost}
                onChange={(e) => {
                  setIsInternalPost(e.target.checked);
                  if (e.target.checked) setActiveTab('internal');
                }}
                className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Make this a private staff note
              </span>
            </label>
          ) : (
            <span className="text-xs text-slate-400">Public reply</span>
          )}

          <Button type="submit" size="sm" isLoading={isLoading} disabled={!content.trim()}>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Send Comment
          </Button>
        </div>
      </form>
    </div>
  );
};
