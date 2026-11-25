import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { z } from 'zod';

import { getStudentEnrollmentUrl } from '../../../lib/client/url.js';
import {
  AssessmentInstanceScoreResultSchema,
  type OtherGroupUser,
} from '../instructorGradebook.types.js';

interface EditScoreButtonProps {
  assessmentInstanceId: string;
  courseInstanceId: string;
  currentScore: number;
  otherUsers: OtherGroupUser[];
  csrfToken: string;
}

export function EditScoreButton({
  assessmentInstanceId,
  courseInstanceId,
  currentScore,
  otherUsers,
  csrfToken,
}: EditScoreButtonProps) {
  const queryClient = useQueryClient();
  const [show, setShow] = useState(false);
  const [scoreInput, setScoreInput] = useState(currentScore.toString());

  const editScoreMutation = useMutation({
    mutationKey: ['edit-score', assessmentInstanceId],
    mutationFn: async (scorePerc: string) => {
      const body = new URLSearchParams({
        __action: 'edit_total_score_perc',
        __csrf_token: csrfToken,
        assessment_instance_id: assessmentInstanceId,
        score_perc: scorePerc,
      });

      const res = await fetch(window.location.href, {
        method: 'POST',
        body,
      });

      if (!res.ok) {
        throw new Error('به‌روزرسانی نمره ناموفق بود');
      }

      const data = await res.json();
      return z.array(AssessmentInstanceScoreResultSchema).parse(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['gradebook'] });
      setShow(false);
    },
  });

  const handleOpen = () => {
    setScoreInput(currentScore.toString());
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
  };

  const resetModalState = () => {
    editScoreMutation.reset();
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-xs btn-ghost edit-score ms-1"
        aria-label="ویرایش نمره"
        onClick={handleOpen}
      >
        <i className="bi-pencil-square" aria-hidden="true" />
      </button>
      {show && (
        <Modal show={true} onHide={handleClose} onExited={resetModalState}>
          <Modal.Header closeButton>
            <Modal.Title>تغییر درصد نمره کل</Modal.Title>
          </Modal.Header>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              editScoreMutation.mutate(scoreInput);
            }}
          >
            <Modal.Body>
              <Form.Group className="mb-3">
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={scoreInput}
                    aria-label="درصد نمره"
                    disabled={editScoreMutation.isPending}
                    onChange={(e) => setScoreInput(e.currentTarget.value)}
                  />
                  <InputGroup.Text>%</InputGroup.Text>
                </InputGroup>
              </Form.Group>

              {otherUsers.length > 0 && (
                <Alert variant="info">
                  <small>
                    این یک آزمون گروهی است. به‌روزرسانی این نمره، نمره افراد زیر را نیز تغییر می‌دهد:
                  </small>
                  <ul className="mb-0">
                    {otherUsers.map(({ uid, enrollment_id }) => (
                      <li key={uid}>
                        <small>
                          {enrollment_id ? (
                            <a href={getStudentEnrollmentUrl(courseInstanceId, enrollment_id)}>
                              {uid}
                            </a>
                          ) : (
                            uid
                          )}
                        </small>
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

              <p className="text-muted">
                <small>
                  اگر دانشجو به سوالات بیشتری پاسخ دهد، این تغییر بازنویسی خواهد شد.
                </small>
              </p>

              {editScoreMutation.isError && (
                <Alert
                  variant="danger"
                  className="mb-2"
                  dismissible
                  onClose={() => editScoreMutation.reset()}
                >
                  {editScoreMutation.error.message}
                </Alert>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                disabled={editScoreMutation.isPending}
                onClick={handleClose}
              >
                انصراف
              </Button>
              <Button type="submit" variant="primary" disabled={editScoreMutation.isPending}>
                {editScoreMutation.isPending ? 'در حال ذخیره...' : 'تغییر'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </>
  );
}
