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

const getPrompt = (path, write = true) => {
    let data, prompts;
    try {
        data = fs.readFileSync(path, 'utf8');
    } catch (err) {
        console.error('Read Error: ', err);
        process.exit();
    }
    prompts = [...new Set(data.split(/\s*?(\n|\r)\s*/g).filter(item => !/^\s*$/.test(item)))];
    write && Config.max_prompts > 0 && prompts.length && writePrompts(path, randomArray(prompts, Config.max_prompts).join('\n'), true);
    return prompts[Math.floor(Math.random() * prompts.length)].replace(/\\n/gm, '\n');
}, writePrompts = (path, prompts, write = false) => {
    return prompts && (write ? fs.writeFile : fs.appendFile)(path, prompts, err => { err && console.error(err) });
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
        try {
            const genPrompt = Config.genPrompt && ((i + 1) % Config.genPrompt === 0), messagesAPI = /claude-[3-9]/.test(Config.model);
            let prompt = getPrompt(genPrompt ? 'genprompts.txt' : 'prompts.txt', !genPrompt), messages, system;
            const index = Math.floor(Math.random() * Config.apiKey.length);
            prompt = prompt.replace(/(\n\nHuman:(?!.*?\n\nAssistant:).*?|(?<!\n\nAssistant:.*?))$/s, '$&\n\nAssistant:').replace(/^.*?(?<!\n\nHuman:.*?)\n\nAssistant:/s, '\n\nHuman: $&');
            if (messagesAPI) {
                const rounds = prompt.replace(/\n\nAssistant: *$/, '').split('\n\nHuman:');
                messages = rounds.slice(1).flatMap(round => {
                    const turns = round.split('\n\nAssistant:');
                    return [{role: 'user', content: turns[0].trim().replace(/^$/,' ')}].concat(turns.slice(1).flatMap(turn => [{role: 'assistant', content: turn.trim().replace(/^$/,' ')}]))
                }), system = rounds[0].trim();
            }
            console.log(`Count: ${i + 1} | Model: ${Config.model}${Config.apiKey.length > 1 ? ' | Index: ' + index : ''}${genPrompt ? ' (gen)' : ''}\nReq: `, messagesAPI ? {...system && {system}, messages} : prompt.replace(/\n/g,'\\n'));
            await fetch(`${Config.api_rProxy ? Config.api_rProxy : 'https://api.anthropic.com'}/v1/${messagesAPI ? 'messages' : 'complete'}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': Config.apiKey[index],
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    ...messagesAPI ? {
                        max_tokens: Config.max_tokens,
                        messages,
                        ...system && {system}
                    } : {
                        max_tokens_to_sample: Config.max_tokens,
                        prompt
                    },
                    model: Config.model,
                    temperature: Config.temperature
                }),
            }).then(response => response.json())
                .then(result => {
                    console.log(`Res: ${result.completion || result.content?.[0].text || JSON.stringify(result)}\n`);
                    genPrompt && writePrompts('prompts.txt', '\n' + (result.completion || result.content?.[0].text  || '').replace(/^ *(\d+\.|-)? *| *$/gm,''));
                })
                .catch(err => console.error('Req Error: ', err));
            await new Promise(resolve => setTimeout(resolve, randomInterval()*1000));
        } catch (err) { console.error('Error: ', err) }
    }
}();