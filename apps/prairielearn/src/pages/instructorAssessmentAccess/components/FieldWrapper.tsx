import type { ReactNode } from 'react';
import { Button, Card } from 'react-bootstrap';

import { useAccessControlRuleEditable } from './AccessControlEditabilityContext.js';

export function FieldWrapper({
  isOverridden,
  label,
  onOverride,
  onRemoveOverride,
  headerToggle,
  headerAction,
  children,
}: {
  isOverridden: boolean;
  label: string;
  onOverride?: () => void;
  onRemoveOverride?: () => void;
  headerToggle?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const ruleEditable = useAccessControlRuleEditable();
  const cardStyle = isOverridden ? {} : { border: '2px dashed var(--bs-border-color)' };
  const showHeaderActions = headerAction != null || (ruleEditable && onRemoveOverride != null);

  return (
    <Card style={cardStyle}>
      <Card.Body>
        {!isOverridden ? (
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">{label}</span>
            {ruleEditable && onOverride && (
              <Button
                size="sm"
                variant="outline-primary"
                className="ms-3"
                aria-label={`بازنویسی ${label}`}
                onClick={onOverride}
              >
                بازنویسی
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center gap-3 mb-2 flex-wrap">
              {headerToggle ?? <strong>{label}</strong>}
              {showHeaderActions && (
                <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                  {headerAction}
                  {ruleEditable && onRemoveOverride && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      className="text-nowrap"
                      aria-label={`حذف بازنویسی برای ${label}`}
                      onClick={onRemoveOverride}
                    >
                      حذف بازنویسی
                    </Button>
                  )}
                </div>
              )}
            </div>
            {children}
          </>
        )}
      </Card.Body>
    </Card>
  );
}
