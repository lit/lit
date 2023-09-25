import Head from 'next/head';
import styles from '../styles/Home.module.css';
import '../src/simple-greeter';
import type {SimpleGreeter as SimpleGreeterWC} from '../src/simple-greeter';

import React from "react";
import dynamic from "next/dynamic";

const MySimpleGreeter = dynamic(() => import('../src/simple-greeter-react').then((module) => {
  return module.SimpleGreeterReactLazy;
}), {ssr: false});

const Page = () => {
  const ref = React.useRef<SimpleGreeterWC>(null);

  const focusEl = () => {
    const node = ref.current;

    if (node) {
      node.name = "clicked!";
    }
  }

  return (
    <>
      <MySimpleGreeter forwardRef={ref} />
      <button onClick={focusEl}>Click me</button>
    </>
  );
}

export default Page;
