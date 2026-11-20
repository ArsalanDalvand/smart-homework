import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import { Accordion, Alert, Button, Form, Modal, Table } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert } from '@prairielearn/trpc/react';
import { assertNever } from '@prairielearn/utils';

import { useTRPC } from '../../trpc/course/context.js';
import type { CourseStaffError } from '../../trpc/course/course-staff.js';
import type { CourseRouter } from '../../trpc/course/trpc.js';

type PreviewRow = inferRouterOutputs<CourseRouter>['courseStaff']['preview']['rows'][number];
type ChangedRow = PreviewRow & { action: 'add' | 'update' | 'remove' };

function StaffChanges({ row }: { row: ChangedRow }) {
  const action = row.action;
  switch (action) {
    case 'remove':
      return <>حذف از کادر آموزشی و لغو تمامی دسترسی‌ها</>;
    case 'add':
    case 'update':
      return (
        <ul className="mb-0 ps-3">
          {(row.action === 'add' || row.previousCourseRole !== row.courseRole) && (
            <li>
              محتوای درس: {row.previousCourseRole ?? 'بدون دسترسی'} ← {row.courseRole}
            </li>
          )}
          {row.courseInstanceChanges.map((change) => (
            <li key={change.courseInstanceId}>
              دوره {change.shortName}: {change.previousRole} ← {change.role}
            </li>
          ))}
        </ul>
      );
    default:
      return assertNever(action);
  }
}

export function StaffCsvImportModal({ onHide }: { onHide: () => void }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ file: FileList }>();
  const preview = useMutation(trpc.courseStaff.preview.mutationOptions());
  const sync = useMutation({
    ...trpc.courseStaff.sync.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries(trpc.courseStaff.list.queryFilter()),
  });
  const pending = preview.isPending || sync.isPending;
  const changedRows =
    preview.data?.rows.filter((row): row is ChangedRow => row.action !== 'unchanged') ?? [];
  const uidByUserId = new Map(
    (preview.data?.rows ?? []).flatMap((row) =>
      row.expected ? [[row.expected.userId, row.uid] as const] : [],
    ),
  );
  const unchangedRows = preview.data?.rows.filter((row) => row.action === 'unchanged') ?? [];

  const submit = handleSubmit(async ({ file }) => {
    setFileError(null);
    preview.reset();
    sync.reset();
    let csv: string;
    try {
      csv = await file[0].text();
    } catch {
      setFileError('خواندن این فایل امکان‌پذیر نبود. لطفا مجددا فایل را انتخاب فرمایید.');
      return;
    }
    if (csv.trim().length === 0) {
      setFileError('فایل CSV خالی است. فایلی حاوی سربرگ و مشخصات کادر آموزشی انتخاب فرمایید.');
      return;
    }
    setText(csv);
    preview.mutate({ text: csv });
  });

  return (
    <Modal
      aria-labelledby="staff-csv-import-title"
      size="lg"
      backdrop={pending ? 'static' : true}
      show
      onHide={pending ? () => {} : onHide}
      dir="rtl"
    >
      <Modal.Header closeButton={!pending} style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Title id="staff-csv-import-title">ورود دسته‌جمعی کادر آموزشی از CSV</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: 'var(--font-persian)' }}>
        {sync.isSuccess ? (
          <Alert variant="success" className="mb-0">
            همگام‌سازی کادر آموزشی با موفقیت انجام شد: {sync.data.add} کاربر افزوده شد، {sync.data.update} بروزرسانی شد،{' '}
            {sync.data.remove} حذف شد و {sync.data.unchanged} بدون تغییر ماند.
          </Alert>
        ) : (
          <>
            {!preview.data && (
              <>
                <p>
                  فایل CSV فعلی را از دکمه خروجی دریافت نموده، تغییرات لازم را در آن ویرایش کرده و در این بخش بارگذاری کنید.
                  کاربران یا دوره‌هایی که در فایل نباشند دست نخورده باقی می‌مانند. از عبارت None برای سلب دسترسی استفاده نمایید.
                  برای حذف کامل یک کاربر از کادر آموزشی، فیلدهای بعد از شناسه کاربری (UID) را خالی بگذارید.
                </p>
                <Form id="staff-csv-import" onSubmit={submit}>
                  <Form.Group controlId="staff-csv-file">
                    <Form.Label>انتخاب فایل CSV کادر آموزشی</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".csv,text/csv"
                      disabled={pending}
                      aria-invalid={!!errors.file || !!fileError}
                      aria-errormessage={
                        errors.file || fileError ? 'staff-csv-file-error' : undefined
                      }
                      {...register('file', {
                        required: 'لطفا یک فایل CSV انتخاب فرمایید.',
                        validate: (files) =>
                          files.length === 0
                            ? 'لطفا یک فایل CSV انتخاب فرمایید.'
                            : files[0].size === 0
                              ? 'فایل CSV خالی است. فایلی حاوی اطلاعات معتبر انتخاب فرمایید.'
                              : files[0].size <= 1024 * 1024 || 'حجم فایل CSV حداکثر می‌تواند ۱ مگابایت باشد.',
                        onChange: () => {
                          preview.reset();
                          sync.reset();
                          setFileError(null);
                        },
                      })}
                    />
                    {(errors.file || fileError) && (
                      <Alert id="staff-csv-file-error" variant="danger" className="mt-2 mb-0">
                        {errors.file?.message ?? fileError}
                      </Alert>
                    )}
                  </Form.Group>
                </Form>
              </>
            )}
            <AppErrorAlert
              className="mt-2 mb-0"
              error={getAppError<CourseStaffError['Preview']>(preview.error)}
              render={{ UNKNOWN: ({ message }) => message }}
            />
            <AppErrorAlert
              className="mt-2 mb-0"
              error={getAppError<CourseStaffError['Sync']>(sync.error)}
              render={{ UNKNOWN: ({ message }) => message }}
            />
            {preview.data && (
              <div className="mt-3">
                <h2 className="h5">پیش‌نمایش تغییرات</h2>
                <p>
                  {preview.data.summary.add} افزوده می‌شود، {preview.data.summary.update} بروزرسانی می‌شود،{' '}
                  {preview.data.summary.remove} حذف می‌شود و {preview.data.summary.unchanged} بدون تغییر باقی می‌ماند.
                </p>
                {preview.data.removalEnrollments.length > 0 && (
                  <Alert variant="warning">
                    حذف این افراد از کادر آموزشی باعث لغو ثبت‌نام‌های زیر نیز می‌گردد:
                    <ul className="mb-0">
                      {preview.data.removalEnrollments.map((enrollment) => (
                        <li key={enrollment.enrollmentId}>
                          {uidByUserId.get(enrollment.userId!)}
                          {' — '}
                          {enrollment.shortName} ({enrollment.status})
                          {enrollment.instanceDeleted && ' — دوره حذف‌شده'}
                        </li>
                      ))}
                    </ul>
                  </Alert>
                )}
                <Accordion defaultActiveKey={['changed']} alwaysOpen>
                  <Accordion.Item eventKey="changed">
                    <Accordion.Header>کاربران دارای تغییر ({changedRows.length})</Accordion.Header>
                    <Accordion.Body>
                      {changedRows.length === 0 ? (
                        <p>هیچ تغییری در دسترسی‌های کادر آموزشی اعمال نخواهد شد.</p>
                      ) : (
                        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                          <Table size="sm" responsive>
                            <thead>
                              <tr>
                                <th scope="col">شناسه کاربری (UID)</th>
                                <th scope="col">نوع عملیات</th>
                                <th scope="col">شرح تغییرات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {changedRows.map((row) => (
                                <tr key={row.uid}>
                                  <td dir="ltr" className="text-end">{row.uid}</td>
                                  <td>
                                    {
                                      {
                                        add: 'افزودن',
                                        update: 'بروزرسانی',
                                        remove: 'حذف',
                                      }[row.action]
                                    }
                                  </td>
                                  <td>
                                    <StaffChanges row={row} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                  {unchangedRows.length > 0 && (
                    <Accordion.Item eventKey="unchanged">
                      <Accordion.Header>
                        کاربران بدون تغییر ({unchangedRows.length})
                      </Accordion.Header>
                      <Accordion.Body>
                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          <Table size="sm" className="mb-0" responsive>
                            <thead>
                              <tr>
                                <th scope="col">شناسه کاربری (UID)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {unchangedRows.map((row) => (
                                <tr key={row.uid}>
                                  <td dir="ltr" className="text-end">{row.uid}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  )}
                </Accordion>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer style={{ fontFamily: 'var(--font-persian)' }}>
        <Button variant="secondary" disabled={pending} onClick={onHide}>
          {sync.isSuccess ? 'بستن' : 'انصراف'}
        </Button>
        {!sync.isSuccess && (
          <>
            {!preview.data ? (
              <Button type="submit" form="staff-csv-import" disabled={pending} variant="primary">
                {preview.isPending ? 'در حال پردازش پیش‌نمایش…' : 'پیش‌نمایش تغییرات'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  preview.reset();
                  sync.reset();
                  reset();
                  setText('');
                  setFileError(null);
                }}
              >
                انتخاب فایل دیگر
              </Button>
            )}
            {preview.data && (
              <Button
                variant={preview.data.summary.remove > 0 ? 'danger' : 'primary'}
                disabled={pending || sync.isError}
                onClick={() =>
                  sync.mutate({ text, confirmationToken: preview.data.confirmationToken })
                }
              >
                {sync.isPending ? 'در حال همگام‌سازی…' : 'تایید و اعمال همگام‌سازی'}
              </Button>
            )}
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}
