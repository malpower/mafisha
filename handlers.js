const handlers=new Map;
const fs=require("fs");
const path=require("path");

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
                let u=`${req.url}/${v}`.replace(/\/{1,}/g, "/");
                return `<tr><td>${s.mtime.toLocaleString()}</td><td>${s.size}</td><td><a href="${u}">${v}${s.isDirectory()?"/":""}</a></td></tr>`;
            });
            res.setHeader("Content-Type","text/html");
            res.end(`<html>${header}<body><table><thead><tr><th>Created At</th><th>Size</th><th>File</th></tr></thead><tbody>${list.join("\n")}</tbody></table></body></html>`);
            return;
        }
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Length", `${s.size}`);
        let rs=fs.createReadStream(target)
        rs.on("data", (chunk)=>
        {
            res.write(chunk);
        }).on("end", ()=>
        {
            res.end();
        });
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
    try
    {
        fs.copyFileSync(tmpfile, target);
        console.log(req.url, "created", (new Date).toLocaleString(), req.socket.remoteAddress);
    }
    catch (e)
    {
        res.statusCode=400;
        return res.end("No such file.");
    }
    res.end("OK");
}).set("DELETE", async (req, res, target)=>
{
    try
    {
        fs.unlinkSync(target);
        console.log(req.url, "deleted", (new Date).toLocaleString(), req.socket.remoteAddress);
    }
    catch (e)
    {
        res.statusCode=400;
        return res.end("No such file.");
    }
    res.end("OK");
});



module.exports=handlers;