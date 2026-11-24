import { z } from 'zod';

import { formatDateISO } from '@prairielearn/formatter';
import { html } from '@prairielearn/html';

import { PageLayout } from '../../components/PageLayout.js';
import {
  CourseInstancePermissionSchema,
  CoursePermissionSchema,
  UserSchema,
} from '../../lib/db-types.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';

export const CourseRolesSchema = z.object({
  available_course_roles: CoursePermissionSchema.shape.course_role.unwrap().array(),
  available_course_instance_roles: CourseInstancePermissionSchema.shape.course_instance_role
    .unwrap()
    .array(),
  available_uids: UserSchema.shape.uid.array().nullable(),
});
type CourseRoles = z.infer<typeof CourseRolesSchema>;

export function InstructorEffectiveUser({
  resLocals,
  ipAddress,
  courseRoles,
}: {
  resLocals: ResLocalsForPage<'course' | 'course-instance'>;
  ipAddress: string | undefined;
  courseRoles: CourseRoles;
}) {
  const {
    authz_data,
    course_instance,
    course,
    __csrf_token,
    req_date,
    true_req_date,
    user,
    navbarType,
  } = resLocals;

  // This page can be mounted under `/pl/course/...`, in which case we won't
  // have a course instance to get a display timezone from. In that case, we'll
  // fall back to the course, which is guaranteed to have a display timezone.
  const displayTimezone = course_instance?.display_timezone ?? course.display_timezone;

  const formattedTrueReqDate = formatDateISO(true_req_date, displayTimezone);
  const formattedReqDate = formatDateISO(req_date, displayTimezone);

  return PageLayout({
    pageTitle: 'تغییر کاربر موثر (نمای آزمایشی)',
    resLocals,
    navContext: {
      type: navbarType,
      page: 'effective',
    },
    options: {
      fullWidth: true,
    },
    content: html`
      <h1 class="visually-hidden">کاربر موثر</h1>
      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h2>کاربر احراز هویت‌شده</h2>
        </div>

        <div class="card-body">
          <p><strong>شناسه کاربری اصلی (UID):</strong> ${authz_data.authn_user.uid}</p>
          <p><strong>نام اصلی:</strong> ${authz_data.authn_user.name}</p>
          <p><strong>نقش اصلی در درس:</strong> ${authz_data.authn_course_role}</p>
          ${
            'authn_course_instance_role' in authz_data
              ? html`
                  <p>
                    <strong>نقش اصلی در دوره:</strong>
                    ${authz_data.authn_course_instance_role}
                  </p>
                `
              : ''
          }
          <p><strong>حالت احراز هویت:</strong> ${authz_data.authn_mode}</p>
          <p><strong>زمان اصلی:</strong> ${formattedTrueReqDate}</p>

          <form id="resetForm" method="POST">
            <p>
              <input type="hidden" name="__action" value="reset" />
              <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
              <button type="submit" class="btn btn-info">بازنشانی به مقادیر اصلی</button>
            </p>
          </form>

          <p><strong>آدرس IP اتصال:</strong> ${ipAddress ?? html`<em>نامشخص</em>`}</p>
        </div>

        <div class="card-footer">
          <small>
            The <em>authenticated</em> values above are the ones that you logged in with. The
            <em>effective</em> values below allow you to view PrairieLearn as if you had a different
            <em>course role</em> or as if you were a specific other person with a different
            <em>UID</em>. This can be used to test out how PrairieLearn will look from different
            points of view. The “بازنشانی به مقادیر اصلی” button above will reset all effective values
            below to your authenticated values. Effective values are also reset when you choose a
            course instance or when you switch to a different course.
          </small>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h2>کاربر موثر</h2>
        </div>

        <div class="card-body">
          <p><strong>شناسه کاربری موثر (UID):</strong> ${user.uid}</p>
          <p><strong>نام موثر:</strong> ${user.name}</p>

          <div class="alert alert-secondary mb-0">
            <form id="changeUidForm" method="POST">
              <div class="mb-3">
                <label class="form-label" for="changeEffectiveUid">تغییر شناسه کاربری موثر به:</label>
                <input
                  list="userList"
                  type="text"
                  class="form-control me-2 w-100"
                  style="max-width: 20em;"
                  name="pl_requested_uid"
                  id="changeEffectiveUid"
                  placeholder="username@example.com"
                />
                <datalist id="userList">
                  ${courseRoles.available_uids?.map(
                    (available_uid) => html`
                      <option value="${available_uid}">${available_uid}</option>
                    `,
                  )}
                </datalist>
              </div>
              <input type="hidden" name="__action" value="changeUid" />
              <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
              <button type="submit" class="btn btn-primary">تغییر شناسه کاربری</button>
            </form>
          </div>
        </div>

        <div class="card-footer">
          <small>
            Changing your effective user identity to another person allows you to see PrairieLearn
            exactly as they would see it. You cannot emulate an effective user with a higher access
            level than your own.
          </small>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h2>نقش موثر در درس</h2>
        </div>

        <div class="card-body">
          <p><strong>نقش موثر در درس:</strong> ${authz_data.course_role}</p>

          <div class="alert alert-secondary mb-0">
            <form id="changeCourseRoleForm" method="POST">
              <div class="mb-3">
                <label class="form-label" for="changeEffectiveCourseRole">
                  تغییر نقش موثر در درس به:
                </label>
                <select
                  class="form-select me-2"
                  id="changeEffectiveCourseRole"
                  name="pl_requested_course_role"
                >
                  ${[...courseRoles.available_course_roles]
                    .reverse()
                    .map((available_course_role) =>
                      available_course_role === authz_data.course_role
                        ? html`
                            <option value="${available_course_role}" selected>
                              ${available_course_role} (فعلی)
                            </option>
                          `
                        : html`
                            <option value="${available_course_role}">
                              ${available_course_role}
                            </option>
                          `,
                    )}
                </select>
              </div>
              <input type="hidden" name="__action" value="changeCourseRole" />
              <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
              <button type="submit" class="btn btn-primary">تغییر نقش در درس</button>
            </form>
          </div>
        </div>

        <div class="card-footer">
          <small>
            Your <em>course role</em> determines the permissions that you have to view and edit
            course content in PrairieLearn. It is specific to this course, so you can be an Editor
            in one course but a Previewer in a different course.
          </small>
        </div>
      </div>

      ${
        'course_instance_role' in authz_data
          ? html`
              <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                  <h2>نقش موثر در دوره</h2>
                </div>

                <div class="card-body">
                  <p>
                    <strong>نقش موثر در دوره:</strong>
                    ${authz_data.course_instance_role}
                  </p>

                  <div class="alert alert-secondary mb-0">
                    <form id="changeCourseInstanceRoleForm" method="POST">
                      <div class="mb-3">
                        <label class="form-label" for="changeEffectiveCourseInstanceRole">
                          تغییر نقش موثر در دوره به:
                        </label>
                        <select
                          class="form-select me-2"
                          id="changeEffectiveCourseInstanceRole"
                          name="pl_requested_course_instance_role"
                        >
                          ${[...courseRoles.available_course_instance_roles]
                            .reverse()
                            .map((available_course_instance_role) =>
                              available_course_instance_role === authz_data.course_instance_role
                                ? html`
                                    <option value="${available_course_instance_role}" selected>
                                      ${available_course_instance_role} (فعلی)
                                    </option>
                                  `
                                : html`
                                    <option value="${available_course_instance_role}">
                                      ${available_course_instance_role}
                                    </option>
                                  `,
                            )}
                        </select>
                      </div>
                      <input type="hidden" name="__action" value="changeCourseInstanceRole" />
                      <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
                      <button type="submit" class="btn btn-primary">
                        تغییر نقش در دوره
                      </button>
                    </form>
                  </div>
                </div>

                <div class="card-footer">
                  <small>
                    Your <em>course instance role</em> determines the permissions that you have to
                    view and edit student data in PrairieLearn. It is specific to this course
                    instance, so you can be a Student Data Editor in one course instance but a
                    Student Data Viewer in a different course instance.
                  </small>
                </div>
              </div>
            `
          : ''
      }

      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h2>تاریخ و زمان موثر</h2>
        </div>

        <div class="card-body">
          <p><strong>تاریخ موثر:</strong> ${formattedReqDate}</p>

          <div class="alert alert-secondary mb-0">
            <form id="changeDateForm" method="POST">
              <div class="mb-3">
                <label class="form-label" for="changeDate">تغییر تاریخ موثر به:</label>
                <input
                  type="text"
                  class="form-control me-2 w-100"
                  style="max-width: 30em;"
                  id="changeDate"
                  name="pl_requested_date"
                  value="${formattedReqDate}"
                />
              </div>
              <input type="hidden" name="__action" value="changeDate" />
              <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
              <button type="submit" class="btn btn-primary">تغییر تاریخ</button>
            </form>
          </div>
        </div>

        <div class="card-footer">
          <small>
            The <em>date</em> of the server determines which assessments are available. Changing the
            effective date to something other than the current date allows you to check if homework
            and exam assessments will be available to students when you mean them to be. The date
            has the format <code>YYYY-MM-DDTHH:MM:SS</code>, with a suffix that gives the offset
            from UTC (i.e., the time zone) in the format <code>&plusmn;HH:MM</code>.
          </small>
        </div>
      </div>
    `,
  });
}
