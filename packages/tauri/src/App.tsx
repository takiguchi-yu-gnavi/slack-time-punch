import TauriSlackApp from './components/TauriSlackApp';
import styles from './styles/App.module.css';

const App = (): JSX.Element => {
  return (
    <div className={styles.app}>
      <TauriSlackApp />
    </div>
  );
};

export default App;
