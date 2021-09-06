const program = require('commander');               //设计命令行
const download = require('download-git-repo');      //github仓库下载
const handlebars = require('handlebars');           //修改字符
const inquirer = require('inquirer');               //命令行交互
const ora = require('ora');                         //命令行中加载状态标识
const chalk = require('chalk');                     //命令行输出字符颜色
const logSymbols = require('log-symbols');          //命令行输出符号
const fs = require('fs');
const { resolve } = require("path");
const path = require("path");
const install = require("./utils/install");

console.log(chalk.green(`
                           SiriOS cli 命令
    ------------------------------------------------------------
       sirios init                              |  初始化项目 
       sirios plugin new                        |  创建插件模板     
       sirios -h                                |  查看帮助      
       sirios -V                                |  查看版本号 
    ------------------------------------------------------------
`));

// sirios -V|--version
program.version('1.0.0');  // -v|--version时输出版本号0.1.0

// sirios init
program
    .command('init')
    .description('初始化项目')
    .action(() => {
        //命令行答询
        inquirer.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: 'SiriOS-Bot'
            },
            {
                type: 'input',
                name: 'botName',
                message: '请输入机器人名称',
                default: '小天狼星'
            },
            {
                type: 'input',
                name: 'qid',
                message: '请输入机器人qqID',
                default: '123456789'
            }
        ]).then(answers => {

            const downloadUrl = "https://github.com:NPUcraft/LingCat-bot#main";
            //下载github项目，下载墙loading提示
            const spinner = ora('正在下载...').start();
            //第一个参数是github仓库地址，第二个参数是创建的项目目录名，第三个参数是clone
            download(downloadUrl, answers.projectName, { clone: true }, err => {
                if (err) {
                    console.log(logSymbols.error, chalk.red('项目下载失败 请重试 o(╥﹏╥)o'));
                    console.log(err);
                    return;
                } else {
                    //根据命令行答询结果修改package.json文件
                    let packageContent = JSON.parse(fs.readFileSync(`${resolve('./')}/${answers.projectName}/package.json`));
                    packageContent["name"] = answers.projectName;
                    packageContent["botNickname"] = answers.botName;
                    packageContent["account"] = Number(answers.qid);
                    fs.writeFileSync(`${resolve('./')}/${answers.projectName}/package.json`, JSON.stringify(packageContent, null, '\t'));
                    spinner.succeed('成功！ ~(*^▽^*)~');

                    console.log(logSymbols.success, chalk.green('项目初始化成功，开始下载依赖...'));

                    // install({ cwd: `${resolve('./')}/${answers.projectName}` }).then(data => {
                    //     console.log(logSymbols.success, chalk.green('项目依赖下载成功！'));
                    // });

                }
            })
        })
    })

// sirios plugin new
program
    .command('plugin new')
    .description('创建插件模板')
    .action(() => {
        //命令行答询
        inquirer.prompt([
            {
                type: 'input',
                name: 'pluginName',
                message: '请输入插件名称',
                default: '',
                validate(value) {
                    if ('' == value) return false;
                    return true;
                }
            },
            {
                type: 'list',
                name: 'type',
                message: '请选择响应事件的类型',
                choices: [
                    'notice',
                    'message'
                ]
            },
            {
                type: 'input',
                name: 'funcName',
                message: '请输入插件主函数名',
                default: 'funcName'
            }
        ]).then(answers => {
            if (answers.type === 'notice') {
                const templatePath = path.join(__dirname, "./template/notice_template.template");
                let templateContent = String(fs.readFileSync(templatePath));
                let pluginTemplate = handlebars.compile(templateContent)(answers);
                fs.writeFileSync(`./plugins/${answers.pluginName}.js`, pluginTemplate);
            } else {
                const templatePath = path.join(__dirname, "./template/message_template.template");
                let templateContent = String(fs.readFileSync(templatePath));
                let pluginTemplate = handlebars.compile(templateContent)(answers);
                fs.writeFileSync(`./plugins/${answers.pluginName}.js`, pluginTemplate);
            }
        })
    })

program.parse(process.argv);