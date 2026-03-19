import MonacoEditor from "@monaco-editor/react";

function Editor({ language, code, setCode }) {

const map = {
html: "html",
css: "css",
js: "javascript",
};

const handleChange = (value) => {
setCode(value || "");
};

return (

<div className="editor">

<MonacoEditor
height="500px"
theme="vs-dark"
language={map[language]}
value={code}
onChange={handleChange}
/>

</div>

);

}

export default Editor;

