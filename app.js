let Config = {
    apiKey: ['sk-ant-api...'],  //填入'sk-ant-api...','sk-ant-api...'...
    api_rProxy: '',             //填入api镜像地址，留空则使用官网
    count: 0,                   //发送次数，0为不停止
    max_tokens: 1000,           //最大响应长度
    model: 'claude-2.1',        //模型名
    interval: [100,300],        //时间间隔，填入随机范围，例如[100,300]为100到300秒随机
};

const fs = require('fs');

const getPrompt = () => {
    let data, prompts;
    try {
        data = fs.readFileSync('prompts.txt', 'utf8');
    } catch (err) {
        console.error('Read Error: ', err);
        process.exit();
    }
    prompts = data.split(/\n+/g);
    return prompts[Math.floor(Math.random() * prompts.length)].replace(/(\r\n|\r|\\n)/gm, '\n');
}, randomInterval = () => {
    const [min, max] = Config.interval;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

!async function() {
    Config.apiKey = [...new Set(Config.apiKey.join('').match(/sk-ant-api\d\d-[\w-]{86}-[\w-]{6}AA/g))];
    for (let i = 0; i < Config.count || Config.count === 0; i++) {
        const prompt = getPrompt();
        console.log(`Count: ${i + 1}\nReq: ${prompt}`);
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
                prompt: '\n\nHuman: ' + prompt + '\n\nAssistant: '
            }),
        }).then(response => response.json())
            .then(result => console.log(`Res:${result.completion || JSON.stringify(result)}\n`))
            .catch(err => console.error('Req Error: ', err));
        await new Promise(resolve => setTimeout(resolve, randomInterval()*1000));
    }
}();

