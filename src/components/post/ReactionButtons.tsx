'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import {
  setReaction,
  removeReaction,
  type ReactionCounts,
  type ReactionType,
} from '@/lib/services/reactions';
import { createClient } from '@/lib/supabase/client';

type Props = {
  postId: string;
  initialCounts: ReactionCounts;
  initialMine: ReactionType | null;
  isLoggedIn: boolean;
};

export default function ReactionButtons({
  postId,
  initialCounts,
  initialMine,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async (type: ReactionType) => {
    if (!isLoggedIn) {
      router.push(`/login?next=/posts/${postId}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const client = createClient();
      if (initialMine === type) {
        await removeReaction(client, postId);
      } else {
        await setReaction(client, postId, type);
      }
      router.refresh();
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : '반응 처리 중 오류가 발생했습니다',
      );
    } finally {
      setBusy(false);
    }
  };

  const likeActive = initialMine === 'like';
  const dislikeActive = initialMine === 'dislike';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handleClick('like')}
        disabled={busy}
        aria-pressed={likeActive}
        className={`flex items-center gap-1.5 rounded-anbam border px-3 py-1.5 text-sm font-bold transition disabled:opacity-60 ${
          likeActive
            ? 'border-point bg-point text-ink-1'
            : 'border-line-1 bg-white text-ink-1 hover:border-point'
        }`}
      >
        <FiThumbsUp />
        <span>{initialCounts.like}</span>
      </button>
      <button
        type="button"
        onClick={() => handleClick('dislike')}
        disabled={busy}
        aria-pressed={dislikeActive}
        className={`flex items-center gap-1.5 rounded-anbam border px-3 py-1.5 text-sm font-bold transition disabled:opacity-60 ${
          dislikeActive
            ? 'border-warn bg-line-2 text-warn'
            : 'border-line-1 bg-white text-ink-2 hover:border-warn'
        }`}
      >
        <FiThumbsDown />
        <span>{initialCounts.dislike}</span>
      </button>
    </div>
  );
}
