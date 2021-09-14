#!/usr/bin/env node

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
const run = require("./utils/run");

console.log(chalk.green(`
                           SiriOS cli 命令
    ------------------------------------------------------------
       sirios init                              |  初始化项目 
       sirios run                               |  运行
       sirios plugin new                        |  创建插件模板     
       sirios -h                                |  查看帮助      
       sirios -V                                |  查看版本号 
    ------------------------------------------------------------
`));

// 下载源
const source = {
    'SiriusBot': {
        url: 'https://github.com/Sirius0v0/SiriusBot',
        downloadUrlMain: 'direct:git@github.com:Sirius0v0/SiriusBot#main',
        downloadUrlDev: 'direct:git@github.com:Sirius0v0/SiriusBot#dev',
        description: 'SiriOS原型--SiriusBot'
    },
    'LingCat-bot': {
        url: 'https://github.com/NPUcraft/LingCat-bot',
        downloadUrlMain: 'direct:git@github.com:NPUcraft/LingCat-bot#main',
        description: 'NPUcraft正版灵喵'
    }
}

// sirios -V|--version
program.version('1.0.8');  // -v|--version时输出版本号0.1.0

// sirios init
program
    .command('init')
    .description('初始化项目')
    .action(() => {
        //命令行答询
        inquirer.prompt([
            {
                type: 'list',
                name: 'source',
                message: '请选择下载源',
                choices: [
                    'SiriusBot#main',
                    'LingCat#main',
                    'SiriusBot#dev'
                ]
            },
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
            },
            {
                type: 'input',
                name: 'ownerid',
                message: '请输入机器人拥有者qqID',
                default: '123456789'
            }
        ]).then(answers => {
            let downloadUrl = '';
            switch (answers.source) {
                case 'SiriusBot#main':
                    downloadUrl = source['SiriusBot'].downloadUrlMain;
                    break;

                case 'SiriusBot#dev':
                    downloadUrl = source['SiriusBot'].downloadUrlDev;
                    break;

                case 'LingCat#main':
                    downloadUrl = source['LingCat-bot'].downloadUrlMain;
                    break;

                default:
                    break;
            }
            //下载github项目，下载墙loading提示
            const spinner = ora('正在下载...').start();
            //第一个参数是github仓库地址，第二个参数是创建的项目目录名，第三个参数是clone
            download(downloadUrl, answers.projectName, { clone: true }, err => {
                if (err) {
                    console.log(logSymbols.error, chalk.red('项目下载失败 请配置SSH后重试 o(╥﹏╥)o'));
                    console.log(err);
                    spinner.fail("下载失败!")
                } else {
                    //根据命令行答询结果修改package.json文件
                    let packageContent = JSON.parse(fs.readFileSync(`${resolve('./')}/${answers.projectName}/package.json`));
                    packageContent["name"] = answers.projectName;
                    packageContent["botNickname"] = answers.botName;
                    packageContent["account"] = Number(answers.qid);
                    packageContent["owner"] = Number(answers.ownerid);
                    fs.writeFileSync(`${resolve('./')}/${answers.projectName}/package.json`, JSON.stringify(packageContent, null, '\t'));
                    spinner.succeed('成功！ ~(*^▽^*)~');

                    console.log(logSymbols.success, chalk.green('项目初始化成功，开始下载依赖...'));

                    install({ cwd: `${resolve('./')}/${answers.projectName}` }).then(data => {
                        console.log(logSymbols.success, chalk.green('项目依赖下载成功！'));
                    });

                }
            })
        })
    })

// sirios plugin new
program
    .command('plugin new')
    .description('创建插件模板')
    .action(() => {
        let fileName = [];
        //获取插件列表
        try {
            fileName = fs.readdirSync(`${resolve('./')}/plugins`);
        } catch (error) {
            console.log(logSymbols.error, chalk.red('请在项目根目录下创建'));
            return;
        }

        //命令行答询
        inquirer.prompt([
            {
                type: 'input',
                name: 'pluginName',
                message: '请输入插件名称',
                default: '',
                validate(value) {
                    if ('' == value) return false;
                    if (value[0] === '.') {
                        console.log(logSymbols.error, chalk.red('非法的首字母'));
                        return false;
                    }
                    for (let index = 0; index < fileName.length; index++) {
                        let elem = fileName[index];
                        if (elem.endsWith(".js")) fileName[index] = elem.substr(0, elem.length - 3)
                    }
                    if (fileName.indexOf(value) !== -1) {
                        console.log(logSymbols.error, chalk.red('插件名已存在'));
                        return false;
                    }
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
            console.log(logSymbols.success, chalk.green('插件创建成功！'));
        })
    })

// sirios run
program
    .command('run')
    .description('开始运行')
    .action(() => {
        try {
            fs.readdirSync(`${resolve('./')}/plugins`);
        } catch (error) {
            console.log(logSymbols.error, chalk.red('请在项目根目录下运行'));
            return;
        }
        run({ cwd: `${resolve('./')}` })
    })

program.parse(process.argv);