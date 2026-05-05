import { styles } from "../styles/appStyles";

export function Toggle({ on, onChange }) {
  return (
    <label style={styles.toggle} onClick={() => onChange(!on)}>
      <div style={styles.toggleSlider(on)}>
        <div style={styles.toggleThumb(on)} />
      </div>
    </label>
  );
}
