import React, { Children } from "react";

const ButtonSettings = ({ Children, onclick }) => {
  return <button onClick={onclick}>{Children}</button>;
};

export default ButtonSettings;
