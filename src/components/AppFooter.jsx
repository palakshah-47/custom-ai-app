import { ACCENT, TEAL } from "../styles/appStyles";

const footerBar = {
  textAlign: "center",
  padding: "6px",
  fontSize: "11px",
  color: "#aaa",
  background: "#fff",
  borderTop: "1px solid #ece9e4",
  flexShrink: 0,
};

export function AppFooter() {
  return (
    <div style={footerBar}>
      DomusA<span style={{ color: ACCENT }}>★</span> &nbsp;|&nbsp; Need help? refer to the{" "}
      <a href="#" style={{ color: TEAL }}>
        Information Hub
      </a>
      ,{" "}
      <a href="#" style={{ color: TEAL }}>
        create a ticket
      </a>{" "}
      or{" "}
      <a href="#" style={{ color: TEAL }}>
        contact us
      </a>{" "}
      for support.
    </div>
  );
}
