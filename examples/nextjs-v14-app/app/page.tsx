import styles from './Home.module.css';
import SimpleGreeter from './simple-greeter';
import SimpleGreeterReact from '../src/simple-greeter-react';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://lit.dev">Lit</a> and{' '}
          <a href="https://nextjs.org">Next.js!</a>
        </h1>
        <p className={styles.description}>
          The component below is a web component #builtWithLit
        </p>
        <SimpleGreeter name="Friend" />
        <p className={styles.description}>
          The component below is a component wrapped with{' '}
          <a href="https://github.com/lit/lit/tree/main/packages/labs/react">
            <code>@lit-labs/react</code>
          </a>
        </p>
        <SimpleGreeterReact name="React" />
      </main>
    </div>
  );
}
