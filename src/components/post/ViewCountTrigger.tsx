'use client';

import { useEffect, useRef } from 'react';
import { incrementViewCount } from '@/lib/services/posts';
import { createClient } from '@/lib/supabase/client';

export default function ViewCountTrigger({ postId }: { postId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void incrementViewCount(createClient(), postId);
  }, [postId]);

  return null;
}
