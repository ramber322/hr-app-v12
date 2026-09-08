import { CalendarColoredIcon, ApplicantCheckboxIcon } from "../components/icons/CustomIcons";
function ModalPreview() {
  const positionTitle = "HR Officer";
  const score = 87;
  const requirementsMet = 8;

  return (
    <div className="success-popup-overlay">
      <div className="success-popup">
        <div className="icon"><ApplicantCheckboxIcon size={18} /></div>

        <h2>Application Submitted!</h2>

        <p className="sub-text">
          Your application for{" "}
          <strong>"{positionTitle}"</strong>{" "}
          has been submitted successfully.
        </p>

        <div className="score-summary">
          <div className="item">
            <div className="value">{score}%</div>
            <div className="label">AI Match Score</div>
          </div>

          <div className="item">
            <div className="value">{requirementsMet}</div>
            <div className="label">Requirements Met</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalPreview;
