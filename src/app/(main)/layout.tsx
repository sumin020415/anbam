import Header from '@/components/layout/Header';
import ScrollToTopButton from '@/components/layout/ScrollToTopButton';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <ScrollToTopButton />
    </>
  );
}
