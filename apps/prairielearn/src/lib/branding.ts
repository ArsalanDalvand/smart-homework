/**
 * Centralized Branding and Localization Configuration
 * 
 * Allows full customization of university identity, logos, titles,
 * and support links across the entire platform via environment variables
 * or per-institution settings without any hardcoded strings.
 */

export interface InstitutionBrandContext {
  id?: string | number | null;
  short_name?: string | null;
  long_name?: string | null;
}

export const platformBranding = {
  // Brand Names & Slogans
  brandName: process.env.PL_BRAND_NAME || 'سامانه جامع ارزیابی و یادگیری هوشمند دانشگاهی',
  brandShortName: process.env.PL_BRAND_SHORT_NAME || 'سامانه یادگیری هوشمند',
  brandTitle: process.env.PL_BRAND_TITLE || 'سامانه جامع یادگیری، آموزش و آزمون‌های هوشمند',
  brandSubtitle:
    process.env.PL_BRAND_SUBTITLE ||
    'پلتفرم یکپارچه سنجش تحصیلی، آزمون‌های آنلاین و تصحیح خودکار ویژه دانشگاه‌ها و اساتید',
  logoUrl: process.env.PL_LOGO_URL || '/images/iust-logo.svg',

  // Contact & Links
  portalName: process.env.PL_PORTAL_NAME || 'پرتال دانشگاهی و سامانه‌های آموزش',
  portalUrl: process.env.PL_PORTAL_URL || 'https://www.iust.ac.ir',
  repoUrl: process.env.PL_REPO_URL || 'https://github.com/ArsalanDalvand/PrairieLearn',
  supportEmail: process.env.PL_SUPPORT_EMAIL || 'support@prairielearn.ir',
  docsUrl: process.env.PL_DOCS_URL || 'https://docs.prairielearn.com',

  // Copyright & Meta
  copyrightYear: process.env.PL_COPYRIGHT_YEAR || '۱۴۰۵',
  copyrightText: process.env.PL_COPYRIGHT_TEXT || 'تمامی حقوق محفوظ است',
  defaultLocale: 'fa',
  direction: 'rtl',
  fontFamily: 'var(--font-persian)',
};

/**
 * Returns the effective brand name for the given institutional context.
 * If viewing within a specific institution (e.g., IUST, University of Tehran),
 * its official name is returned; otherwise, the general platform brand is used.
 */
export function getEffectiveBrandName(institution?: InstitutionBrandContext | null): string {
  if (institution?.long_name && institution.short_name !== 'Default') {
    return institution.long_name;
  }
  return platformBranding.brandName;
}

/**
 * Returns the effective page title suffix.
 */
export function getEffectiveTitleSuffix(institution?: InstitutionBrandContext | null): string {
  if (institution?.long_name && institution.short_name !== 'Default') {
    return `${institution.long_name} — ${platformBranding.brandShortName}`;
  }
  return platformBranding.brandName;
}

/**
 * UI Message Catalog (i18n)
 * Centralizes all user-facing strings across navigation, dashboard, forms, and admin.
 */
export const uiStrings = {
  common: {
    home: 'صفحه اصلی',
    admin: 'مدیریت سامانه',
    help: 'راهنمایی و پشتیبانی',
    syncDisk: 'همگام‌سازی دیسک',
    settings: 'تنظیمات',
    logout: 'خروج از حساب',
    save: 'ذخیره',
    saveSettings: 'ذخیره تنظیمات',
    cancel: 'انصراف',
    delete: 'حذف',
    remove: 'حذف',
    approve: 'تایید',
    deny: 'رد درخواست',
    edit: 'ویرایش',
    close: 'بستن',
    details: 'جزئیات',
    actions: 'عملیات',
    status: 'وضعیت',
    name: 'نام و نام خانوادگی',
    uid: 'شناسه کاربری (UID)',
    email: 'آدرس ایمیل',
    institution: 'دانشکده / موسسه',
    timezone: 'منطقه زمانی',
    created: 'تاریخ ایجاد',
    updated: 'تاریخ به‌روزرسانی',
    pending: 'در انتظار بررسی',
    approved: 'تایید شده',
    rejected: 'رد شده',
    yes: 'بله',
    no: 'خیر',
    unknown: 'نامشخص',
    copy: 'کپی',
    copied: 'کپی شد',
  },
  nav: {
    brandAria: 'صفحه اصلی سامانه',
    switchRole: 'حالت نمایش',
    viewAs: 'مشاهده به‌عنوان',
    staffView: 'نمای کادر آموزشی',
    customStaffView: 'نمای سفارشی‌شده کادر آموزشی',
    studentView: 'نمای دانشجو',
    studentNoRulesView: 'نمای دانشجو (بدون محدودیت دسترسی)',
    resetStaffView: 'بازنشانی به نمای پیش‌فرض استاد',
    effectiveUser: 'کاربر مجازی (تست دسترسی‌ها)',
    changeUid: 'تغییر کاربر',
    customizeOverrides: 'تنظیمات پیشرفته هویت و نقش…',
    adminAccessToggleOn: 'فعال‌سازی دسترسی مدیر',
    adminAccessToggleOff: 'غیرفعال‌سازی دسترسی مدیر',
    requestCourse: 'درخواست ایجاد درس جدید',
    examModeNotice: 'حالت آزمون فعال است. دسترسی‌های شما به آزمون جاری محدود می‌باشد.',
  },
  home: {
    devModeTitle: 'حالت توسعه و مدیریت محتوا',
    devModeNotice:
      'سامانه هم‌اکنون در حالت توسعه (Dev Mode) اجرا شده است. با تغییر فایل‌های پیکربندی و سوالات درس در پوشه کدها، جهت اعمال سریع تغییرات بر روی دکمه «همگام‌سازی دیسک» در نوار بالا کلیک کنید.',
    devModeHint:
      'تغییرات کدهای سرور، فایل‌های فرانت‌اند و فایل‌های استاتیک، با رفرش صفحه به‌صورت آنی بارگذاری می‌شوند.',
    adminInstitutionsTitle: 'دانشکده‌ها و موسسات تحت مدیریت',
    instructorCoursesTitle: 'درس‌های تحت مدیریت (استاد / دستیار آموزشی)',
    studentCoursesTitle: 'درس‌های من (دسترسی دانشجو)',
    studentCoursesTitleSimple: 'درس‌های من',
    githubRepoBtn: 'مخزن گیت‌هاب',
    joinCourseBtn: 'عضویت در درس',
    noStudentCoursesWithInstructor:
      'در حال حاضر درسی با نقش دانشجو برای شما ثبت نشده است. درس‌های تحت مدیریت آموزشی شما در جدول بالا قرار دارند.',
    joinCourseHint: 'جهت عضویت در درس‌های دیگر با نقش دانشجو، بر روی دکمه «عضویت در درس» کلیک نمایید.',
    noCoursesDevMode:
      'هیچ درسی بارگذاری نشده است. بر روی دکمه «همگام‌سازی دیسک» در نوار بالا کلیک کنید.',
    noCoursesGeneral: 'درسی یافت نشد. جهت افزودن درس، بر روی دکمه «عضویت در درس» کلیک کنید.',
    invitationBadge: 'دعوت‌نامه',
    acceptInvitation: 'پذیرش',
    rejectInvitation: 'رد دعوت',
    removeCourse: 'حذف',
    pastTerms: 'ترم‌های گذشته',
    rejectModalTitle: 'رد دعوت‌نامه درس',
    rejectModalDesc:
      'آیا از رد کردن این دعوت‌نامه اطمینان دارید؟ در صورتی که درس ثبت‌نام خودکار نداشته باشد، برای عضویت مجدد باید توسط استاد دعوت شوید.',
    rejectModalConfirm: 'رد دعوت‌نامه',
    removeModalTitle: 'حذف درس از داشبورد',
    removeModalDesc: 'آیا از حذف این درس از فهرست درس‌های خود اطمینان دارید؟',
    removeModalNotice:
      'حذف درس از این بخش صرفاً نمایش آن در داشبورد سامانه را پنهان می‌کند و تأثیری بر انتخاب واحد رسمی دانشگاهی شما نخواهد داشت.',
    removeModalReappear: 'ممکن است پس از به‌روزرسانی اطلاعات ثبت‌نامی دانشکده، این درس مجدداً ظاهر شود.',
    removeModalConfirm: 'حذف از داشبورد',
    enrollmentCodeHelp: 'جهت عضویت در درس، کد ثبت‌نامی که توسط استاد درس ارائه شده است را وارد نمایید.',
  },
  auth: {
    loginTitle: 'ورود به سامانه',
    loginSubtitle: 'جهت دسترسی به آزمون‌ها و دوره‌های آموزشی',
    loginWithGoogle: 'ورود با حساب گوگل',
    loginWithMicrosoft: 'ورود با حساب مایکروسافت',
    loginWithSso: 'ورود یکپارچه دانشگاهی (SSO)',
    devLoginTitle: 'ورود آزمایشی و توسعه (Dev Mode)',
    uidLabel: 'شناسه کاربری (UID):',
    nameLabel: 'نام و نام خانوادگی:',
    uidPlaceholder: 'student@university.ac.ir یا شناسه کاربری',
    namePlaceholder: 'علی محمدی',
    devLoginBtn: 'ورود مستقیم به سامانه',
  },
  emptyState: {
    studentTitle: 'دانشجویان',
    studentDesc: 'عضویت در درس‌ها و دوره‌های آموزشی، شرکت در آزمون‌های برخط و حل تمرین‌ها.',
    instructorTitle: 'اساتید و کادر آموزشی',
    instructorDesc: 'طراحی و بارگذاری بانک سوالات، برگزاری آزمون‌های هوشمند، تصحیح خودکار و مدیریت نمرات دانشجویان.',
  },
  enrollment: {
    modalTitle: 'عضویت در درس',
    noCodeHelp:
      'کد ثبت‌نام ندارید؟ ممکن است استاد درس لینک مستقیم عضویت را در اختیار شما قرار داده یا از طریق سامانه مدیریت یادگیری اقدام نموده باشد.',
    instructorHelp:
      'اساتید محترم: کد ثبت‌نام و لینک مستقیم عضویت دانشجویان در صفحه تنظیمات هر دوره در دسترس است.',
    joinBtn: 'عضویت در درس',
    lookingUpBtn: 'در حال بررسی کد…',
  },
  exam: {
    endExamBtn: 'پایان آزمون',
    endExamTitle: 'پایان و ثبت نهایی آزمون',
    endExamConfirm:
      'آیا از پایان دادن به آزمون خود اطمینان دارید؟ لطفاً فقط در صورتی که تمام پاسخ‌های خود را بررسی و ذخیره کرده‌اید این گزینه را تایید فرمایید. با این کار، مرورگر آزمون بسته خواهد شد.',
    endExamLoading: 'در حال ثبت و بستن آزمون…',
    endExamErrorTitle: 'خطا در پایان دادن به آزمون.',
    endExamErrorDesc:
      'لطفاً مجدداً تلاش نمایید یا از مراقب آزمون خود بخواهید تا جلسه آزمون شما را به پایان برساند.',
    endExamFinalBtn: 'پایان قطعی آزمون',
    reportCheatingBtn: 'گزارش تخلف در آزمون',
    reportCheatingTitle: 'ثبت گزارش تخلف در جلسه آزمون',
    reportCheatingDesc:
      'در صورتی که نقض قوانین آزمون (مانند استفاده از تلفن همراه، برگه تقلب یا سایر موارد غیرمجاز) را مشاهده کرده‌اید، جزئیات آن را در کادر زیر بنویسید. این گزارش کاملاً محرمانه بوده و تنها برای کادر آموزشی و مراقبان آزمون ارسال خواهد شد.',
    reportCheatingLabel: 'شرح تخلف مشاهده شده:',
    reportCheatingSubmit: 'ارسال گزارش محرمانه',
    reportCheatingLoading: 'در حال ارسال گزارش…',
  },
  admin: {
    adminsTitle: 'مدیران کل سامانه دانشگاه',
    addAdminBtn: 'افزودن مدیر جدید',
    addAdminTitle: 'افزودن مدیر جدید سامانه',
    adminsDesc:
      'مدیران سامانه دسترسی کامل به تمامی دانشکده‌ها، درس‌ها، سوالات و دوره‌ها دارند و می‌توانند مدیران دیگر را اضافه یا حذف نمایند.',
    coursesTitle: 'مدیریت درس‌ها و دوره‌ها',
    addCourseBtn: 'افزودن درس جدید',
    coursesDesc:
      'هنگام همگام‌سازی درس، در صورتی که مسیر فایل‌ها بر روی دیسک سرور موجود نباشد، دستور git clone از مخزن اجرا می‌شود، در غیر این صورت دستور git pull اعمال می‌گردد. همچنین کد و عنوان درس از روی فایل تنظیمات JSON در مخزن به‌روزرسانی می‌شوند.',
    institutionsTitle: 'دانشکده‌ها و موسسات دانشگاه',
    addInstitutionBtn: 'افزودن دانشکده جدید',
    requestsTitle: 'درخواست‌های ایجاد درس جدید',
    workspacesTitle: 'سرورها و میزبان‌های محیط کاری (Workspaces)',
    featuresTitle: 'قابلیت‌ها و فلگ‌های سیستمی',
    settingsTitle: 'تنظیمات سرور و کش سامانه',
  },
  courseRequest: {
    title: 'درخواست ایجاد درس جدید در سامانه دانشگاه',
    infoDesc:
      'این فرم برای اساتید و طراحان آموزشی دانشکده‌های مختلف جهت راه‌اندازی و تعریف درس جدید در سامانه ارزیابی هوشمند است. دانشجویان گرامی نباید این فرم را پر کنند و جهت شرکت در آزمون‌ها یا حل تمرین، باید از طریق کد درس که توسط استاد ارائه می‌شود عضو شوند.',
    aboutYou: 'اطلاعات متقاضی (استاد / طراح)',
    aboutCourse: 'مشخصات درس پیشنهادی',
    aboutRequest: 'اطلاعات تکمیلی درخواست',
    shortName: 'کد یا نام اختصاری درس (Course Rubric and Number)',
    shortNameDesc: 'ساختار استاندارد: حروف بزرگ لاتین به همراه فاصله و شماره درس (مانند MATH 101 یا CE 240).',
    courseTitle: 'عنوان کامل و رسمی درس',
    courseTitleDesc: 'عنوان رسمی درس طبق چارت مصوب دانشگاه.',
    githubUser: 'نام کاربری گیت‌هاب (اختیاری جهت همگام‌سازی سوالات)',
    githubUserDesc:
      'در صورت ارائه نام کاربری گیت‌هاب، دسترسی به مخزن سوالات و کدهای درس برای شما فعال خواهد شد تا بتوانید در سیستم شخصی خود نیز سوالات را طراحی و همگام‌سازی نمایید.',
    referralSource: 'نحوه آشنایی با سامانه ارزیابی هوشمند',
    roleLabel: 'نقش شما در این درس',
    roleInstructor: 'استاد رسمی درس (Official Course Instructor)',
    roleTa: 'دستیار آموزشی یا سرپرست حل تمرین (TA)',
    roleAdmin: 'مدیر آموزش یا کارشناس دانشکده',
    roleStudent: 'دانشجو',
    submitBtn: 'ثبت نهایی درخواست درس',
  },
  userSettings: {
    title: 'تنظیمات حساب کاربری',
    profileTitle: 'مشخصات و هویت کاربر',
    uin: 'شماره دانشجویی / پرسنلی (UIN)',
    authMethod: 'روش احراز هویت',
    ipAddress: 'آدرس IP جاری',
    tokensTitle: 'توکن‌های دسترسی شخصی (API Tokens)',
    generateTokenBtn: 'ایجاد توکن جدید',
    shortcutsTitle: 'ترجیحات کاربری و کلیدهای میانبر',
    enableShortcuts: 'فعال‌سازی کلیدهای میانبر تک‌کلیدی',
    shortcutsDesc: 'امکان استفاده از میانبرهای کیبورد برای جابجایی سریع میان سوالات و ثبت نمرات تصحیح دستی.',
    browserConfigTitle: 'تنظیمات فرمول‌نویسی و رندر مرورگر',
    resetMathJaxBtn: 'بازنشانی تنظیمات فرمول‌های ریاضی (MathJax)',
  },
};
