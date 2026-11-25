import { useMutation } from '@tanstack/react-query';
import { Alert, Modal } from 'react-bootstrap';

export interface ExtensionDeleteModalData {
  extensionId: string;
  extensionName: string | null;
  userData: { uid: string; name: string | null; enrollment_id: string }[];
}

export function ExtensionDeleteModal({
  data,
  csrfToken,
  show,
  onHide,
  onExited,
  onSuccess,
}: {
  data: ExtensionDeleteModalData | null;
  csrfToken: string;
  show: boolean;
  onHide: () => void;
  onExited: () => void;
  onSuccess: () => void;
}) {
  const deleteMutation = useMutation({
    mutationFn: async (extensionId: string) => {
      const requestBody = {
        __csrf_token: csrfToken,
        __action: 'delete_extension',
        extension_id: extensionId,
      };
      const resp = await fetch(window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!resp.ok) {
        const body = await resp.json();
        throw new Error(body.message);
      }
    },
    onSuccess,
  });

  return (
    <Modal backdrop="static" show={show} onHide={onHide} onExited={onExited}>
      <Modal.Header closeButton>
        <Modal.Title>حذف تمدید</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {deleteMutation.isError && (
          <Alert variant="danger" dismissible onClose={() => deleteMutation.reset()}>
            {deleteMutation.error.message}
          </Alert>
        )}
        {data && (
          <>
            <p>
              آیا از حذف{' '}
              {data.extensionName === null
                ? 'این تمدید'
                : `تمدید «${data.extensionName}»`}{' '}
              اطمینان دارید؟
            </p>
            <details>
              <summary>نمایش دانشجویان مشمول</summary>
              <table className="table table-bordered table-sm mb-0">
                <thead>
                  <tr>
                    <th>شناسه کاربری (UID)</th>
                    <th>نام و نام خانوادگی</th>
                  </tr>
                </thead>
                <tbody>
                  {data.userData.map((user) => (
                    <tr key={user.enrollment_id}>
                      <td>{user.uid}</td>
                      <td>{user.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={deleteMutation.isPending}
          onClick={onHide}
        >
          انصراف
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (!data) return;
            deleteMutation.mutate(data.extensionId);
          }}
        >
          {deleteMutation.isPending ? 'در حال حذف...' : 'حذف'}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
