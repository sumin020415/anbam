'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteComment, type CommentRow } from '@/lib/services/comments';
import { createClient } from '@/lib/supabase/client';
import CommentForm from './CommentForm';
import AuthorAvatar from '@/components/AuthorAvatar';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

type Props = {
  comment: CommentRow;
  childrenMap: Map<string, CommentRow[]>;
  currentUserId: string | null;
  depth: number;
};

export default function CommentItem({
  comment,
  childrenMap,
  currentUserId,
  depth,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOwner = !!currentUserId && currentUserId === comment.author_id;
  const replies = childrenMap.get(comment.id) ?? [];
  const visualDepth = Math.min(depth, 2);
  const padLeft = visualDepth * 20;

  const handleDelete = async () => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    setBusy(true);
    try {
      await deleteComment(createClient(), comment.id);
      router.refresh();
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : '댓글 삭제 중 오류가 발생했습니다',
      );
      setBusy(false);
    }
  };

  return (
    <div style={{ paddingLeft: padLeft }}>
      <div className="rounded-anbam border border-line-1 bg-white p-3">
        <div className="flex items-center justify-between text-xs text-ink-2">
          <span className="flex min-w-0 items-center gap-1.5 font-bold text-ink-1">
            <AuthorAvatar
              nickname={comment.profiles?.nickname ?? null}
              avatarUrl={comment.profiles?.avatar_url ?? null}
              size={20}
            />
            <span className="truncate">
              {comment.profiles?.nickname ?? '익명'}
            </span>
          </span>
          <span>{formatDateTime(comment.created_at)}</span>
        </div>

        {editing ? (
          <div className="mt-2">
            <CommentForm
              postId={comment.post_id}
              mode="edit"
              commentId={comment.id}
              initialContent={comment.content}
              onDone={() => setEditing(false)}
            />
          </div>
        ) : (
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-1">
            {comment.content}
          </p>
        )}

        {!editing && (
          <div className="mt-2 flex justify-end gap-3 text-xs">
            {currentUserId && (
              <button
                type="button"
                onClick={() => setReplying((v) => !v)}
                className="text-ink-2 hover:text-ink-1"
              >
                {replying ? '답글 취소' : '답글'}
              </button>
            )}
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-ink-2 hover:text-ink-1"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="text-warn disabled:opacity-60"
                >
                  {busy ? '...' : '삭제'}
                </button>
              </>
            )}
          </div>
        )}

        {replying && (
          <div className="mt-2">
            <CommentForm
              postId={comment.post_id}
              parentId={comment.id}
              placeholder="답글을 입력하세요"
              onDone={() => setReplying(false)}
            />
          </div>
        )}
      </div>

      {replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              childrenMap={childrenMap}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
