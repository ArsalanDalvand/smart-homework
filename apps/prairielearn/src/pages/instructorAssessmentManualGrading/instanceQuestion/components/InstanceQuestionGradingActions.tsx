import type { RefObject } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';

import { AI_GRADING_MODAL_OPEN_EVENT } from '../instanceQuestion.shared.js';

import type {
  InstanceQuestionGradingPanelProps,
  ManualGradingContext,
} from './InstanceQuestionGradingPanel.types.js';

export function InstanceQuestionGradingActions({
  aiGradingMode,
  context,
  disabled,
  editShortcuts,
  gradeButtonRef,
  graders,
  nextButtonRef,
  selectedGroupId,
  showNextShortcut,
  showSubmissionsAssignedToMeOnly,
  skipGradedSubmissions,
  skipText,
  onShowSubmissionsAssignedToMeOnlyChange,
  onSkipGradedSubmissionsChange,
}: {
  aiGradingMode: boolean;
  context: ManualGradingContext;
  disabled: boolean;
  editShortcuts: boolean;
  gradeButtonRef: RefObject<HTMLButtonElement | null>;
  graders: InstanceQuestionGradingPanelProps['graders'];
  nextButtonRef: RefObject<HTMLButtonElement | null>;
  selectedGroupId: string | null;
  showNextShortcut: boolean;
  showSubmissionsAssignedToMeOnly: boolean;
  skipGradedSubmissions: boolean;
  skipText: string;
  onShowSubmissionsAssignedToMeOnlyChange: (value: boolean) => void;
  onSkipGradedSubmissionsChange: (value: boolean) => void;
}) {
  const gradeButton = (
    <Button
      ref={gradeButtonRef}
      id={context === 'main' && !selectedGroupId ? 'grade-button' : undefined}
      type="submit"
      name="__action"
      value="add_manual_grade"
    >
      ثبت نمره
      {editShortcuts && (
        <kbd className="pl-kbd kbd-semi-transparent ms-2" aria-hidden="true">
          G
        </kbd>
      )}
    </Button>
  );

  // Bound menu widths to the action row rather than the individual button groups.
  return (
    <li className="list-group-item position-relative d-flex align-items-center justify-content-end flex-wrap gap-2">
      <div>
        {context === 'main' && !disabled ? (
          <>
            <Form.Check
              type="checkbox"
              id="skip-graded-submissions"
              name="skip_graded_submissions"
              value="true"
              checked={skipGradedSubmissions}
              label="رد کردن ارسال‌های تصحیح‌شده"
              onChange={(event) => onSkipGradedSubmissionsChange(event.target.checked)}
            />
            <Form.Check
              type="checkbox"
              id="show-submissions-assigned-to-me-only"
              name="show_submissions_assigned_to_me_only"
              value="true"
              checked={showSubmissionsAssignedToMeOnly}
              label="رد کردن ارسال‌هایی که به من تخصیص نیافته‌اند"
              onChange={(event) => onShowSubmissionsAssignedToMeOnlyChange(event.target.checked)}
            />
          </>
        ) : (
          <>
            <input
              type="hidden"
              name="skip_graded_submissions"
              value={`${skipGradedSubmissions}`}
            />
            <input
              type="hidden"
              name="show_submissions_assigned_to_me_only"
              value={`${showSubmissionsAssignedToMeOnly}`}
            />
          </>
        )}
      </div>

      <div className="ms-auto d-flex flex-wrap gap-1">
        {!disabled && (
          <>
            {context === 'main' && selectedGroupId ? (
              <Dropdown as={ButtonGroup} id="grade-button-with-options" className="position-static">
                {gradeButton}
                <Dropdown.Toggle aria-label="گزینه‌های ثبت نمره" split />
                <Dropdown.Menu align="end" className="mw-100" style={{ width: 'max-content' }}>
                  <Dropdown.Item
                    className="text-wrap"
                    as="button"
                    type="submit"
                    name="__action"
                    value="add_manual_grade"
                  >
                    فقط همین سوال دانشجو
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    className="text-wrap"
                    as="button"
                    type="submit"
                    name="__action"
                    value="add_manual_grade_for_instance_question_group_ungraded"
                  >
                    همه سوالات تصحیح‌نشده در گروه ارسال
                  </Dropdown.Item>
                  <Dropdown.Item
                    className="text-wrap"
                    as="button"
                    type="submit"
                    name="__action"
                    value="add_manual_grade_for_instance_question_group"
                  >
                    همه سوالات در گروه ارسال
                  </Dropdown.Item>
                  <Dropdown.Header className="text-wrap">
                    هوش مصنوعی ممکن است اشتباه کند. پیش از ثبت نمره، گروه‌های ارسال را بررسی کنید.
                  </Dropdown.Header>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              gradeButton
            )}

            {context === 'main' && aiGradingMode && (
              <Button
                id="ai-grade-button"
                type="button"
                title=""
                // The AI-grading island imperatively updates this button before this island may hydrate.
                suppressHydrationWarning
                onClick={() => document.dispatchEvent(new CustomEvent(AI_GRADING_MODAL_OPEN_EVENT))}
              >
                <i className="bi bi-stars me-1" aria-hidden="true" />
                تصحیح با هوش مصنوعی
              </Button>
            )}
          </>
        )}

        <Dropdown as={ButtonGroup} className="position-static">
          <Button
            ref={nextButtonRef}
            type="submit"
            variant="secondary"
            name="__action"
            value="next_instance_question"
          >
            {skipText}
            {showNextShortcut && (
              <kbd className="pl-kbd kbd-semi-transparent ms-2" aria-hidden="true">
                N
              </kbd>
            )}
          </Button>
          {!disabled && (
            <>
              <Dropdown.Toggle variant="secondary" aria-label="تغییر مصحح تخصیص‌یافته" split />
              <Dropdown.Menu align="end" className="mw-100" style={{ width: 'max-content' }}>
                {graders.map((grader) => (
                  <Dropdown.Item
                    key={grader.id}
                    className="text-wrap"
                    as="button"
                    type="submit"
                    name="__action"
                    value={`reassign_${grader.id}`}
                  >
                    تخصیص به {grader.name} ({grader.uid})
                  </Dropdown.Item>
                ))}
                <Dropdown.Item
                  className="text-wrap"
                  as="button"
                  type="submit"
                  name="__action"
                  value="reassign_nobody"
                >
                  نشانه‌گذاری برای تصحیح بدون مصحح مشخص
                </Dropdown.Item>
                <Dropdown.Item
                  className="text-wrap"
                  as="button"
                  type="submit"
                  name="__action"
                  value="reassign_graded"
                >
                  نشانه‌گذاری به‌عنوان تصحیح‌شده (حفظ نمره فعلی)
                </Dropdown.Item>
              </Dropdown.Menu>
            </>
          )}
        </Dropdown>
      </div>
    </li>
  );
}
