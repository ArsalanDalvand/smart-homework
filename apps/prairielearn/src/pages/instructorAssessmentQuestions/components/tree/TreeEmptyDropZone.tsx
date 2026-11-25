export function TreeEmptyDropZone({ dropRef }: { dropRef: (node: HTMLElement | null) => void }) {
  return (
    <div
      ref={dropRef}
      className="bg-warning-subtle"
      style={{ padding: '1rem', textAlign: 'center' }}
    >
      <i className="bi bi-exclamation-triangle text-warning me-2" aria-hidden="true" />
      این بخش هیچ سوالی ندارد. پیش از ذخیره، سوال اضافه کنید یا این بخش را حذف نمایید.
    </div>
  );
}
