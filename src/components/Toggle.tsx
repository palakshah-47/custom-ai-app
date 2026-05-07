import styles from './Toggle.module.css';

interface ToggleProps {
  on: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <label className={styles.toggle} onClick={() => onChange(!on)}>
      <div className={`${styles.slider} ${on ? '' : styles.sliderOff}`}>
        <div className={`${styles.thumb} ${on ? '' : styles.thumbOff}`} />
      </div>
    </label>
  );
}
