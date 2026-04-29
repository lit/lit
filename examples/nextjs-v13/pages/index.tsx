import Head from 'next/head';
import styles from '../styles/Home.module.css';
import '../src/simple-greeter';
import SimpleGreeter from '../src/simple-greeter-react';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Lit in Next.js</title>
        <link rel="icon" href="/flame-favicon.svg" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://lit.dev">Lit</a> and{' '}
          <a href="https://nextjs.org">Next.js!</a>
        </h1>
        <p className={styles.description}>
          The component below is a web component #builtWithLit
        </p>
        <simple-greeter name="Friend"></simple-greeter>
        <p className={styles.description}>
          The component below is a component wrapped with{' '}
          <a href="https://github.com/lit/lit/tree/main/packages/labs/react">
            <code>@lit-labs/react</code>
          </a>
        </p>
        <SimpleGreeter name="React" />
      </main>
    </div>
  );
}
