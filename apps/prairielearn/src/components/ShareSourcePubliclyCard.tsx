import { Alert, Form } from 'react-bootstrap';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { PublicLinkSharing } from './LinkSharing.js';

interface BlockingChild {
  id: string;
  href: string;
  label: string;
}

/**
 * Sharing card used on the assessment-settings and course-instance-settings
 * pages. Both surfaces have the same structure: a `share_source_publicly`
 * checkbox, a description, a blocking warning that lists non-publicly-shared
 * children with links to their settings pages, and a `PublicLinkSharing` block
 * once shared.
 *
 * Sharing can be un-done: once shared, the checkbox stays editable so the
 * source can be un-shared — except when `unshareBlock` is set, which keeps the
 * checkbox disabled because a publicly-shared parent (e.g. the course instance
 * of a shared assessment) must be un-shared first.
 *
 * Copy varies only by two nouns:
 *   - `entityNoun`: this card's entity ("assessment", "course instance").
 *   - `childNoun`: what must also be shared ("questions", "assessments").
 *
 * The question-settings sharing card intentionally does not use this component
 * — it has additional fields (a separate `share_publicly` toggle and a
 * sharing-set selector) that don't fit this shape.
 */
export function ShareSourcePubliclyCard({
  alreadyShared,
  canEdit,
  registerProps,
  defaultChecked,
  blockingChildren,
  publicLink,
  entityNoun,
  childNoun,
  unshareBlock,
}: {
  /** Current persisted value of `share_source_publicly`. */
  alreadyShared: boolean;
  canEdit: boolean;
  /** Result of `register('share_source_publicly')` from react-hook-form. */
  registerProps: UseFormRegisterReturn;
  defaultChecked: boolean | undefined;
  /** Non-publicly-shared children that block the transition; empty when clear. */
  blockingChildren: BlockingChild[];
  publicLink: string;
  /** Singular noun for this card's entity, e.g. "assessment". */
  entityNoun: string;
  /** Plural noun for the blocking children, e.g. "questions". */
  childNoun: string;
  /**
   * When set, the source is shared but cannot be un-shared until a
   * publicly-shared parent is un-shared first. `parentNoun` names that parent
   * (e.g. "course instance") and `href` links to its settings page.
   */
  unshareBlock?: { parentNoun: string; href: string };
}) {
  const blockedCount = blockingChildren.length;
  const translateNoun = (noun: string) =>
    ({
      assessment: 'تکلیف/آزمون',
      'course instance': 'دوره آموزشی',
      questions: 'سوالات',
      assessments: 'تکالیف و آزمون‌ها',
    })[noun] ?? noun;
  const entityLabel = translateNoun(entityNoun);
  const childLabel = translateNoun(childNoun);
  const parentLabel = unshareBlock ? translateNoun(unshareBlock.parentNoun) : '';

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="h5 card-title mb-3">اشتراک‌گذاری</h2>
        <Form.Check
          type="checkbox"
          id="share_source_publicly"
          label="اشتراک‌گذاری عمومی کد منبع"
          className="mb-1"
          disabled={!canEdit || blockedCount > 0 || unshareBlock != null}
          defaultChecked={defaultChecked}
          {...registerProps}
        />
        <small className="form-text text-muted d-block mb-2">
          کد منبع این {entityLabel} برای مشاهده و کپی کردن توسط دیگران در دسترس قرار می‌گیرد.
        </small>
        {blockedCount > 0 && !alreadyShared && (
          <Alert variant="warning" className="small mb-2">
            امکان اشتراک‌گذاری عمومی این {entityLabel} وجود ندارد تا زمانی که {childLabel} زیر نیز
            به‌صورت عمومی به اشتراک گذاشته شوند:{' '}
            {blockingChildren.map((child, i) => (
              <span key={child.id}>
                {i > 0 && '، '}
                <a href={child.href}>{child.label}</a>
              </span>
            ))}
            .
          </Alert>
        )}
        {unshareBlock != null && (
          <Alert variant="warning" className="small mb-2">
            تا زمانی که {parentLabel} مربوطه به‌صورت عمومی به اشتراک گذاشته شده است، نمی‌توان
            اشتراک‌گذاری کد منبع این {entityLabel} را لغو کرد. برای لغو اشتراک‌گذاری، ابتدا{' '}
            <a href={unshareBlock.href}>اشتراک‌گذاری {parentLabel} را لغو کنید</a>.
          </Alert>
        )}
        {alreadyShared && (
          <PublicLinkSharing
            publicLink={publicLink}
            sharingMessage={`کد منبع این ${entityLabel} به‌صورت عمومی به اشتراک گذاشته شده است.`}
            publicLinkMessage={`پیوندی که سایر مدرسان می‌توانند برای مشاهده این ${entityLabel} از آن استفاده کنند.`}
          />
        )}
      </div>
    </div>
  );
}
