import { useState } from 'react';

import type { Student } from '../../lib/canvas-matching.js';

import { CanvasDownloadModal } from './components/CanvasDownloadModal.js';

export interface Filenames {
  scoresCsvFilename: string;
  scoresAllCsvFilename: string;
  pointsCsvFilename: string;
  pointsAllCsvFilename: string;
  scoresByUsernameCsvFilename: string;
  scoresByUsernameAllCsvFilename: string;
  pointsByUsernameCsvFilename: string;
  pointsByUsernameAllCsvFilename: string;
  instancesCsvFilename: string;
  instancesAllCsvFilename: string;
  instanceQuestionsCsvFilename: string;
  submissionsForManualGradingCsvFilename: string;
  finalSubmissionsCsvFilename: string;
  bestSubmissionsCsvFilename: string;
  allSubmissionsCsvFilename: string;
  filesForManualGradingZipFilename: string;
  finalFilesZipFilename: string;
  bestFilesZipFilename: string;
  allFilesZipFilename: string;
  canvasScoresCsvFilename: string;
  canvasPointsCsvFilename: string;
  groupsCsvFilename?: string;
  scoresGroupCsvFilename?: string;
  scoresGroupAllCsvFilename?: string;
  pointsGroupCsvFilename?: string;
  pointsGroupAllCsvFilename?: string;
}

function DownloadRow({
  downloadUrl,
  filename,
  description,
}: {
  downloadUrl: string;
  filename: string;
  description: React.ReactNode;
}) {
  return (
    <tr>
      <td>
        <a href={downloadUrl}>{filename}</a>
      </td>
      <td>{description}</td>
    </tr>
  );
}

function CanvasDownloadRow({
  filename,
  description,
  onClick,
}: {
  filename: string;
  description: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <tr>
      <td>
        <button type="button" className="btn btn-link p-0 text-start" onClick={onClick}>
          {filename}
        </button>
      </td>
      <td>{description}</td>
    </tr>
  );
}

export function InstructorAssessmentDownloads({
  urlPrefix,
  assessmentId,
  assessmentSetName,
  assessmentNumber,
  isMultipleInstance,
  isTeamWork,
  filenames,
  students,
}: {
  urlPrefix: string;
  assessmentId: string;
  assessmentSetName: string;
  assessmentNumber: string;
  isMultipleInstance: boolean;
  isTeamWork: boolean;
  filenames: Filenames;
  students: Student[];
}) {
  const identityFa = isTeamWork ? 'گروه' : 'دانشجو';
  const identityPluralFa = isTeamWork ? 'گروه‌ها' : 'دانشجویان';
  const downloadsBase = `${urlPrefix}/assessment/${assessmentId}/downloads/`;

  const [canvasModal, setCanvasModal] = useState<{
    filename: string;
    downloadUrl: string;
  } | null>(null);

  return (
    <>
      <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
        <div className="card-header bg-primary text-white">
          <h1 className="h4 mb-0">
            {assessmentSetName} {assessmentNumber}: دریافت داده‌ها و خروجی‌ها
          </h1>
        </div>
        {isMultipleInstance && (
          <div className="card-body">
            <p>
              <small>
                این آزمون دارای <strong>چندین نمونه شرکت در آزمون (Multiple Instance)</strong> است و هر {identityFa} ممکن است چند بار در آزمون شرکت کرده باشد. فایل‌های CSV در دو قالب ساده و <strong><code>_all</code></strong> در دسترس هستند. نسخه ساده شامل بهترین نتیجه هر {identityFa} و نسخه <code>_all</code> شامل تمامی دفعات شرکت در آزمون می‌باشد.
              </small>
            </p>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-sm table-hover" aria-label="فایل‌های خروجی آزمون">
            <thead>
              <tr>
                <th>نام فایل داده‌ها</th>
                <th>شرح و محتوا</th>
              </tr>
            </thead>
            <tbody>
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.scoresCsvFilename}`}
                filename={filenames.scoresCsvFilename}
                description="درصد نمره کل برای هر دانشجو. نمرات از ۰ تا ۱۰۰ (یا بالاتر در صورت اعطای نمره تشویقی) متغیر است."
              />
              {isMultipleInstance && (
                <DownloadRow
                  downloadUrl={`${downloadsBase}${filenames.scoresAllCsvFilename}`}
                  filename={filenames.scoresAllCsvFilename}
                  description="درصد نمره کل برای هر بار شرکت در آزمون. نمرات از ۰ تا ۱۰۰ (یا بالاتر در صورت اعطای نمره تشویقی) متغیر است."
                />
              )}
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.pointsCsvFilename}`}
                filename={filenames.pointsCsvFilename}
                description="مجموع امتیاز برای هر دانشجو. امتیازها از ۰ تا سقف امتیاز این ارزیابی متغیر است."
              />
              {isMultipleInstance && (
                <DownloadRow
                  downloadUrl={`${downloadsBase}${filenames.pointsAllCsvFilename}`}
                  filename={filenames.pointsAllCsvFilename}
                  description="مجموع امتیاز برای هر بار شرکت در آزمون. امتیازها از ۰ تا سقف امتیاز این ارزیابی متغیر است."
                />
              )}
              {isTeamWork && (
                <>
                  <DownloadRow
                    downloadUrl={`${downloadsBase}${filenames.groupsCsvFilename}`}
                    filename={filenames.groupsCsvFilename!}
                    description="اطلاعات گروه‌های فعلی شامل نام گروه‌ها و اعضای هر گروه"
                  />
                  <DownloadRow
                    downloadUrl={`${downloadsBase}${filenames.scoresGroupCsvFilename}`}
                    filename={filenames.scoresGroupCsvFilename!}
                    description="درصد نمره کل برای هر گروه. نمرات از ۰ تا ۱۰۰ (یا بالاتر در صورت اعطای نمره تشویقی) متغیر است."
                  />
                  {isMultipleInstance && (
                    <DownloadRow
                      downloadUrl={`${downloadsBase}${filenames.scoresGroupAllCsvFilename}`}
                      filename={filenames.scoresGroupAllCsvFilename!}
                      description="درصد نمره کل برای هر بار شرکت در آزمون. نمرات از ۰ تا ۱۰۰ (یا بالاتر در صورت اعطای نمره تشویقی) متغیر است."
                    />
                  )}
                  <DownloadRow
                    downloadUrl={`${downloadsBase}${filenames.pointsGroupCsvFilename}`}
                    filename={filenames.pointsGroupCsvFilename!}
                    description="مجموع امتیاز برای هر گروه. امتیازها از ۰ تا سقف امتیاز این ارزیابی متغیر است."
                  />
                  {isMultipleInstance && (
                    <DownloadRow
                      downloadUrl={`${downloadsBase}${filenames.pointsGroupAllCsvFilename}`}
                      filename={filenames.pointsGroupAllCsvFilename!}
                      description="مجموع امتیاز برای هر بار شرکت در آزمون. امتیازها از ۰ تا سقف امتیاز این ارزیابی متغیر است."
                    />
                  )}
                </>
              )}
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.scoresByUsernameCsvFilename}`}
                filename={filenames.scoresByUsernameCsvFilename}
                description="درصد نمره کل برای هر دانشجو با قالب نام کاربری برای بارگذاری در دفترچه نمرات سامانه آموزش (LMS). نمرات از ۰ تا ۱۰۰ (یا بالاتر در صورت اعطای نمره تشویقی) متغیر است."
              />
              {isMultipleInstance && (
                <DownloadRow
                  downloadUrl={`${downloadsBase}${filenames.scoresByUsernameAllCsvFilename}`}
                  filename={filenames.scoresByUsernameAllCsvFilename}
                  description="درصد نمره کل برای هر بار شرکت در آزمون با قالب نام کاربری برای بارگذاری در دفترچه نمرات سامانه آموزش (LMS). نمرات از ۰ تا ۱۰۰ (یا بالاتر در صورت اعطای نمره تشویقی) متغیر است."
                />
              )}
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.pointsByUsernameCsvFilename}`}
                filename={filenames.pointsByUsernameCsvFilename}
                description="مجموع امتیاز برای هر دانشجو با قالب نام کاربری برای بارگذاری در دفترچه نمرات سامانه آموزش (LMS). امتیازها از ۰ تا سقف امتیاز این ارزیابی متغیر است."
              />
              {isMultipleInstance && (
                <DownloadRow
                  downloadUrl={`${downloadsBase}${filenames.pointsByUsernameAllCsvFilename}`}
                  filename={filenames.pointsByUsernameAllCsvFilename}
                  description="مجموع امتیاز برای هر بار شرکت در آزمون با قالب نام کاربری برای بارگذاری در دفترچه نمرات سامانه آموزش (LMS). امتیازها از ۰ تا سقف امتیاز این ارزیابی متغیر است."
                />
              )}
              <CanvasDownloadRow
                filename={filenames.canvasScoresCsvFilename}
                description="درصد نمرات برای هر دانشجو، قالب‌بندی‌شده برای درون‌ریزی در Canvas. نمرات از ۰ تا ۱۰۰ (یا بالاتر در صورت اعطای نمره تشویقی) متغیر است."
                onClick={() =>
                  setCanvasModal({
                    filename: filenames.canvasScoresCsvFilename,
                    downloadUrl: `${downloadsBase}${filenames.canvasScoresCsvFilename}`,
                  })
                }
              />
              <CanvasDownloadRow
                filename={filenames.canvasPointsCsvFilename}
                description="مجموع امتیاز هر دانشجو، قالب‌بندی‌شده برای درون‌ریزی در Canvas. امتیازها از ۰ تا سقف امتیاز این ارزیابی (یا بالاتر در صورت اعطای نمره تشویقی) متغیر است."
                onClick={() =>
                  setCanvasModal({
                    filename: filenames.canvasPointsCsvFilename,
                    downloadUrl: `${downloadsBase}${filenames.canvasPointsCsvFilename}`,
                  })
                }
              />
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.instancesCsvFilename}`}
                filename={filenames.instancesCsvFilename}
                description={`داده‌های تفصیلی برای هر ${identityFa}. شامل امتیاز کسب‌شده، حداکثر امتیاز، درصد نمره، مدت زمان و سایر اطلاعات.`}
              />
              {isMultipleInstance && (
                <DownloadRow
                  downloadUrl={`${downloadsBase}${filenames.instancesAllCsvFilename}`}
                  filename={filenames.instancesAllCsvFilename}
                  description="داده‌های تفصیلی برای هر بار شرکت در آزمون. شامل امتیاز کسب‌شده، حداکثر امتیاز، درصد نمره، مدت زمان و سایر اطلاعات."
                />
              )}
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.instanceQuestionsCsvFilename}`}
                filename={filenames.instanceQuestionsCsvFilename}
                description={`تمام سوالات برای همه ${identityPluralFa} در تمام دفعات شرکت در آزمون. نمره هر سوال و همچنین بهترین نمره ارسالی و تعداد تلاش‌ها برای آن سوال را نمایش می‌دهد.`}
              />
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.submissionsForManualGradingCsvFilename}`}
                filename={filenames.submissionsForManualGradingCsvFilename}
                description={
                  <>
                    پاسخ‌های ارسال‌شده برای همه {identityPluralFa} و تمام سوالات، قالب‌بندی‌شده برای
                    نمره‌دهی دستی آفلاین و بارگذاری مجدد (بخش «بارگذاری» را ببینید). برای هر{' '}
                    {identityFa} و هر سوال، تنها آخرین ارسال از آخرین بار شرکت در آزمون گنجانده
                    می‌شود. فایل‌ها از پاسخ ارسال‌شده در CSV حذف شده و در قالب{' '}
                    <code>{filenames.filesForManualGradingZipFilename}</code> در دسترس هستند.
                  </>
                }
              />
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.filesForManualGradingZipFilename}`}
                filename={filenames.filesForManualGradingZipFilename}
                description={
                  <>
                    فایل‌های ارسال‌شده برای همه {identityPluralFa} و تمام سوالات، نام‌گذاری‌شده برای
                    استفاده آسان در نمره‌دهی دستی آفلاین. این فایل‌ها با ارسال‌های موجود در{' '}
                    <code>{filenames.submissionsForManualGradingCsvFilename}</code> مطابقت دارند.
                    برای هر {identityFa} و هر سوال، تنها آخرین فایل ارسال‌شده از آخرین بار شرکت در
                    آزمون گنجانده می‌شود. قالب نام فایل به صورت زیر است:{' '}
                    <code>
                      {isTeamWork ? (
                        <>
                          &lt;group_name&gt;_&lt;qid&gt;_&lt;submission_id&gt;_&lt;uploaded_filename&gt;
                        </>
                      ) : (
                        <>&lt;uid&gt;_&lt;qid&gt;_&lt;submission_id&gt;_&lt;uploaded_filename&gt;</>
                      )}
                    </code>
                  </>
                }
              />
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.allSubmissionsCsvFilename}`}
                filename={filenames.allSubmissionsCsvFilename}
                description={`تمام پاسخ‌های ارسال‌شده برای همه ${identityPluralFa} در تمام دفعات شرکت در آزمون. ممکن است همه پاسخ‌ها در محاسبه نمره نهایی لحاظ نشده باشند، زیرا برخی با تلاش‌های بعدی جایگزین شده‌اند.`}
              />
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.finalSubmissionsCsvFilename}`}
                filename={filenames.finalSubmissionsCsvFilename}
                description={`پاسخ‌های نهایی ارسال‌شده برای هر سوال برای همه ${identityPluralFa} در تمام دفعات شرکت در آزمون.`}
              />
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.bestSubmissionsCsvFilename}`}
                filename={filenames.bestSubmissionsCsvFilename}
                description={`بهترین پاسخ‌های ارسال‌شده برای هر سوال برای همه ${identityPluralFa} در تمام دفعات شرکت در آزمون. اگر ${identityFa} هیچ ارسال نمره‌داده‌شده‌ای برای یک سوال نداشته باشد، آخرین ارسال (در صورت وجود) جایگزین می‌شود.`}
              />
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.allFilesZipFilename}`}
                filename={filenames.allFilesZipFilename}
                description={
                  <>
                    تمام فایل‌های ارسال‌شده برای همه {identityPluralFa} در تمام دفعات شرکت در آزمون.
                    تنها داده‌های سوالات نوع <code>File</code> در فایل زیپ گنجانده می‌شوند. ممکن
                    است همه فایل‌های ارسال‌شده در محاسبه نمره نهایی لحاظ نشده باشند، زیرا برخی با
                    تلاش‌های بعدی جایگزین شده‌اند. قالب نام فایل به صورت زیر است:{' '}
                    <code>
                      {isTeamWork ? (
                        <>
                          &lt;group_name&gt;_&lt;assessment_instance_number&gt;_&lt;qid&gt;_&lt;variant_number&gt;_&lt;submission_number&gt;_&lt;submission_id&gt;_&lt;uploaded_filename&gt;
                        </>
                      ) : (
                        <>
                          &lt;uid&gt;_&lt;assessment_instance_number&gt;_&lt;qid&gt;_&lt;variant_number&gt;_&lt;submission_number&gt;_&lt;submission_id&gt;_&lt;uploaded_filename&gt;
                        </>
                      )}
                    </code>
                  </>
                }
              />
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.finalFilesZipFilename}`}
                filename={filenames.finalFilesZipFilename}
                description={
                  <>
                    فایل‌های نهایی ارسال‌شده برای هر سوال برای همه {identityPluralFa} در تمام دفعات
                    شرکت در آزمون. تنها داده‌های سوالات نوع <code>File</code> در فایل زیپ گنجانده
                    می‌شوند.
                  </>
                }
              />
              <DownloadRow
                downloadUrl={`${downloadsBase}${filenames.bestFilesZipFilename}`}
                filename={filenames.bestFilesZipFilename}
                description={
                  <>
                    بهترین فایل‌های ارسال‌شده برای هر سوال برای همه {identityPluralFa} در تمام دفعات
                    شرکت در آزمون. تنها داده‌های سوالات نوع <code>File</code> در فایل زیپ گنجانده
                    می‌شوند. اگر {identityFa} هیچ ارسال نمره‌داده‌شده‌ای برای یک سوال نداشته باشد،
                    آخرین ارسال (در صورت وجود) جایگزین می‌شود.
                  </>
                }
              />
            </tbody>
          </table>
        </div>
      </div>

      {canvasModal && (
        <CanvasDownloadModal
          downloadUrl={canvasModal.downloadUrl}
          filename={canvasModal.filename}
          students={students}
          show
          onHide={() => setCanvasModal(null)}
        />
      )}
    </>
  );
}

InstructorAssessmentDownloads.displayName = 'InstructorAssessmentDownloads';
