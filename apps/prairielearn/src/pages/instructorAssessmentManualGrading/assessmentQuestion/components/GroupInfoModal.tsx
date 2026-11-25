import { useCallback, useState } from 'react';
import { Alert, Button, Modal } from 'react-bootstrap';

import { assertNever } from '@prairielearn/utils';

import type { useManualGradingActions } from '../utils/useManualGradingActions.js';

const defaultClosedSubmissionsOnly = true;

export type GroupInfoModalState =
  | { type: 'selected'; ids: string[] }
  | { type: 'all' }
  | { type: 'ungrouped' }
  | null;

export function GroupInfoModal({
  modalState,
  numOpenInstances,
  mutation,
  onHide,
}: {
  modalState: GroupInfoModalState;
  numOpenInstances: number;
  mutation: ReturnType<typeof useManualGradingActions>['groupSubmissionMutation'];
  onHide: () => void;
}) {
  const [closedSubmissionsOnly, setClosedSubmissionsOnly] = useState(true);

  const handleClose = useCallback(() => {
    setClosedSubmissionsOnly(defaultClosedSubmissionsOnly);
    mutation.reset();
    onHide();
  }, [onHide, mutation]);

  const handleSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!modalState) return;

      switch (modalState.type) {
        case 'selected': {
          mutation.mutate(
            {
              selection: modalState.ids,
              closed_instance_questions_only: closedSubmissionsOnly,
            },
            {
              onSuccess: onHide,
            },
          );
          break;
        }
        case 'all': {
          mutation.mutate(
            {
              selection: 'all',
              closed_instance_questions_only: closedSubmissionsOnly,
            },
            {
              onSuccess: onHide,
            },
          );
          break;
        }
        case 'ungrouped': {
          mutation.mutate(
            {
              selection: 'ungrouped',
              closed_instance_questions_only: closedSubmissionsOnly,
            },
            {
              onSuccess: onHide,
            },
          );
          break;
        }
        default:
          assertNever(modalState);
      }
    },
    [modalState, closedSubmissionsOnly, mutation, onHide],
  );

  const getTitle = () => {
    if (modalState == null) return '';

    if (modalState.type === 'all') {
      return 'گروه‌بندی تمام ارسال‌ها';
    } else if (modalState.type === 'ungrouped') {
      return 'گروه‌بندی ارسال‌های گروه‌بندی‌نشده';
    } else {
      return 'گروه‌بندی ارسال‌های انتخاب‌شده';
    }
  };

  return (
    <Modal
      show={modalState != null}
      size="lg"
      backdrop="static"
      keyboard={false}
      onHide={handleClose}
    >
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{getTitle()}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>
            پاسخ‌های ارسالی دانشجویان را بر اساس اینکه آیا{' '}
            <strong>دقیقاً با پاسخ صحیح مطابقت دارند یا خیر</strong> گروه‌بندی می‌کند.
          </p>

          <p>پاسخ‌های منطبق در یک گروه قرار می‌گیرند و بقیه به‌صورت جداگانه گروه‌بندی می‌شوند.</p>

          <p>
            برای فعال‌سازی گروه‌بندی، پاسخ صحیح باید در <code>pl-answer-panel</code> ارائه شده باشد.
          </p>

          <p>
            گروه‌بندی هم‌ارزی دقیق با پاسخ نهایی را بررسی کرده و برای تشکیل گروه‌ها تنها پاسخ
            نهایی یا کادرگذاری‌شده را در نظر می‌گیرد.
          </p>

          <p>نمونه‌هایی از موارد قابل گروه‌بندی و غیرقابل گروه‌بندی:</p>

          <div
            className="d-grid border rounded overflow-hidden"
            style={{ gridTemplateColumns: '1fr 1fr' }}
          >
            <div className="px-2 py-1 bg-light fw-bold border-end">قابل گروه‌بندی</div>
            <div className="px-2 py-1 bg-light fw-bold">غیرقابل گروه‌بندی</div>

            <div className="px-2 py-1 border-top border-end">معادلات ریاضی</div>
            <div className="px-2 py-1 border-top">مقاله و متن طولانی</div>

            <div className="px-2 py-1 border-top border-end">فرمول‌های مکانیکی</div>
            <div className="px-2 py-1 border-top">سوالات تشریحی آزاد</div>

            <div className="px-2 py-1 border-top border-end">ورودی‌های متنی دقیق</div>
            <div className="px-2 py-1 border-top">کدنویسی آزاد</div>

            <div className="px-2 py-1 border-top border-end">
              پاسخ‌های دست‌نویس با ۱ پاسخ صحیح
            </div>
            <div className="px-2 py-1 border-top">
              پاسخ‌های دست‌نویس با ۲ پاسخ صحیح یا بیشتر
            </div>
          </div>

          {numOpenInstances > 0 && (
            <Alert variant="warning" className="mt-3">
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <p className="my-0">
                    این ارزیابی دارای {numOpenInstances} نمونه آزمون باز است که ممکن است شامل
                    ارسال‌های انتخاب‌شده برای گروه‌بندی باشد.
                  </p>
                </div>
                <div className="col-12 col-md-6 d-flex flex-column gap-2">
                  <label htmlFor="grouping-application-select" className="my-0">
                    نحوه اعمال گروه‌بندی را انتخاب کنید:
                  </label>
                  <select
                    id="grouping-application-select"
                    className="form-select w-auto flex-shrink-0"
                    value={closedSubmissionsOnly ? 'true' : 'false'}
                    onChange={(e) => setClosedSubmissionsOnly(e.currentTarget.value === 'true')}
                  >
                    <option value="true">فقط ارسال‌های بسته‌شده گروه‌بندی شوند</option>
                    <option value="false">ارسال‌های باز و بسته‌شده هر دو گروه‌بندی شوند</option>
                  </select>
                </div>
              </div>
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <div className="m-0 w-100">
            {mutation.isError && (
              <Alert variant="danger" className="mb-2" dismissible onClose={() => mutation.reset()}>
                <strong>خطا:</strong> {mutation.error.message}
              </Alert>
            )}
            <div className="d-flex align-items-center justify-content-end gap-2 mb-1">
              <Button variant="secondary" disabled={mutation.isPending} onClick={handleClose}>
                انصراف
              </Button>
              <Button variant="primary" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? 'در حال ارسال...' : 'گروه‌بندی ارسال‌ها'}
              </Button>
            </div>
            <small className="text-muted my-0 text-end d-block">
              هوش مصنوعی ممکن است اشتباه کند. پیش از نمره‌دهی، گروه‌ها را بررسی نمایید.
            </small>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
