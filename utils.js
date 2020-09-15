function parseArguments(argv)
{
    let args={};
    for (let i=0;i<argv.length;i++)
    {
        let arg=argv[i];
        if (arg.indexOf("-")===0)
        {
            args[arg]=argv[i+1] || arg;
        }
    }
    return args;
}

module.exports={parseArguments};
