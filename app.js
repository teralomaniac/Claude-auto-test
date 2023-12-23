let Config = {
    apiKey: ['sk-ant-api...'],  //填入'sk-ant-api...','sk-ant-api...'...
    api_rProxy: '',             //（可选）填入api镜像地址，留空则使用官网
    count: 0,                   //发送次数，0为不停止
    genPrompt: 0,               //生成提示词，0为关闭，正整数为每请求几次中生成一次提示词
    max_prompts: 0,             //最大提示词数，超出后随机删除至指定数值，0为关闭
    max_tokens: 4000,           //最大响应长度
    model: 'claude-2.1',        //模型名
    interval: [100,300],        //时间间隔，填入随机范围，例如[100,300]为100到300秒随机
    temperature: 0              //温度
};

const fs = require('fs');

const getPrompt = path => {
    let data, prompts;
    try {
        data = fs.readFileSync(path, 'utf8');
    } catch (err) {
        console.error('Read Error: ', err);
        process.exit();
    }
    prompts = [...new Set(data.split(/\s*?(\n|\r)\s*/g).filter(item => !/^\s*$/.test(item)))];
    Config.max_prompts > 0 && writePrompts(path, randomArray(prompts, Math.min(Config.max_prompts, prompts.length)).join('\n'), true);
    return prompts[Math.floor(Math.random() * prompts.length)].replace(/\\n/gm, '\n');
}, writePrompts = (path, prompts, write = false) => {
    (write ? fs.writeFile : fs.appendFile)(path, prompts, err => {
        err && console.error(err);
    });
}, randomArray = (arr, num) => {
    if (num >= arr.length) return arr;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, num);
}, randomInterval = () => {
    const [min, max] = Config.interval;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

!async function() {
    Config.apiKey = [...new Set([Config.apiKey].join('').match(/sk-ant-api\d\d-[\w-]{86}-[\w-]{6}AA/g))];
    for (let i = 0; i < Config.count || Config.count === 0; i++) {
        const genPrompt = Config.genPrompt && ((i + 1) % Config.genPrompt === 0);
        const prompt = getPrompt(genPrompt ? 'genprompts.txt' : 'prompts.txt');
        console.log(`Count: ${i + 1}${genPrompt ? ' (gen)' : ''}\nReq: ${prompt}`);
        await fetch(`${Config.api_rProxy ? Config.api_rProxy : 'https://api.anthropic.com'}/v1/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': Config.apiKey[Math.floor(Math.random() * Config.apiKey.length)],
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: Config.model,
                max_tokens_to_sample: Config.max_tokens,
                temperature: Config.temperature,
                prompt: prompt
                    .replace(/(?:^.*?)(\n\nHuman:|)/s, function(match, p1) {return !match.includes('\n\nAssistant:') && p1 != '' ? match : '\n\nHuman: ' + match})
                    .replace(/(\n\nAssistant:|)(?:.*?$)/s, function(match, p1) {return !match.includes('\n\nHuman:') && p1 != '' ? match :  match + '\n\nAssistant: '})
            }),
        }).then(response => response.json())
            .then(result => {
                console.log(`Res:${result.completion || JSON.stringify(result)}\n`);
                genPrompt && writePrompts('prompts.txt', result.completion.replace(/^ *(\d+\.|-)? *| *$/gm,''));
            })
            .catch(err => console.error('Req Error: ', err));
        await new Promise(resolve => setTimeout(resolve, randomInterval()*1000));
    }
}();
