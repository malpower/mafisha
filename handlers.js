const handlers=new Map;
const fs=require("fs");

const header=`
<head>
<title>Http File Sharer</title>
<style>
td {
    padding: 10px;
    border: solid 1px #000;
    border-collapse: collapse;
}
table{
    border-collapse: collapse;
}
</style>
</head>
`;

handlers.set("GET", async (req, res, target, tmpfile)=>
{
    try
    {
        let s=fs.statSync(target);
        if (s.isDirectory())
        {
            let list=fs.readdirSync(target);
            list=list.map(v=>
            {
                let s=fs.statSync(`${target}/${v}`);
                return `<tr><td>${s.mtime.toLocaleString()}</td><td>${s.size}</td><td><a href=".${req.url}${(req.url==="/"?"":"/")}${v}">${v}${s.isDirectory()?"/":""}</a></td></tr>`;
            });
            res.setHeader("Content-Type","text/html");
            res.end(`<html>${header}<body><table><thead><tr><th>Created At</th><th>Size</th><th>File</th></tr></thead><tbody>${list.join("\n")}</tbody></table></body></html>`);
            return;
        }
        res.setHeader("Content-Type", "application/octet-stream");
        res.end(fs.readFileSync(target));
    }
    catch (e)
    {
        console.log(e);
        res.statusCode=404;
        res.end("NOT FOUND");
    }
    return;
}).set("POST", async (req, res, target, tmpfile)=>
{
    res.end("OK");
    fs.copyFileSync(tmpfile, target);
    console.log(req.url, "created", (new Date).toLocaleString(), req.socket.remoteAddress);
}).set("DELETE", async (req, res, target)=>
{
    res.end("OK");
    fs.unlinkSync(target);
    console.log(req.url, "deleted", (new Date).toLocaleString(), req.socket.remoteAddress);
});



module.exports=handlers;