import { useRef } from "react";
export default function C({ id }) {
  const cacheRef = useRef({});
  const f = () => {
    cacheRef.current[id] = { a: 1 };
    delete cacheRef.current[id];
  };
  return <button onClick={f}>x</button>;
}
