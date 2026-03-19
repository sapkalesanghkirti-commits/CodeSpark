function FileTabs({active,setActive}){
<hr />
const files=["html","css","js"]

return(

<div className="tabs">

{files.map((file)=>{

return(

<div
key={file}
className={active===file?"tab active":"tab"}
onClick={()=>setActive(file)}
>

{file.toUpperCase()}

</div>

)

})}

</div>

)

}

export default FileTabs