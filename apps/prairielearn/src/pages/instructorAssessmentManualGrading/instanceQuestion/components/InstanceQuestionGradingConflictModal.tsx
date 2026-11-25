import { useState } from 'react';
import { Alert, Card, Col, Modal, Row } from 'react-bootstrap';

import { InstanceQuestionGradingPanel } from './InstanceQuestionGradingPanel.js';
import type { InstanceQuestionGradingPanelProps } from './InstanceQuestionGradingPanel.types.js';

interface ConflictGrade {
  gradedAt: string | null;
  graderName: string;
  gradingPanelData: InstanceQuestionGradingPanelProps;
}

export interface InstanceQuestionGradingConflictModalProps {
  conflictingGrade: ConflictGrade;
  existingGrade: ConflictGrade;
}

function GradeMetadata({ gradedAt, graderName }: Pick<ConflictGrade, 'gradedAt' | 'graderName'>) {
  return (
    <div className="mb-2">
      {gradedAt ? `${gradedAt}، ` : ''}توسط {graderName}
    </div>
  );
}

export function InstanceQuestionGradingConflictModal({
  conflictingGrade,
  existingGrade,
}: InstanceQuestionGradingConflictModalProps) {
  // Open the modal immediately when the component is mounted (i.e. when the page loads).
  const [show, setShow] = useState(true);

  return (
    <Modal
      show={show}
      size="xl"
      aria-labelledby="grading-conflict-modal-title"
      onHide={() => setShow(false)}
    >
      <Modal.Header className="bg-danger text-light" closeVariant="white" closeButton>
        <Modal.Title id="grading-conflict-modal-title">تداخل در تصحیح شناسایی شد</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="danger">
          ارسالی که هم‌اکنون تصحیح کردید، قبلاً توسط {existingGrade.graderName} تصحیح شده است.
          نمره و بازخورد شما اعمال نشد. لطفاً بازخوردهای زیر را بررسی کرده و نحوه ادامه را
          انتخاب کنید.
        </Alert>
        <Row className="mb-2">
          <Col xs={12} lg={6}>
            <div>
              <strong>نمره و بازخورد فعلی</strong>
            </div>
            <GradeMetadata
              gradedAt={existingGrade.gradedAt}
              graderName={existingGrade.graderName}
            />
            <Card>
              <InstanceQuestionGradingPanel data={existingGrade.gradingPanelData} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <div>
              <strong>نمره و بازخورد متداخل</strong>
            </div>
            <GradeMetadata
              gradedAt={conflictingGrade.gradedAt}
              graderName={conflictingGrade.graderName}
            />
            <Card>
              <InstanceQuestionGradingPanel data={conflictingGrade.gradingPanelData} />
            </Card>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
}

InstanceQuestionGradingConflictModal.displayName = 'InstanceQuestionGradingConflictModal';
