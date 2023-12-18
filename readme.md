# Claude Auto Test / Claude自动测试
基础使用：
  - 利用GPT等AI生成问题集
  - 将问题集以换行分隔放入prompts.txt，其中问题中如果本身包含换行则用\n代替
  - 配置app.js中的Config项，例如apiKey等
  - 使用start.bat或命令行node app.js启动

进阶使用：
  - 编写用于生成问题集的提示词集，注意必须添加\n\nHuman:和\n\nAssistant:，并且建议为Assistant写入开头避免开头被写入prompts（例: \n\nHuman:生成十个问题\n\nAssistant:以下是十个问题:\n）
  - 在genPrompts中填写用于生成问题集的提示词集，其中换行用\n代替
  - Config中的genPrompts项设置为正整数，值代表请求多少次生成一次提示词