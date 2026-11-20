import { QueryClient, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert, QueryClientProviderDebug } from '@prairielearn/trpc/react';

import {
  GITHUB_USERNAME_MAX_LENGTH,
  GITHUB_USERNAME_VALIDATION_MESSAGE,
  isValidGithubUsername,
} from '../../lib/github-utils.js';
import { createCourseTrpcClient } from '../../trpc/course/client.js';
import { TRPCProvider, useTRPC } from '../../trpc/course/context.js';
import type { GithubAccessError } from '../../trpc/course/github-access.js';

interface GithubRepositoryAccessProps {
  courseId: string;
  repositoryUrl: string | null;
  isSupportedRepository: boolean;
  isOwner: boolean;
  staffUrl: string;
  trpcCsrfToken: string;
}

export function GithubRepositoryAccess(props: GithubRepositoryAccessProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    createCourseTrpcClient({ courseId: props.courseId, csrfToken: props.trpcCsrfToken }),
  );
  return (
    <QueryClientProviderDebug client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <GithubRepositoryAccessInner {...props} />
      </TRPCProvider>
    </QueryClientProviderDebug>
  );
}

GithubRepositoryAccess.displayName = 'GithubRepositoryAccess';

function GithubRepositoryAccessInner({
  repositoryUrl,
  isSupportedRepository,
  isOwner,
  staffUrl,
}: GithubRepositoryAccessProps) {
  const trpc = useTRPC();
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState<{ username: string; invited: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { username: '' } });
  const grantMutation = useMutation({
    ...trpc.githubAccess.grant.mutationOptions(),
    onSuccess: (result) => {
      setSuccess(result);
      setShowModal(false);
    },
  });
  const grantError = getAppError<GithubAccessError['Grant']>(grantMutation.error);

  return (
    <section className="mb-3" aria-labelledby="github-access-heading">
      <h2 className="h6 fw-bold" id="github-access-heading">
        دسترسی به مخزن گیت‌هاب (GitHub Repository)
      </h2>
      {repositoryUrl && (
        <p className="mb-2">
          آدرس مخزن این درس در گیت‌هاب:{' '}
          <a href={repositoryUrl} target="_blank" rel="noreferrer" dir="ltr" className="font-monospace">
            {repositoryUrl}
          </a>
        </p>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success.invited ? (
            <>
              دعوت‌نامه دسترسی مدیر (Admin) برای <strong>{success.username}</strong> ارسال شد.{' '}
              <a href={`${repositoryUrl}/invitations`} target="_blank" rel="noreferrer">
                پذیرش دعوت‌نامه در گیت‌هاب
              </a>{' '}
              جهت فعال‌سازی دسترسی الزامی است.
            </>
          ) : (
            <>
              کاربر <strong>{success.username}</strong> اکنون دسترسی مدیر به این مخزن را داراست.
            </>
          )}
        </Alert>
      )}
      {!isSupportedRepository ? (
        <p className="mb-0 text-muted">
          جهت اتصال به مخازن خارج از سازمان گیت‌هاب، لطفاً با مدیر سامانه تماس حاصل فرمایید.
        </p>
      ) : isOwner ? (
        <>
          <p className="mb-2">
            در صورتی که به مخزن گیت‌هاب این درس دسترسی ندارید، به عنوان مالک درس می‌توانید به خود یا همکاران دسترسی اعطا فرمایید:
          </p>
          <Button
            type="button"
            variant="outline-primary"
            className="mb-3"
            onClick={() => {
              reset();
              grantMutation.reset();
              setSuccess(null);
              setShowModal(true);
            }}
          >
            <i className="bi bi-person-plus me-1" /> اعطای دسترسی به خودم در گیت‌هاب
          </Button>
          <p className="mb-0 small text-muted">
            پس از دریافت دسترسی، می‌توانید{' '}
            <a href={`${repositoryUrl}/settings/access`} target="_blank" rel="noreferrer">
              سایر همکاران و اساتید را نیز در گیت‌هاب اضافه نمایید
            </a>
            .
          </p>
        </>
      ) : (
        <p className="mb-0 text-muted">
          در صورت عدم دسترسی به مخزن گیت‌هاب، از مالکان درس (<a href={staffUrl}>مشاهده لیست کادر آموزشی</a>) درخواست دسترسی نمایید.
        </p>
      )}
      <Modal
        show={showModal}
        aria-labelledby="grant-github-access-title"
        onHide={() => {
          if (!grantMutation.isPending) setShowModal(false);
        }}
      >
        <Modal.Header closeButton={!grantMutation.isPending}>
          <Modal.Title id="grant-github-access-title">اعطای دسترسی به مخزن گیت‌هاب</Modal.Title>
        </Modal.Header>
        <Form
          noValidate
          onSubmit={(event) => {
            // The modal is portaled out of the course settings form, but React events still bubble to it.
            event.stopPropagation();
            void handleSubmit(({ username }) =>
              grantMutation.mutate({ username: username.trim() }),
            )(event);
          }}
        >
          <Modal.Body>
            <p>
              نام کاربری گیت‌هاب خود را وارد نمایید تا دسترسی <strong>مدیر (Admin)</strong> به این مخزن برای شما ثبت شود.
            </p>
            <p className="small text-muted">
              در صورتی که حساب گیت‌هاب ندارید، ابتدا یک{' '}
              <a href="https://github.com/signup" target="_blank" rel="noreferrer">
                حساب کاربری در GitHub ایجاد کنید
              </a>
              . نام کاربری شما در پروفایل گیت‌هاب قابل مشاهده است.
            </p>
            <Form.Group controlId="github-username">
              <Form.Label>نام کاربری گیت‌هاب (GitHub Username)</Form.Label>
              <Form.Control
                type="text"
                autoComplete="off"
                spellCheck={false}
                dir="ltr"
                maxLength={GITHUB_USERNAME_MAX_LENGTH}
                defaultValue=""
                {...register('username', {
                  validate: (value) =>
                    isValidGithubUsername(value.trim()) || GITHUB_USERNAME_VALIDATION_MESSAGE,
                })}
                isInvalid={!!errors.username}
                aria-invalid={!!errors.username}
                aria-errormessage={errors.username ? 'github-username-error' : undefined}
                aria-describedby="github-username-help"
                disabled={grantMutation.isPending}
              />
              <Form.Text id="github-username-help">
                تنها نام کاربری گیت‌هاب را بدون @ یا آدرس اینترنتی وارد فرمایید.
              </Form.Text>
              <Form.Control.Feedback type="invalid" id="github-username-error">
                {errors.username?.message}
              </Form.Control.Feedback>
            </Form.Group>
            <div className="mt-3">
              <AppErrorAlert error={grantError} render={{ UNKNOWN: ({ message }) => message }} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="secondary"
              disabled={grantMutation.isPending}
              onClick={() => setShowModal(false)}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={grantMutation.isPending}>
              {grantMutation.isPending ? 'در حال ثبت دسترسی…' : 'تخصیص دسترسی'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </section>
  );
}
