import { StudentLabelBadge } from '../../../components/StudentLabelBadge.js';
import { getCourseInstanceStudentsUrl } from '../../../lib/client/url.js';
import type { StudentLabelWithUserData } from '../instructorStudentsLabels.types.js';

export function LabelTableRow({
  label,
  courseInstanceId,
  canEdit,
  disabled,
  onEdit,
  onDelete,
}: {
  label: StudentLabelWithUserData;
  courseInstanceId: string;
  canEdit: boolean;
  disabled?: boolean;
  onEdit: (label: StudentLabelWithUserData) => void;
  onDelete: (label: StudentLabelWithUserData) => void;
}) {
  const count = label.user_data.length;
  const studentsUrl = `${getCourseInstanceStudentsUrl(courseInstanceId)}?student_labels=${encodeURIComponent(label.student_label.id)}`;

  return (
    <tr>
      <td className="align-middle">
        <StudentLabelBadge label={label.student_label} />
      </td>
      <td className="align-middle">
        {count === 0 ? (
          <span className="text-muted">۰ دانشجو</span>
        ) : (
          <a href={studentsUrl}>
            {count} دانشجو
          </a>
        )}
      </td>
      {canEdit && (
        <td className="align-middle">
          <div className="d-flex gap-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              aria-label={`ویرایش ${label.student_label.name}`}
              disabled={disabled}
              onClick={() => onEdit(label)}
            >
              ویرایش
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              aria-label={`حذف ${label.student_label.name}`}
              disabled={disabled}
              onClick={() => onDelete(label)}
            >
              حذف
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}
