import Head from 'next/head';
import styles from '../styles/Home.module.css';
import '../src/simple-greeter';
import {SimpleGreeter as SimpleGreeterWC} from '../src/simple-greeter';
import SimpleGreeter from '../src/simple-greeter-react';

import React from "react";
import dynamic from "next/dynamic";

const MySimpleGreeter = dynamic(() => import('../src/simple-greeter-react').then((el) => {
  console.log('got el', el);
  return el;
}), {ssr: false});

console.log(MySimpleGreeter);

const Page = () => {
  const ref = React.useRef();

  // The primary issue is this ref issue.
  const focusEl = () => ref.current.focus();

  return (
    <>
      {/* <input ref={ref} /> */}
      <MySimpleGreeter ref={ref} />
      {/* <SimpleGreeter ref={ref} /> */}
      <button onClick={focusEl}>Click me</button>
    </>
  );
}

export default Page;
