import { html } from '@prairielearn/html';

import type { Assessment, AssessmentInstance, AssessmentSet } from '../lib/db-types.js';
import { formatPoints } from '../lib/format.js';

import { ScorebarHtml } from './Scorebar.js';

export function AssessmentScorePanel({
  assessment_instance,
  assessment_set,
  assessment,
  urlPrefix,
}: {
  assessment_instance: AssessmentInstance;
  assessment_set: AssessmentSet;
  assessment: Assessment;
  urlPrefix: string;
}) {
  return html`
    <div class="card mb-4" id="assessment-score-panel">
      <div class="card-header bg-secondary">
        <h2>
          <a class="text-white" href="${urlPrefix}/assessment_instance/${assessment_instance.id}/">
            ${assessment_set.name} ${assessment.number}
          </a>
        </h2>
      </div>
      <div class="card-body">
        <div class="d-flex justify-content-center">
          <a
            class="btn btn-info text-white"
            href="${urlPrefix}/assessment_instance/${assessment_instance.id}/"
          >
            <i class="fa fa-th-list me-1"></i> نمای کلی تکلیف
          </a>
        </div>
      </div>
      <table class="table table-sm" aria-label="نمره تکلیف/آزمون">
        <tbody>
          <tr>
            <td>مجموع امتیازات:</td>
            <td>
              <span dir="ltr">${formatPoints(assessment_instance.points)} / ${formatPoints(
                assessment_instance.max_points,
              )}</span>
            </td>
          </tr>
          <tr>
            <td>درصد نمره:</td>
            <td class="align-middle">${ScorebarHtml(assessment_instance.score_perc)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}
