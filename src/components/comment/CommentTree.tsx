'use client';

import { useMemo } from 'react';
import type { CommentRow } from '@/lib/services/comments';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const ROOT_KEY = '__root__';

type Props = {
  postId: string;
  comments: CommentRow[];
  currentUserId: string | null;
};

export default function CommentTree({
  postId,
  comments,
  currentUserId,
}: Props) {
  const childrenMap = useMemo(() => {
    const map = new Map<string, CommentRow[]>();
    for (const c of comments) {
      const key = c.parent_id ?? ROOT_KEY;
      const arr = map.get(key);
      if (arr) arr.push(c);
      else map.set(key, [c]);
    }
    return map;
  }, [comments]);

  const topLevel = childrenMap.get(ROOT_KEY) ?? [];

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-ink-1">
        댓글 {comments.length}
      </h2>

      {currentUserId ? (
        <div className="mt-4">
          <CommentForm postId={postId} />
        </div>
      ) : (
        <p className="mt-4 rounded-anbam bg-line-2 p-3 text-sm text-ink-2">
          댓글을 작성하려면 로그인이 필요합니다.
        </p>
      )}

      {topLevel.length === 0 ? (
        <p className="mt-6 text-sm text-ink-2">아직 댓글이 없습니다.</p>
      ) : (
        <div className="mt-6 space-y-2">
          {topLevel.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              childrenMap={childrenMap}
              currentUserId={currentUserId}
              depth={0}
            />
          ))}
        </div>
      )}
    </section>
  );
}
