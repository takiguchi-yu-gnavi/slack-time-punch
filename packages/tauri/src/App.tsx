import TauriSlackApp from './components/TauriSlackApp';
import styles from './styles/App.module.css';
import { DebugPanel } from './utils/debug';

const App = (): JSX.Element => {
  return (
    <div className={styles.app}>
      <TauriSlackApp />
      <DebugPanel />
    </div>
  );
};

export default App;
