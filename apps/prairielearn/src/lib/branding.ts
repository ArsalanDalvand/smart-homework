/**
 * Centralized Branding and Localization Configuration
 * 
 * Allows full customization of platform identity, logos, titles,
 * and support links across the entire platform via environment variables
 * or per-institution settings without any hardcoded strings.
 * 
 * Safe for execution in both Node.js (SSR) and Browser (Hydrated React) environments.
 */

const env: Record<string, string | undefined> =
  typeof process !== 'undefined' && process && process.env ? process.env : {};

export interface InstitutionBrandContext {
  id?: string | number | null;
  short_name?: string | null;
  long_name?: string | null;
}

export const platformBranding = {
  // Brand Names & Slogans
  brandName: env.PL_BRAND_NAME || 'سامانه جامع ارزیابی و یادگیری هوشمند',
  brandShortName: env.PL_BRAND_SHORT_NAME || 'سامانه یادگیری هوشمند',
  brandTitle: env.PL_BRAND_TITLE || 'سامانه جامع یادگیری، آموزش و آزمون‌های هوشمند',
  brandSubtitle:
    env.PL_BRAND_SUBTITLE ||
    'پلتفرم جامع سنجش مهارتی، آزمون‌های برخط و تصحیح خودکار',
  logoUrl: env.PL_LOGO_URL || '',

  // Contact & Links
  portalName: env.PL_PORTAL_NAME || 'پرتال و پایگاه اطلاع‌رسانی',
  portalUrl: env.PL_PORTAL_URL || 'https://github.com/ArsalanDalvand/PrairieLearn',
  repoUrl: env.PL_REPO_URL || 'https://github.com/ArsalanDalvand/PrairieLearn',
  supportEmail: env.PL_SUPPORT_EMAIL || 'support@prairielearn.ir',
  docsUrl: env.PL_DOCS_URL || 'https://docs.prairielearn.com',

  // Copyright & Meta
  copyrightYear: env.PL_COPYRIGHT_YEAR || '۱۴۰۵',
  copyrightText: env.PL_COPYRIGHT_TEXT || 'تمامی حقوق محفوظ است',
  defaultLocale: 'fa',
  direction: 'rtl',
  fontFamily: 'var(--font-persian)',
};

/**
 * Returns the effective brand name for the given institutional context.
 * If viewing within a specific institution/organization, its official name is returned;
 * otherwise, the general platform brand is used.
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
    institution: 'موسسه / مرکز آموزشی',
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
    staffView: 'نمای کادر آموزشی و مدرسان',
    customStaffView: 'نمای سفارشی‌شده کادر آموزشی',
    studentView: 'نمای فراگیر / دانشجو',
    studentNoRulesView: 'نمای فراگیر (بدون محدودیت دسترسی)',
    resetStaffView: 'بازنشانی به نمای پیش‌فرض مدرس',
    effectiveUser: 'کاربر مجازی (تست دسترسی‌ها)',
    changeUid: 'تغییر کاربر',
    customizeOverrides: 'تنظیمات پیشرفته هویت و نقش…',
    adminAccessToggleOn: 'فعال‌سازی دسترسی مدیر',
    adminAccessToggleOff: 'غیرفعال‌سازی دسترسی مدیر',
    requestCourse: 'درخواست ایجاد درس یا دوره',
    examModeNotice: 'حالت آزمون فعال است. دسترسی‌های شما به آزمون جاری محدود می‌باشد.',
  },
  home: {
    devModeTitle: 'حالت توسعه و مدیریت محتوا',
    devModeNotice:
      'سامانه هم‌اکنون در حالت توسعه (Dev Mode) اجرا شده است. با تغییر فایل‌های پیکربندی و سوالات درس در پوشه کدها، جهت اعمال سریع تغییرات بر روی دکمه «همگام‌سازی دیسک» در نوار بالا کلیک کنید.',
    devModeHint:
      'تغییرات کدهای سرور، فایل‌های فرانت‌اند و فایل‌های استاتیک، با رفرش صفحه به‌صورت آنی بارگذاری می‌شوند.',
    adminInstitutionsTitle: 'موسسات و سازمان‌های تحت مدیریت',
    instructorCoursesTitle: 'درس‌ها و دوره‌های تحت مدیریت (مدرس / دستیار)',
    studentCoursesTitle: 'درس‌ها و دوره‌های من (دسترسی فراگیر)',
    studentCoursesTitleSimple: 'درس‌های من',
    githubRepoBtn: 'مخزن گیت‌هاب',
    joinCourseBtn: 'عضویت در درس',
    noStudentCoursesWithInstructor:
      'در حال حاضر دوره‌ای با نقش فراگیر برای شما ثبت نشده است. دوره‌های تحت مدیریت شما در جدول بالا قرار دارند.',
    joinCourseHint: 'جهت عضویت در دوره‌های دیگر با نقش فراگیر، بر روی دکمه «عضویت در درس» کلیک نمایید.',
    noCoursesDevMode:
      'هیچ دوره‌ای بارگذاری نشده است. بر روی دکمه «همگام‌سازی دیسک» در نوار بالا کلیک کنید.',
    noCoursesGeneral: 'دوره‌ای یافت نشد. جهت افزودن دوره، بر روی دکمه «عضویت در درس» کلیک کنید.',
    invitationBadge: 'دعوت‌نامه',
    acceptInvitation: 'پذیرش',
    rejectInvitation: 'رد دعوت',
    removeCourse: 'حذف',
    pastTerms: 'دوره‌های گذشته',
    rejectModalTitle: 'رد دعوت‌نامه دوره',
    rejectModalDesc:
      'آیا از رد کردن این دعوت‌نامه اطمینان دارید؟ در صورتی که دوره ثبت‌نام خودکار نداشته باشد، برای عضویت مجدد باید توسط مدرس دعوت شوید.',
    rejectModalConfirm: 'رد دعوت‌نامه',
    removeModalTitle: 'حذف دوره از داشبورد',
    removeModalDesc: 'آیا از حذف این دوره از فهرست دوره‌های خود اطمینان دارید؟',
    removeModalNotice:
      'حذف دوره از این بخش صرفاً نمایش آن در داشبورد سامانه را پنهان می‌کند و تأثیری بر سوابق آموزشی یا ثبت‌نام شما نخواهد داشت.',
    removeModalReappear: 'ممکن است پس از به‌روزرسانی اطلاعات ثبت‌نامی موسسه، این دوره مجدداً ظاهر شود.',
    removeModalConfirm: 'حذف از داشبورد',
    enrollmentCodeHelp: 'جهت عضویت در دوره، کد ثبت‌نامی که توسط مدرس یا برگزارکننده ارائه شده است را وارد نمایید.',
  },
  auth: {
    loginTitle: 'ورود به سامانه',
    loginSubtitle: 'جهت دسترسی به دوره‌ها، آزمون‌ها و محتوای آموزشی',
    loginWithGoogle: 'ورود با حساب گوگل',
    loginWithMicrosoft: 'ورود با حساب مایکروسافت',
    loginWithSso: 'ورود یکپارچه سازمانی (SSO)',
    devLoginTitle: 'ورود سریع در محیط توسعه (Dev Mode)',
    uidLabel: 'شناسه کاربری (UID / ایمیل):',
    nameLabel: 'نام و نام خانوادگی:',
    uidPlaceholder: 'user@example.com یا نام کاربری',
    namePlaceholder: 'علی محمدی',
    devLoginBtn: 'ورود به سامانه',
  },
  emptyState: {
    studentTitle: 'فراگیران و دانشجویان',
    studentDesc: 'عضویت در دوره‌ها و درس‌های آموزشی، شرکت در آزمون‌های برخط و حل تمرین‌ها.',
    instructorTitle: 'مدرسان، اساتید و طراحان دوره',
    instructorDesc: 'طراحی و بارگذاری بانک سوالات، برگزاری آزمون‌های هوشمند، تصحیح خودکار و مدیریت فراگیران.',
  },
  enrollment: {
    modalTitle: 'عضویت در درس یا دوره',
    noCodeHelp:
      'کد ثبت‌نام ندارید؟ ممکن است مدرس دوره لینک مستقیم عضویت را در اختیار شما قرار داده یا از طریق سامانه مدیریت یادگیری اقدام نموده باشد.',
    instructorHelp:
      'مدرسان و طراحان محترم: کد ثبت‌نام و لینک مستقیم عضویت در صفحه تنظیمات هر دوره در دسترس است.',
    joinBtn: 'عضویت در دوره',
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
    adminsTitle: 'مدیران سامانه',
    addAdminBtn: 'افزودن مدیر جدید',
    addAdminTitle: 'افزودن مدیر جدید سامانه',
    adminsDesc:
      'مدیران سامانه دسترسی کامل به تمامی بخش‌ها، درس‌ها، سوالات و دوره‌ها دارند و می‌توانند مدیران دیگر را اضافه یا حذف نمایند.',
    coursesTitle: 'مدیریت درس‌ها و دوره‌ها',
    addCourseBtn: 'افزودن درس جدید',
    coursesDesc:
      'هنگام همگام‌سازی درس، در صورتی که مسیر فایل‌ها بر روی دیسک سرور موجود نباشد، دستور git clone از مخزن اجرا می‌شود، در غیر این صورت دستور git pull اعمال می‌گردد. همچنین کد و عنوان درس از روی فایل تنظیمات JSON در مخزن به‌روزرسانی می‌شوند.',
    institutionsTitle: 'موسسات و سازمان‌های همکار',
    addInstitutionBtn: 'افزودن موسسه / مرکز جدید',
    requestsTitle: 'درخواست‌های ایجاد درس جدید',
    workspacesTitle: 'سرورها و میزبان‌های محیط کاری (Workspaces)',
    featuresTitle: 'قابلیت‌ها و فلگ‌های سیستمی',
    settingsTitle: 'تنظیمات سرور و کش سامانه',
  },
  courseRequest: {
    title: 'درخواست ایجاد درس یا دوره آموزشی جدید',
    infoDesc:
      'این فرم برای مدرسان، اساتید و طراحان آموزشی جهت راه‌اندازی و تعریف درس یا دوره جدید در سامانه ارزیابی هوشمند است. فراگیران و دانشجویان گرامی نباید این فرم را پر کنند و جهت شرکت در آزمون‌ها یا حل تمرین، باید از طریق کد دوره که توسط مدرس ارائه می‌شود عضو شوند.',
    aboutYou: 'اطلاعات متقاضی (مدرس / طراح)',
    aboutCourse: 'مشخصات درس یا دوره پیشنهادی',
    aboutRequest: 'اطلاعات تکمیلی درخواست',
    shortName: 'کد یا نام اختصاری دوره (مانند CS 101 یا MATH 101)',
    shortNameDesc: 'ساختار استاندارد: حروف بزرگ لاتین به همراه فاصله و شماره دوره.',
    courseTitle: 'عنوان کامل و رسمی درس / دوره',
    courseTitleDesc: 'عنوان کامل دوره یا درس آموزشی.',
    githubUser: 'نام کاربری گیت‌هاب (اختیاری جهت همگام‌سازی سوالات)',
    githubUserDesc:
      'در صورت ارائه نام کاربری گیت‌هاب، دسترسی به مخزن سوالات و کدهای درس برای شما فعال خواهد شد تا بتوانید در سیستم شخصی خود نیز سوالات را طراحی و همگام‌سازی نمایید.',
    referralSource: 'نحوه آشنایی با سامانه ارزیابی هوشمند',
    roleLabel: 'نقش شما در این دوره',
    roleInstructor: 'مدرس / استاد رسمی دوره (Instructor)',
    roleTa: 'دستیار آموزشی یا همکار تدریس (TA)',
    roleAdmin: 'مدیر آموزش یا کارشناس مرکز',
    roleStudent: 'دانشجو / فراگیر',
    submitBtn: 'ثبت نهایی درخواست دوره',
  },
  userSettings: {
    title: 'تنظیمات حساب کاربری',
    profileTitle: 'مشخصات و هویت کاربر',
    uin: 'شماره پرسنلی / دانشجویی (UIN)',
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
