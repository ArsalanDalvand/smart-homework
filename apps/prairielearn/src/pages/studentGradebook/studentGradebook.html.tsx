import { PageLayout } from '../../components/PageLayout.js';
import { Scorebar } from '../../components/Scorebar.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';

export interface StudentGradebookTableRow {
  assessment_id: string;
  assessment_instance_id: string;
  assessment_group_work: boolean;
  title: string;
  assessment_set_heading: string;
  assessment_set_color: string;
  label: string;
  assessment_instance_score_perc: number | null;
  show_closed_assessment_score: boolean;
  start_new_set: boolean;
}

export function StudentGradebook({
  resLocals,
  rows,
  csvFilename,
}: {
  resLocals: ResLocalsForPage<'course-instance'>;
  rows: StudentGradebookTableRow[];
  csvFilename: string;
}) {
  const assessmentGroups: StudentGradebookTableRow[][] = [];
  rows.forEach((row) => {
    if (row.start_new_set || assessmentGroups.length === 0) {
      assessmentGroups.push([row]);
    } else {
      assessmentGroups[assessmentGroups.length - 1].push(row);
    }
  });

  return PageLayout({
    resLocals,
    pageTitle: 'کارنامه و نمرات',
    navContext: {
      type: 'student',
      page: 'gradebook',
    },
    content: (
      <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
        <div className="card-header bg-primary text-white d-flex align-items-center">
          <h1 className="h4 mb-0">کارنامه و نمرات دانشجو</h1>
          <a
            href={`/pl/course_instance/${resLocals.course_instance.id}/gradebook/${csvFilename}`}
            className="btn btn-light btn-sm ms-auto"
            aria-label="دانلود کارنامه CSV"
          >
            <i className="fas fa-download me-1" aria-hidden="true" />
            <span className="d-none d-sm-inline">دریافت کارنامه (CSV)</span>
          </a>
        </div>

        {rows.length === 0 ? (
          <div className="card-body">
            <div className="text-muted">در حال حاضر موردی در کارنامه ثبت نشده است.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover" aria-label="کارنامه">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>کد</th>
                  <th>عنوان ارزیابی</th>
                  <th className="text-center" style={{ width: '25%' }}>نمره نهایی</th>
                </tr>
              </thead>
              {assessmentGroups.map((groupRows) => (
                <tbody key={groupRows[0].assessment_id}>
                  <tr>
                    <th colSpan={3} scope="rowgroup">
                      {groupRows[0].assessment_set_heading}
                    </th>
                  </tr>
                  {groupRows.map((row) => (
                    <tr key={`${row.assessment_id}-${row.assessment_instance_id}`}>
                      <td className="align-middle" style={{ width: '1%' }}>
                        <span className={`badge color-${row.assessment_set_color}`}>
                          {row.label}
                        </span>
                      </td>
                      <td className="align-middle">
                        {row.title}{' '}
                        {row.assessment_group_work && (
                          <i className="fas fa-users" aria-hidden="true" />
                        )}
                      </td>
                      <td className="text-center align-middle">
                        {row.show_closed_assessment_score ? (
                          <Scorebar
                            score={row.assessment_instance_score_perc}
                            className="mx-auto"
                          />
                        ) : (
                          'نمره پنهان است'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </div>
    ),
  });
}
