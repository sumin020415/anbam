// 작성자 아바타 (프로필 이미지 or 닉네임 첫 글자 fallback). server/client 양쪽 사용 가능한 shared 컴포넌트.
export default function AuthorAvatar({
  nickname,
  avatarUrl,
  size = 20,
}: {
  nickname: string | null;
  avatarUrl: string | null;
  size?: number;
}) {
  const initial = (nickname ?? '익명').charAt(0) || '?';
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-line-2 align-middle"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span
          className="font-bold leading-none text-ink-1"
          style={{ fontSize: Math.max(10, Math.round(size * 0.45)) }}
        >
          {initial}
        </span>
      )}
    </span>
  );
}
