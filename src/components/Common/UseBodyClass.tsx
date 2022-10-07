import { useEffect } from "react";

const addBodyClass = (className) => document.body.classList.add(className);
const removeBodyClass = (className) => document.body.classList.remove(className);

export default function UseBodyClass(className: string | Array<string>) {
  useEffect(() => {
    // Mount
    className instanceof Array ? className.map(addBodyClass) : addBodyClass(className);
    // Unmount
    return () => {
      className instanceof Array ? className.map(removeBodyClass) : removeBodyClass(className);
    };
  }, [className]);
}
