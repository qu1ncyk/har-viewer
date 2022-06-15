import { Component, splitProps } from "solid-js";

type Props = { icon: { toSvg: Function }; } & Object;

const Feather: Component<Props> = (props) => {
  const [, otherProps] = splitProps(props, ["icon"]);
  
  return <span innerHTML={props.icon.toSvg(otherProps)}></span>;
}

export default Feather;