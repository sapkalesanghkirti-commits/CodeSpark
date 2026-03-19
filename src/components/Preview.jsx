import React from "react";

function Preview({ srcDoc }) {

  return (
    <iframe
      srcDoc={srcDoc}
      title="preview"
      sandbox="allow-scripts"
      frameBorder="0"
      width="100%"
      height="100%"
      style={{
        backgroundColor: "white",
        border: "none"
      }}
    />
  );

}

export default Preview;