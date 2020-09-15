const http=require("http");
const fs=require("fs");
const os=require("os");
const utils=require("./utils");
const path=require("path");
const handlers=require("./handlers");


const args=utils.parseArguments(process.argv);
const serverPort=Number.parseInt(args["-p"] || "8080");
let cwd=args["-d"] || process.cwd();
if (!path.isAbsolute(cwd))
{
    cwd=`${process.cwd()}/${cwd}`;
}
console.log(`Working in ${cwd}`);
http.createServer((req, res)=>
{
    let tmpfile=null;
    req.url=req.url.replace(/\.\./g, "").replace(/\/\//, "");
    if ((args["-a"] || "").includes(":"))
    {
        let auth=req.headers["authorization"];
        if (!(auth || "").includes("Basic"))
        {
            return res.end("Unauthorized");
        }
        if (Buffer.from(req.headers["authorization"].split(" ")[1], "base64").toString("utf8")!==args["-a"])
        {
            return res.end("Unauthorized");
        }
    }
    req.on("data", (chunk)=>
    {
        if (tmpfile===null)
        {
            tmpfile=`${os.tmpdir()}/${Date.now()}`;
        }
        fs.appendFileSync(tmpfile, chunk);
    }).on("end", async ()=>
    {
        let target=path.resolve(cwd, req.url.substring(1));
        console.log(">>", target);
        
        let f=handlers.get(req.method.toUpperCase());
        if (f===undefined)
        {
            if (tmpfile!==null)
            {
                fs.unlinkSync(tmpfile);
            }
            res.statusCode=400;
            return res.end("BAD METHOD");
        }
        await f(req, res, target, tmpfile);
        if (tmpfile!==null)
        {
            fs.unlinkSync(tmpfile);
        }
    });
}).listen(serverPort, ()=>
{
    const ifaces=os.networkInterfaces();
    console.log("Server on.");
    const keys=Object.keys(ifaces);
    let ips=new Array;
    for (let key of keys)
    {
        ips.push(...ifaces[key]);
    }
    ips=ips.filter(v=>v.family==="IPv4").map(v=>v.address);
    for (let ip of ips)
    {
        console.log(`http://${ip}:${serverPort}/`);
    }
});