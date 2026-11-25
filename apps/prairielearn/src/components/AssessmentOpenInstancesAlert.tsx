export function AssessmentOpenInstancesAlert({
  numOpenInstances,
  assessmentId,
  urlPrefix,
}: {
  numOpenInstances: number;
  assessmentId: string;
  urlPrefix: string;
}) {
  if (numOpenInstances === 0) return null;

  return (
    <div className="alert alert-warning" role="alert">
      این تکلیف/آزمون در حال حاضر{' '}
      {numOpenInstances === 1 ? 'یک نمونه باز دارد.' : `${numOpenInstances} نمونه باز دارد.`} لطفاً
      پیش از تصحیح، اطمینان حاصل کنید که تمامی دانشجویان تکلیف/آزمون خود را به پایان رسانده‌اند. می‌توانید تمامی نمونه‌های باز را در{' '}
      <a href={`${urlPrefix}/assessment/${assessmentId}/instances`}>زبانه دانشجویان</a> ببندید.
    </div>
  );
}
