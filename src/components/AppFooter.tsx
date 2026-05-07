import styles from './AppFooter.module.css';

export function AppFooter() {
  return (
    <div className={styles.footer}>
      DomusA<span style={{ color: 'var(--color-accent)' }}>★</span> &nbsp;|&nbsp; Need help? refer
      to the{' '}
      <a href="#">Information Hub</a>,{' '}
      <a href="#">create a ticket</a>{' '}
      or <a href="#">contact us</a> for support.
    </div>
  );
}
