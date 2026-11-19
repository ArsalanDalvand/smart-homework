import { html } from '@prairielearn/html';

import { IssueBadgeHtml } from '../components/IssueBadge.js';
import type { NavPage, TabInfo } from '../components/Navbar.types.js';

import { encodeSearchString } from './uri-util.shared.js';

export function getNavPageTabs() {
  const navPagesTabs = {
    public_assessment: [
      {
        activeSubPage: 'file_view',
        urlSuffix: ({ assessment }) => `/assessment/${assessment.id}/file_view`,
        iconClasses: 'fa fa-edit',
        tabLabel: 'فایل‌ها',
        renderCondition: ({ assessment }) => assessment.share_source_publicly,
      },
      {
        activeSubPage: 'questions',
        urlSuffix: ({ assessment }) => `/assessment/${assessment.id}/questions`,
        iconClasses: 'far fa-file-alt',
        tabLabel: 'سوالات',
      },
    ],
    public_question: [
      {
        activeSubPage: 'file_view',
        urlSuffix: ({ question }) => `/question/${question.id}/file_view`,
        iconClasses: 'fa fa-edit',
        tabLabel: 'فایل‌ها',
        renderCondition: ({ question }) => question.share_source_publicly,
      },
      {
        activeSubPage: 'preview',
        urlSuffix: ({ question }) => `/question/${question.id}/preview`,
        iconClasses: 'fas fa-tv',
        tabLabel: 'پیش‌نمایش',
      },
    ],
    instance_admin: [
      {
        activeSubPage: 'settings',
        urlSuffix: '/instance_admin/settings',
        iconClasses: 'fas fa-cog',
        tabLabel: 'مشخصات و تنظیمات',
      },

      {
        activeSubPage: 'publishing',
        urlSuffix: '/instance_admin/publishing',
        iconClasses: 'far fa-calendar-alt',
        tabLabel: 'انتشار و زمان‌بندی',
      },
      {
        activeSubPage: 'ai_grading',
        urlSuffix: '/instance_admin/ai_grading',
        iconClasses: 'bi bi-stars',
        tabLabel: 'تصحیح با هوش مصنوعی',
        renderCondition: (resLocals) => resLocals.ai_grading_enabled,
      },
      {
        activeSubPage: 'lti',
        urlSuffix: '/instance_admin/lti',
        iconClasses: 'fas fa-graduation-cap',
        tabLabel: 'اتصال LTI',
        renderCondition: (resLocals) =>
          resLocals.lti11_enabled && resLocals.authz_data.has_course_permission_edit,
      },
      {
        activeSubPage: 'billing',
        urlSuffix: '/instance_admin/billing',
        iconClasses: 'fas fa-credit-card',
        tabLabel: 'امور مالی',
        renderCondition: (resLocals) => resLocals.billing_enabled,
      },
    ],
    students: [
      {
        activeSubPage: ['overview', 'detail'],
        urlSuffix: '/instance_admin/students',
        iconClasses: 'bi bi-people-fill',
        tabLabel: 'فهرست دانشجویان',
      },
      {
        activeSubPage: 'student_labels',
        urlSuffix: '/instance_admin/students/labels',
        iconClasses: 'bi bi-person-badge',
        tabLabel: 'برچسب‌ها و گروه‌ها',
      },
    ],
    course_admin: [
      {
        activeSubPage: 'settings',
        urlSuffix: '/course_admin/settings',
        iconClasses: 'fas fa-cog',
        tabLabel: 'تنظیمات کلی',
      },

      {
        activeSubPage: 'sets',
        urlSuffix: '/course_admin/sets',
        iconClasses: 'fa fa-list',
        tabLabel: 'دسته‌های تکالیف و آزمون‌ها',
      },

      {
        activeSubPage: 'modules',
        urlSuffix: '/course_admin/modules',
        iconClasses: 'fa fa-layer-group',
        tabLabel: 'سرفصل‌ها و ماژول‌ها',
      },

      {
        activeSubPage: 'sharing',
        urlSuffix: '/course_admin/sharing',
        iconClasses: 'fas fa-share-nodes',
        tabLabel: 'اشتراک‌گذاری',
        renderCondition: (resLocals) => resLocals.question_sharing_enabled,
      },

      {
        activeSubPage: 'tags',
        urlSuffix: '/course_admin/tags',
        iconClasses: 'fas fa-hashtag',
        tabLabel: 'برچسب‌ها',
      },

      {
        activeSubPage: 'topics',
        urlSuffix: '/course_admin/topics',
        iconClasses: 'fas fa-quote-right',
        tabLabel: 'مباحث آموزشی',
      },
    ],
    assessment: [
      {
        activeSubPage: 'access',
        urlSuffix: ({ assessment }) => `/assessment/${assessment.id}/access`,
        iconClasses: 'far fa-calendar-alt',
        tabLabel: 'دسترسی و زمان‌بندی',
      },
      {
        activeSubPage: 'downloads',
        urlSuffix: ({ assessment }) => `/assessment/${assessment.id}/downloads`,
        iconClasses: 'fas fa-download',
        tabLabel: 'دانلود داده‌ها و نمرات',
        renderCondition: ({ authz_data }) => authz_data.has_course_instance_permission_view,
      },
      {
        activeSubPage: ['file_view', 'file_edit'],
        urlSuffix: ({ assessment }) => `/assessment/${assessment.id}/file_view`,
        iconClasses: 'fa fa-edit',
        tabLabel: 'فایل‌ها و کدهای تمرین',
        renderCondition: ({ authz_data }) => authz_data.has_course_permission_view,
      },
      {
        activeSubPage: 'groups',
        urlSuffix: ({ assessment }) => `/assessment/${assessment.id}/groups`,
        iconClasses: 'fas fa-users',
        tabLabel: 'گروه‌های دانشجویی',
      },
      {
        activeSubPage: 'manual_grading',
        urlSuffix: ({ assessment }) => `/assessment/${assessment.id}/manual_grading`,
        iconClasses: 'fas fa-marker',
        tabLabel: ({ ai_grading_enabled }) =>
          ai_grading_enabled ? 'تصحیح دستی و هوش مصنوعی' : 'تصحیح دستی و بارم‌بندی',
        renderCondition: ({ authz_data }) => authz_data.has_course_instance_permission_view,
      },
      {
        activeSubPage: 'questions',
        urlSuffix: ({ assessment }) => `/assessment/${assessment.id}/questions`,
        iconClasses: 'far fa-file-alt',
        tabLabel: 'بانک سوالات',
      },
      {
        activeSubPage: 'settings',
        urlSuffix: ({ assessment }) => `/assessment/${assessment.id}/settings`,
        iconClasses: 'fas fa-cog',
        tabLabel: 'تنظیمات آزمون/تکلیف',
      },
      {
        activeSubPage: 'statistics',
        urlSuffix: ({ assessment }) => `/assessment/${assessment.id}/statistics`,
        iconClasses: 'fas fa-chart-bar',
        tabLabel: 'آمار و تحلیل پاسخ‌ها',
      },
      {
        activeSubPage: ['instances', 'assessment_instance'],
        urlSuffix: ({ assessment }) => `/assessment/${assessment.id}/instances`,
        iconClasses: 'fas fa-user-graduate',
        tabLabel: 'دانشجویان و نتایج',
        renderCondition: ({ authz_data }) => authz_data.has_course_instance_permission_view,
      },
    ],
    question: [
      {
        activeSubPage: ['file_view', 'file_edit'],
        urlSuffix: ({ question }) => `/question/${question.id}/file_view`,
        iconClasses: 'fa fa-edit',
        tabLabel: 'فایل‌ها و تست‌ها',
        renderCondition: ({ authz_data, course, question }) =>
          authz_data.has_course_permission_view && question.course_id === course.id,
      },
      {
        activeSubPage: 'preview',
        urlSuffix: ({ question }) => `/question/${question.id}/preview`,
        iconClasses: 'fas fa-tv',
        tabLabel: 'پیش‌نمایش سوال',
      },
      {
        activeSubPage: 'settings',
        urlSuffix: ({ question }) => `/question/${question.id}/settings`,
        iconClasses: 'fas fa-cog',
        tabLabel: 'تنظیمات سوال',
        renderCondition: ({ course, question }) => question.course_id === course.id,
      },
      {
        activeSubPage: 'statistics',
        urlSuffix: ({ question }) => `/question/${question.id}/statistics`,
        iconClasses: 'fas fa-chart-bar',
        tabLabel: 'آمار و ارقام',
      },
      {
        activeSubPage: 'issues',
        urlSuffix: ({ question }) =>
          `/course_admin/issues?q=${encodeSearchString({ is: 'open', qid: question.qid })}`,
        iconClasses: 'fas fa-bug',
        tabLabel: 'گزارش اشکالات',
        htmlSuffix: (resLocals) =>
          IssueBadgeHtml({
            count: resLocals.open_issue_count,
            suppressLink: true,
            className: 'ms-2',
          }),
        renderCondition: ({ course, question }) => question.course_id === course.id,
      },
    ],
    admin: [
      {
        activeSubPage: 'administrators',
        urlSuffix: '/administrator/admins',
        iconClasses: 'fas fa-user-shield',
        tabLabel: 'مدیران سامانه',
      },
      {
        activeSubPage: 'institutions',
        urlSuffix: '/administrator/institutions',
        iconClasses: 'fa fa-building-columns',
        tabLabel: 'دانشکده‌ها و موسسات',
      },
      {
        activeSubPage: 'courses',
        urlSuffix: '/administrator/courses',
        iconClasses: 'fa fa-chalkboard',
        tabLabel: 'درس‌ها و دوره‌ها',
      },
      {
        activeSubPage: 'courseRequests',
        urlSuffix: '/administrator/courseRequests',
        iconClasses: 'fa fa-inbox',
        tabLabel: 'درخواست‌های درس',
        htmlSuffix: ({ pendingCourseRequestCount }) => {
          if (!pendingCourseRequestCount) return '';
          return html`<span class="badge rounded-pill text-bg-primary ms-2"
            >${pendingCourseRequestCount}</span
          >`;
        },
      },
      {
        activeSubPage: 'queries',
        urlSuffix: '/administrator/queries',
        iconClasses: 'fas fa-database',
        tabLabel: 'گزارش‌ها و کوئری‌ها',
      },
      {
        activeSubPage: 'workspaces',
        urlSuffix: '/administrator/workspaces',
        iconClasses: 'fas fa-laptop-code',
        tabLabel: 'محیط‌های کاری ابری',
      },
      {
        activeSubPage: 'features',
        urlSuffix: '/administrator/features',
        iconClasses: 'fas fa-toggle-on',
        tabLabel: 'قابلیت‌ها و فلگ‌ها',
      },
      {
        activeSubPage: 'batchedMigrations',
        urlSuffix: '/administrator/batchedMigrations',
        iconClasses: 'fas fa-database',
        tabLabel: 'مهاجرت‌های داده‌ای',
      },
      {
        activeSubPage: 'settings',
        urlSuffix: '/administrator/settings',
        iconClasses: 'fas fa-cog',
        tabLabel: 'تنظیمات سرور و کش',
      },
    ],
    administrator_institution: [
      {
        activeSubPage: 'general',
        urlSuffix: '',
        iconClasses: 'fa fa-gear',
        tabLabel: 'عمومی',
      },
      {
        activeSubPage: 'admins',
        urlSuffix: '/admins',
        iconClasses: 'fa fa-user-shield',
        tabLabel: 'مدیران دانشکده',
      },
      {
        activeSubPage: 'courses',
        urlSuffix: '/courses',
        iconClasses: 'fa fa-chalkboard',
        tabLabel: 'درس‌های دانشکده',
      },
      {
        activeSubPage: 'sso',
        urlSuffix: '/sso',
        iconClasses: 'fa fa-users',
        tabLabel: 'ورود یکپارچه (SSO)',
      },
      {
        activeSubPage: 'saml',
        urlSuffix: '/saml',
        iconClasses: 'fa fa-key',
        tabLabel: 'احراز هویت SAML',
      },
      {
        activeSubPage: 'lti13',
        urlSuffix: '/lti13',
        iconClasses: 'fa fa-school-flag',
        tabLabel: 'یکپارچگی LTI 1.3',
      },
    ],
    institution_admin: [
      {
        activeSubPage: 'general',
        urlSuffix: '',
        iconClasses: 'fa fa-gear',
        tabLabel: 'عمومی',
      },
      {
        activeSubPage: 'admins',
        urlSuffix: '/admins',
        iconClasses: 'fa fa-user-shield',
        tabLabel: 'مدیران دانشکده',
      },
      {
        activeSubPage: 'courses',
        urlSuffix: '/courses',
        iconClasses: 'fa fa-chalkboard',
        tabLabel: 'درس‌های دانشکده',
      },
    ],
  } satisfies Partial<Record<Exclude<NavPage, undefined>, TabInfo[]>>;

  return navPagesTabs;
}
