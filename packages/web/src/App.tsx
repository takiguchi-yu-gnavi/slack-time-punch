import SlackAuthApp from './components/SlackAuthApp';
import styles from './styles/App.module.css';

function App(): JSX.Element {
  return (
    <div className={styles.app}>
      <SlackAuthApp />
    </div>
  );
}

export default App;
