import { useState } from "react";
import logo from "/vite.svg";

function Toolbar({ runCode }) {

const [theme,setTheme] = useState("dark")

const toggleTheme = () => {

if(theme === "dark"){
document.body.classList.add("light")
setTheme("light")
}else{
document.body.classList.remove("light")
setTheme("dark")
}

}

return(

<div className="toolbar">

<div className="brand">

<img src={logo} className="logo"/>

<div className="title">
<h2>CodeSpark</h2>
<span>Run • Build • Preview</span>
</div>

</div>
<div className="actions">


{/* <button className="theme" onClick={toggleTheme} style={{backgroundColor:"Blue"}}>
{theme === "dark" ? "🌙 Dark" : "☀ Light"}
</button> */}


</div>

</div>

)

}

export default Toolbar