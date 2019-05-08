const { shell } = require('electron');
const { exec } = require('child_process');
const color = require('color');
const afterAll = require('after-all-results');
const tildify = require('tildify');
const path = require('path');

let notify;
try {
    notify = require('hyper/notify');
} catch (error) {
    notify = function(title, body, details = {}) {
        debugLogger(`[Notification] ${title}: ${body}`);
        if (details.error) {
            console.error(details.error);
        }
        // debugLogger(_win)
        if (_win) {
            _win.webContents.send('notification', {
                title,
                body
            });
        }
    }
}
// const notify = require('hyper/notify');

exports.decorateConfig = (config) => {
    const colorForeground = color(config.foregroundColor || '#fff');
    const colorBackground = color(config.backgroundColor || '#000');
    const colors = {
        foreground: colorForeground.string(),
        background: colorBackground.lighten(0.3).string()
    };

    const configColors = Object.assign({
        black: '#000000',
        red: '#ff0000',
        green: '#33ff00',
        yellow: '#ffff00',
        blue: '#0066ff',
        magenta: '#cc00ff',
        cyan: '#00ffff',
        white: '#d0d0d0',
        lightBlack: '#808080',
        lightRed: '#ff0000',
        lightGreen: '#33ff00',
        lightYellow: '#ffff00',
        lightBlue: '#0066ff',
        lightMagenta: '#cc00ff',
        lightCyan: '#00ffff',
        lightWhite: '#ffffff'
    }, config.colors);

    const hyperStatusLine = Object.assign({
        footerTransparent: true,
        dirtyColor: configColors.lightYellow,
        aheadColor: configColors.blue
    }, config.hyperStatusLine);

    return Object.assign({}, config, {
        css: `
            ${config.css || ''}
            .terms_terms {
                margin-bottom: 30px;
            }
            .footer_footer {
                display: flex;
                justify-content: space-between;
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 100;
                font-size: 12px;
                height: 30px;
                background-color: ${colors.background};
                opacity: ${hyperStatusLine.footerTransparent ? '0.5' : '1'};
                cursor: default;
                -webkit-user-select: none;
                transition: opacity 250ms ease;
            }
            .footer_footer:hover {
                opacity: 1;
            }
            .footer_footer .footer_group {
                display: flex;
                color: ${colors.foreground};
                white-space: nowrap;
                margin: 0 14px;
            }
            .footer_footer .group_overflow {
                overflow: hidden;
            }
            .footer_footer .component_component {
                display: flex;
            }
            .footer_footer .component_item {
                position: relative;
                line-height: 30px;
                margin-left: 9px;
            }
            .footer_footer .component_item:first-of-type {
                margin-left: 0;
            }
            .footer_footer .item_clickable:hover {
                text-decoration: underline;
                cursor: pointer;
            }
            .footer_footer .item_icon:before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 14px;
                height: 100%;
                -webkit-mask-repeat: no-repeat;
                -webkit-mask-position: 0 center;
                background-color: ${colors.foreground};
            }
            .footer_footer .item_number {
                font-size: 10.5px;
                font-weight: 500;
            }
            .footer_footer .item_cwd {
                padding-left: 21px;
            }
            .footer_footer .item_cwd:before {
                -webkit-mask-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDE0IDEyIj48cGF0aCBmaWxsPSIjMDAwMDAwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMywyIEw3LDIgTDcsMSBDNywwLjM0IDYuNjksMCA2LDAgTDEsMCBDMC40NSwwIDAsMC40NSAwLDEgTDAsMTEgQzAsMTEuNTUgMC40NSwxMiAxLDEyIEwxMywxMiBDMTMuNTUsMTIgMTQsMTEuNTUgMTQsMTEgTDE0LDMgQzE0LDIuNDUgMTMuNTUsMiAxMywyIEwxMywyIFogTTYsMiBMMSwyIEwxLDEgTDYsMSBMNiwyIEw2LDIgWiIvPjwvc3ZnPg==');
                -webkit-mask-size: 14px 12px;
            }
            .footer_footer .item_branch {
                padding-left: 16px;
            }
            .footer_footer .item_branch:before {
                -webkit-mask-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5IiBoZWlnaHQ9IjEyIiB2aWV3Qm94PSIwIDAgOSAxMiI+PHBhdGggZmlsbD0iIzAwMDAwMCIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNOSwzLjQyODU3NzQ2IEM5LDIuNDc3MTQ4ODggOC4xOTksMS43MTQyOTE3NCA3LjIsMS43MTQyOTE3NCBDNi4zODY5NDE5NCwxLjcxMjI0NTc4IDUuNjc0MTI3NDksMi4yMzEzMDI2NCA1LjQ2MzA1NjAyLDIuOTc5MDk4NzEgQzUuMjUxOTg0NTQsMy43MjY4OTQ3OCA1LjU5NTQ1MzE3LDQuNTE2Mzc3NDEgNi4zLDQuOTAyODYzMTcgTDYuMyw1LjE2MDAwNjAzIEM2LjI4Miw1LjYwNTcyMDMxIDYuMDkzLDYuMDAwMDA2MDMgNS43MzMsNi4zNDI4NjMxNyBDNS4zNzMsNi42ODU3MjAzMSA0Ljk1OSw2Ljg2NTcyMDMxIDQuNDkxLDYuODgyODYzMTcgQzMuNzQ0LDYuOTAwMDA2MDMgMy4xNTksNy4wMjAwMDYwMyAyLjY5MSw3LjI2ODU3NzQ2IEwyLjY5MSwzLjE4ODU3NzQ2IEMzLjM5NTU0NjgzLDIuODAyMDkxNyAzLjczOTAxNTQ2LDIuMDEyNjA5MDcgMy41Mjc5NDM5OCwxLjI2NDgxMjk5IEMzLjMxNjg3MjUxLDAuNTE3MDE2OTIzIDIuNjA0MDU4MDYsLTAuMDAyMDM5OTM0MTUgMS43OTEsNi4wMjY4NzM4NWUtMDYgQzAuNzkyLDYuMDI2ODczODVlLTA2IDkuOTkyMDA3MjJlLTE3LDAuNzYyODYzMTcgOS45OTIwMDcyMmUtMTcsMS43MTQyOTE3NCBDMC4wMDM4NTgyMzAyNiwyLjMyMzA1MzU2IDAuMzQ2NDE5ODM1LDIuODg0MjAyMDkgMC45LDMuMTg4NTc3NDYgTDAuOSw4LjgxMTQzNDYgQzAuMzY5LDkuMTExNDM0NiAwLDkuNjYwMDA2MDMgMCwxMC4yODU3MjAzIEMwLDExLjIzNzE0ODkgMC44MDEsMTIuMDAwMDA2IDEuOCwxMi4wMDAwMDYgQzIuNzk5LDEyLjAwMDAwNiAzLjYsMTEuMjM3MTQ4OSAzLjYsMTAuMjg1NzIwMyBDMy42LDkuODMxNDM0NiAzLjQyLDkuNDI4NTc3NDYgMy4xMjMsOS4xMjAwMDYwMyBDMy4yMDQsOS4wNjg1Nzc0NiAzLjU1NSw4Ljc2ODU3NzQ2IDMuNjU0LDguNzE3MTQ4ODggQzMuODc5LDguNjIyODYzMTcgNC4xNTgsOC41NzE0MzQ2IDQuNSw4LjU3MTQzNDYgQzUuNDQ1LDguNTI4NTc3NDYgNi4yNTUsOC4xODU3MjAzMSA2Ljk3NSw3LjUwMDAwNjAzIEM3LjY5NSw2LjgxNDI5MTc0IDguMDU1LDUuODAyODYzMTcgOC4xLDQuOTExNDM0NiBMOC4wODIsNC45MTE0MzQ2IEM4LjYzMSw0LjYwMjg2MzE3IDksNC4wNTQyOTE3NCA5LDMuNDI4NTc3NDYgTDksMy40Mjg1Nzc0NiBaIE0xLjgsMC42ODU3MjAzMTMgQzIuMzk0LDAuNjg1NzIwMzEzIDIuODgsMS4xNTcxNDg4OCAyLjg4LDEuNzE0MjkxNzQgQzIuODgsMi4yNzE0MzQ2IDIuMzg1LDIuNzQyODYzMTcgMS44LDIuNzQyODYzMTcgQzEuMjE1LDIuNzQyODYzMTcgMC43MiwyLjI3MTQzNDYgMC43MiwxLjcxNDI5MTc0IEMwLjcyLDEuMTU3MTQ4ODggMS4yMTUsMC42ODU3MjAzMTMgMS44LDAuNjg1NzIwMzEzIEwxLjgsMC42ODU3MjAzMTMgWiBNMS44LDExLjMyMjg2MzIgQzEuMjA2LDExLjMyMjg2MzIgMC43MiwxMC44NTE0MzQ2IDAuNzIsMTAuMjk0MjkxNyBDMC43Miw5LjczNzE0ODg4IDEuMjE1LDkuMjY1NzIwMzEgMS44LDkuMjY1NzIwMzEgQzIuMzg1LDkuMjY1NzIwMzEgMi44OCw5LjczNzE0ODg4IDIuODgsMTAuMjk0MjkxNyBDMi44OCwxMC44NTE0MzQ2IDIuMzg1LDExLjMyMjg2MzIgMS44LDExLjMyMjg2MzIgTDEuOCwxMS4zMjI4NjMyIFogTTcuMiw0LjQ2NTcyMDMxIEM2LjYwNiw0LjQ2NTcyMDMxIDYuMTIsMy45OTQyOTE3NCA2LjEyLDMuNDM3MTQ4ODggQzYuMTIsMi44ODAwMDYwMyA2LjYxNSwyLjQwODU3NzQ2IDcuMiwyLjQwODU3NzQ2IEM3Ljc4NSwyLjQwODU3NzQ2IDguMjgsMi44ODAwMDYwMyA4LjI4LDMuNDM3MTQ4ODggQzguMjgsMy45OTQyOTE3NCA3Ljc4NSw0LjQ2NTcyMDMxIDcuMiw0LjQ2NTcyMDMxIEw3LjIsNC40NjU3MjAzMSBaIi8+PC9zdmc+');
                -webkit-mask-size: 9px 12px;
            }
            .footer_footer .item_dirty {
                color: ${hyperStatusLine.dirtyColor};
                padding-left: 16px;
            }
            .footer_footer .item_dirty:before {
                -webkit-mask-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDEyIDEyIj48cGF0aCBmaWxsPSIjMDAwMDAwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMS4xNDI4NTcxLDAgTDAuODU3MTQyODU3LDAgQzAuMzg1NzE0Mjg2LDAgMCwwLjM4NTcxNDI4NiAwLDAuODU3MTQyODU3IEwwLDExLjE0Mjg1NzEgQzAsMTEuNjE0Mjg1NyAwLjM4NTcxNDI4NiwxMiAwLjg1NzE0Mjg1NywxMiBMMTEuMTQyODU3MSwxMiBDMTEuNjE0Mjg1NywxMiAxMiwxMS42MTQyODU3IDEyLDExLjE0Mjg1NzEgTDEyLDAuODU3MTQyODU3IEMxMiwwLjM4NTcxNDI4NiAxMS42MTQyODU3LDAgMTEuMTQyODU3MSwwIEwxMS4xNDI4NTcxLDAgWiBNMTEuMTQyODU3MSwxMS4xNDI4NTcxIEwwLjg1NzE0Mjg1NywxMS4xNDI4NTcxIEwwLjg1NzE0Mjg1NywwLjg1NzE0Mjg1NyBMMTEuMTQyODU3MSwwLjg1NzE0Mjg1NyBMMTEuMTQyODU3MSwxMS4xNDI4NTcxIEwxMS4xNDI4NTcxLDExLjE0Mjg1NzEgWiBNMy40Mjg1NzE0Myw2IEMzLjQyODU3MTQzLDQuNTc3MTQyODYgNC41NzcxNDI4NiwzLjQyODU3MTQzIDYsMy40Mjg1NzE0MyBDNy40MjI4NTcxNCwzLjQyODU3MTQzIDguNTcxNDI4NTcsNC41NzcxNDI4NiA4LjU3MTQyODU3LDYgQzguNTcxNDI4NTcsNy40MjI4NTcxNCA3LjQyMjg1NzE0LDguNTcxNDI4NTcgNiw4LjU3MTQyODU3IEM0LjU3NzE0Mjg2LDguNTcxNDI4NTcgMy40Mjg1NzE0Myw3LjQyMjg1NzE0IDMuNDI4NTcxNDMsNiBMMy40Mjg1NzE0Myw2IFoiLz48L3N2Zz4=');
                -webkit-mask-size: 12px 12px;
                background-color: ${hyperStatusLine.dirtyColor};
            }
            .footer_footer .item_ahead {
                color: ${hyperStatusLine.aheadColor};
                padding-left: 16px;
            }
            .footer_footer .item_ahead:before {
                -webkit-mask-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDEyIDEyIj48cGF0aCBmaWxsPSIjMDAwMDAwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01LjE0Mjg1NzE0LDYuODU3MTQyODYgTDIuNTcxNDI4NTcsNi44NTcxNDI4NiBMMi41NzE0Mjg1Nyw1LjE0Mjg1NzE0IEw1LjE0Mjg1NzE0LDUuMTQyODU3MTQgTDUuMTQyODU3MTQsMi41NzE0Mjg1NyBMOS40Mjg1NzE0Myw2IEw1LjE0Mjg1NzE0LDkuNDI4NTcxNDMgTDUuMTQyODU3MTQsNi44NTcxNDI4NiBMNS4xNDI4NTcxNCw2Ljg1NzE0Mjg2IFogTTEyLDAuODU3MTQyODU3IEwxMiwxMS4xNDI4NTcxIEMxMiwxMS42MTQyODU3IDExLjYxNDI4NTcsMTIgMTEuMTQyODU3MSwxMiBMMC44NTcxNDI4NTcsMTIgQzAuMzg1NzE0Mjg2LDEyIDAsMTEuNjE0Mjg1NyAwLDExLjE0Mjg1NzEgTDAsMC44NTcxNDI4NTcgQzAsMC4zODU3MTQyODYgMC4zODU3MTQyODYsMCAwLjg1NzE0Mjg1NywwIEwxMS4xNDI4NTcxLDAgQzExLjYxNDI4NTcsMCAxMiwwLjM4NTcxNDI4NiAxMiwwLjg1NzE0Mjg1NyBMMTIsMC44NTcxNDI4NTcgWiBNMTEuMTQyODU3MSwwLjg1NzE0Mjg1NyBMMC44NTcxNDI4NTcsMC44NTcxNDI4NTcgTDAuODU3MTQyODU3LDExLjE0Mjg1NzEgTDExLjE0Mjg1NzEsMTEuMTQyODU3MSBMMTEuMTQyODU3MSwwLjg1NzE0Mjg1NyBMMTEuMTQyODU3MSwwLjg1NzE0Mjg1NyBaIiB0cmFuc2Zvcm09Im1hdHJpeCgwIC0xIC0xIDAgMTIgMTIpIi8+PC9zdmc+');
                -webkit-mask-size: 12px 12px;
               background-color: ${hyperStatusLine.aheadColor};
            }
            .notifications_view {
                bottom: 50px;
            }
        `
    });
};

let pid;
let cwd;
let git = {
    branch: '',
    remote: '',
    dirty: 0,
    ahead: 0
}
let _app;
let _win;
let matchSSHConnect=(data)=>{return false;}
let matchSSHDisconnect=(data)=>{return data.match("Connection to [^ ]+ closed");}
let SSHConnect={}
let aliasSendCommand="fs"
let aliasReceiveCommand="js"
let sendCommand="scp_send"
let receiveCommand="scp_receive"
let sshConnectTime=1000
let injectCommand = true
let injectFuncName = "scp_inject_func"
let defaultInteraction = false
let debugLog = true
let maxMatchLength = 500
let scpHelperDisable = true

// @flow

const WRITE_TO_TERMINAL = 'statusline/executecommand';
const writeToTerminal = (command, uid) => window.rpc.emit(WRITE_TO_TERMINAL, { command, uid });
const executeCommand = (command, uid, currentInput = '') =>
  writeToTerminal(`${'\b'.repeat(currentInput.length)}${command}\r`, uid);
const debugLogger = function(){
    debugLog && console.log.apply(null, arguments)
}

exports.onWindow = (win) => {
    win.rpc.on(WRITE_TO_TERMINAL, ({ uid, command }) => {
        win.sessions.get(uid).write(command);
    });
    win.rpc.on("scp-send-select-file", ({options, args}) =>{
        console.log(options)
        console.log(args)
        const dialog = require('electron').dialog
        const notify = (title, body, details) => {win.rpc.emit("statusline-notify", {title, body, details})}
        // const notify = (title, body, details={}) => {
        //     console.log(`[Notification] ${title}: ${body}`);
        //     if (details.error) {
        //         console.error(details.error);
        //     }
        //     win.webContents.send('notification', {
        //         title,
        //         body
        //     });
        // }
        dialog.showOpenDialog(options, function (files) {
            console.log(files)
            if(!files || !files.length){
                notify("User canceled")
                return
            }
            let source = []
            files.forEach((value, index) => {
                source.push("'" + value + "'")
            });
            scpToServer(args.server, source, args.destination)
        })
    })
    win.rpc.on("scp-receive-select-path", ({options, args}) =>{
        console.log(options)
        console.log(args)
        const dialog = require('electron').dialog
        const notify = (title, body, details) => {win.rpc.emit("statusline-notify", {title, body, details})}
        // const notify = (title, body, details={}) => {
        //     console.log(`[Notification] ${title}: ${body}`);
        //     if (details.error) {
        //         console.error(details.error);
        //     }
        //     win.webContents.send('notification', {
        //         title,
        //         body
        //     });
        // }
        dialog.showOpenDialog(options, function (files) {
            console.log(files)
            if(!files || !files.length){
                notify("User canceled")
                return
            }
            scpToLocal(args.server, args.source, "'" + files[0] + "'")
        })
    })
    _win = win
    // console.log(_win)
};

exports.onApp = (app) => {
    _app = app;
    refreshConfig()
};

const refreshConfig = (config) =>{
    if(_app){
        config = _app.config.getConfig()
    }
    if(!config || !config.hyperStatusLine) return
    debugLogger(config.hyperStatusLine)
    if(config.hyperStatusLine.matchSSHConnect && typeof(config.hyperStatusLine.matchSSHConnect) == 'function'){
        matchSSHConnect = config.hyperStatusLine.matchSSHConnect
    }
    if(config.hyperStatusLine.matchSSHDisconnect && typeof(config.hyperStatusLine.matchSSHDisconnect) == 'function'){
        matchSSHDisconnect = config.hyperStatusLine.matchSSHDisconnect
    }
    aliasSendCommand=config.hyperStatusLine.aliasSendCommand || "fs"
    aliasReceiveCommand=config.hyperStatusLine.aliasReceiveCommand || "js"
    sendCommand=config.hyperStatusLine.sendCommand || "scp_send"
    receiveCommand=config.hyperStatusLine.receiveCommand || "scp_receive"
    sshConnectTime=config.hyperStatusLine.sshConnectTime || 1000
    injectCommand=config.hyperStatusLine.injectCommand || true
    injectFuncName=config.hyperStatusLine.injectFuncName || "scp_inject_func"
    defaultInteraction=config.hyperStatusLine.defaultInteraction || false
    debugLog=config.hyperStatusLine.debugLog || false
    maxMatchLength=config.hyperStatusLine.maxMatchLength || 500
    debugLogger(matchSSHConnect)
}

const setCwd = (pid, action) => {
    if (process.platform == 'win32') {
        let directoryRegex = /([a-zA-Z]:[^\:\[\]\?\"\<\>\|]+)/mi;
        if (action && action.data) {
            let path = directoryRegex.exec(action.data);
            if(path){
                cwd = path[0];
                setGit(cwd);
            }
        }
    } else {
        exec(`lsof -p ${pid} | awk '$4=="cwd"' | tr -s ' ' | cut -d ' ' -f9-`, (err, stdout) => {
            cwd = stdout.trim();
            setGit(cwd);
        });
    }

};

const isGit = (dir, cb) => {
    exec(`git rev-parse --is-inside-work-tree`, { cwd: dir }, (err) => {
        cb(!err);
    });
}

const gitBranch = (repo, cb) => {
    exec(`git symbolic-ref --short HEAD || git rev-parse --short HEAD`, { cwd: repo }, (err, stdout) => {
        if (err) {
            return cb(err);
        }

        cb(null, stdout.trim());
    });
}

const gitRemote = (repo, cb) => {
    exec(`git ls-remote --get-url`, { cwd: repo }, (err, stdout) => {
        cb(null, stdout.trim().replace(/^git@(.*?):/, 'https://$1/').replace(/[A-z0-9\-]+@/, '').replace(/\.git$/, ''));
    });
}

const gitDirty = (repo, cb) => {
    exec(`git status --porcelain --ignore-submodules -uno`, { cwd: repo }, (err, stdout) => {
        if (err) {
            return cb(err);
        }

        cb(null, !stdout ? 0 : parseInt(stdout.trim().split('\n').length, 10));
    });
}

const gitAhead = (repo, cb) => {
    exec(`git rev-list --left-only --count HEAD...@'{u}' 2>/dev/null`, { cwd: repo }, (err, stdout) => {
        cb(null, parseInt(stdout, 10));
    });
}

const gitCheck = (repo, cb) => {
    const next = afterAll((err, results) => {
        if (err) {
            return cb(err);
        }

        const branch = results[0];
        const remote = results[1];
        const dirty = results[2];
        const ahead = results[3];

        cb(null, {
            branch: branch,
            remote: remote,
            dirty: dirty,
            ahead: ahead
        });
    });

    gitBranch(repo, next());
    gitRemote(repo, next());
    gitDirty(repo, next());
    gitAhead(repo, next());
}

const setGit = (repo) => {
    isGit(repo, (exists) => {
        if (!exists) {
            git = {
                branch: '',
                remote: '',
                dirty: 0,
                ahead: 0
            }

            return;
        }

        gitCheck(repo, (err, result) => {
            if (err) {
                throw err;
            }

            git = {
                branch: result.branch,
                remote: result.remote,
                dirty: result.dirty,
                ahead: result.ahead
            }
        })
    });
}

exports.decorateHyper = (Hyper, { React }) => {
    return class extends React.PureComponent {
        constructor(props) {
            super(props);

            this.state = {
                cwd: '',
                branch: '',
                remote: '',
                dirty: 0,
                ahead: 0
            }

            this.handleCwdClick = this.handleCwdClick.bind(this);
            this.handleBranchClick = this.handleBranchClick.bind(this);
        }

        handleCwdClick(event) {
            shell.openExternal('file://'+this.state.cwd);
        }

        handleBranchClick(event) {
            shell.openExternal(this.state.remote);
        }

        render() {
            const { customChildren } = this.props
            const existingChildren = customChildren ? customChildren instanceof Array ? customChildren : [customChildren] : [];

            return (
                React.createElement(Hyper, Object.assign({}, this.props, {
                    customInnerChildren: existingChildren.concat(React.createElement('footer', { className: 'footer_footer' },
                        React.createElement('div', { className: 'footer_group group_overflow' },
                            React.createElement('div', { className: 'component_component component_cwd' },
                                React.createElement('div', { className: 'component_item item_icon item_cwd item_clickable', title: this.state.cwd, onClick: this.handleCwdClick, hidden: !this.state.cwd }, this.state.cwd ? tildify(String(this.state.cwd)) : '')
                            )
                        ),
                        React.createElement('div', { className: 'footer_group' },
                            React.createElement('div', { className: 'component_component component_git' },
                                React.createElement('div', { className: `component_item item_icon item_branch ${this.state.remote ? 'item_clickable' : ''}`, title: this.state.remote, onClick: this.handleBranchClick, hidden: !this.state.branch }, this.state.branch),
                                React.createElement('div', { className: 'component_item item_icon item_number item_dirty', title: `${this.state.dirty} dirty ${this.state.dirty > 1 ? 'files' : 'file'}`, hidden: !this.state.dirty }, this.state.dirty),
                                React.createElement('div', { className: 'component_item item_icon item_number item_ahead', title: `${this.state.ahead} ${this.state.ahead > 1 ? 'commits' : 'commit'} ahead`, hidden: !this.state.ahead }, this.state.ahead)
                            )
                        )
                    ))
                }))
            );
        }

        componentDidMount() {
            this.interval = setInterval(() => {
                this.setState({
                    cwd: cwd,
                    branch: git.branch,
                    remote: git.remote,
                    dirty: git.dirty,
                    ahead: git.ahead
                });
            }, 100);
            window.rpc.on('statusline-notify', ({title, body, details}) => {
                notify(title, body, details)
            })
        }

        componentWillUnmount() {
            clearInterval(this.interval);
        }
    };
};

exports.middleware = (store) => (next) => (action) => {
    const uids = store.getState().sessions.sessions;
    debugLogger(action)
    switch (action.type) {
        case 'SESSION_SET_XTERM_TITLE':
            pid = uids[action.uid].pid;
            break;

        case 'SESSION_ADD':
            pid = action.pid;
            delete SSHConnect[action.uid]
            setCwd(pid);
            break;

        case 'SESSION_ADD_DATA':
            const { data } = action;
            const enterKey = data.indexOf('\n') > 0;

            if (enterKey) {
                setCwd(pid, action);
            }
            break;
        case 'SESSION_SET_ACTIVE':
            pid = uids[action.uid].pid;
            setCwd(pid);
            break;
        case 'SESSION_PTY_DATA':
            matchPTYData(action)
            break;
        case 'CONFIG_LOAD':
        case 'CONFIG_RELOAD':
            refreshConfig(action.config)
            break;
    }

    next(action);
};

const matchPTYData = (action) => {
    if (scpHelperDisable) return
    // 字符太长，就不匹配了，影响性能
    if (action.data.length > maxMatchLength) return
    if(!SSHConnect[action.uid]){
        let result = matchSSHConnect(action.data, debugLogger)
        if(result){
            setTimeout(() => {
                exec(`ssh -p ${result[2]} ${result[0]}@${result[1]} "echo \\$HOSTNAME"`, (err, stdout) => {
                    debugLogger("error", err);
                    debugLogger("stdout", stdout);
                    if(err){
                        // ssh can not reuse
                        notify("SSH can not reuse")
                    } else {
                        notify(`SSH server ${result[1]} connect success`)
                        SSHConnect[action.uid] = {
                            "host": result[1],
                            "port": result[2],
                            "user": result[0]
                        }
                        if(injectCommand){
                            injectCommandToServer(action.uid)
                        }

                    }
                });
            }, sshConnectTime);
        }
    } else {
        // match disconnect
        let data = action.data.trim("\n")
        let result = matchSSHDisconnect(data, debugLogger)
        debugLogger("matchSSHDisconnect", result)
        if(result){
            notify(`SSH server ${SSHConnect[action.uid].host} disconnect`)
            delete SSHConnect[action.uid]
            return
        }
        // match sendCommand receiveCommand
        let sendRegex = new RegExp("^'" + sendCommand + "' (.+)")
        let receiveRegex = new RegExp("^'" + receiveCommand + "' (.+)")
        // 只取前3条进行匹配
        let lines = data.split("\n", 3)
        debugLogger("match lines", lines)
        lines.every((line)=>{
            line = line.trim()
            debugLogger("match line", line)
            sendResult = sendRegex.exec(line)
            debugLogger("sendResult", sendResult)
            if(sendResult){
                handleSend(action.uid, sendResult[1])
                return false
            }
            receiveResult = receiveRegex.exec(line)
            debugLogger("receiveResult", receiveResult)
            if(receiveResult){
                handleReceive(action.uid, receiveResult[1])
                return false
            }
            return true
        })
    }
}

const injectCommandToServer = (termID) => {
    let helpCMD = `printf '\\nUsage:\\n${aliasSendCommand} [localhost:]file1 ... [-d [remoteserver:]path]\\n${aliasReceiveCommand} [remoteserver:]file1 ... [-d [localhost:]path]\\n\\nOptions:\\n-d  The destination in localhost or remoteserver.It can be absolute path or relative to your pwd.\\n-i  Open the file dialog to choose the source files when send to server or the destination folder when receive from server.\\n-n   Do not Open the file dialog.\\n\\nExample:\\n${aliasSendCommand} testfile.txt   This will send the file in your localhost pwd to the remoteserver.\\n\\nInject success! Enjoy yourself!\\n\\n'`
    executeCommand(`${injectFuncName}(){ local s="";for i in $@; do s="$s '$i'"; done;s="$s '-w' '$(pwd)'";echo $s; } && alias ${aliasSendCommand}="${injectFuncName} ${sendCommand} ${defaultInteraction ? '-i' : '-n'}" && alias ${aliasReceiveCommand}="${injectFuncName} ${receiveCommand} ${defaultInteraction ? '-i' : '-n'}" && ${helpCMD}`, termID)
}

const parseArgs = (arg) =>{
    let args = arg.trim().split("' '")
    let maxIndex = args.length - 1
    args.forEach((value, index, arr)=>{
        if(index==0){
            arr[index] = value + "'"
        }else if(index==maxIndex){
            arr[index] = "'" + value
        }else{
            arr[index] = "'" + value + "'"
        }
    })
    return args
}

const handleSend = (termID, arg) => {
    let args = parseArgs(arg)
    debugLogger(args)
    let source = []
    let destination = ''
    let serverPWD = ''
    let isInteractive = false
    args.forEach((value, index, arr) => {
        if(index && arr[index-1] == "'-d'"){
            destination = value
        }else if(index && arr[index-1] == "'-w'"){
            serverPWD = value
        }else if(arr[index] == "'-i'"){
            isInteractive = true
        }else if(arr[index] == "'-n'"){
            isInteractive = false
        }else if (value != "'-d'" && value != "'-w'" && value != "'-i'" && value != "'-n'") {
            source.push(value)
        }
    });
    debugLogger(source, destination, serverPWD)
    if (destination == "") {
        destination = serverPWD
    } else if (destination.trim("'")[0] != "/") {
        destination = "'" + path.join(serverPWD.trim("'"), destination.trim("'")) + "'"
    }
    debugLogger("isInteractive", isInteractive)
    if(isInteractive){
        notify("Choose files to send")
        window.rpc.emit("scp-send-select-file", {
            options: {
                defaultPath: cwd,
                title: "请选择上传的文件",
                buttonLabel: "确定",
                filters: [],
                properties: ['openFile', 'openDirectory', 'multiSelections', 'showHiddenFiles'],
                message: "",
            },
            args: {
                server: SSHConnect[termID],
                destination: destination
            }
        })
    } else {
        source.forEach((value, index, arr) => {
            value = value.trim("'")
            if (value[0] != "/"){
                arr[index] = "'" + path.join(cwd, value) + "'"
            }
        })
        debugLogger("source  ", source)
        debugLogger("destination  ", destination)
        scpToServer(SSHConnect[termID], source, destination)
    }
}

const handleReceive = (termID, arg) => {
    let args = parseArgs(arg)
    debugLogger(args)
    let source = []
    let destination = ''
    let serverPWD = ''
    let isInteractive = false
    args.forEach((value, index, arr) => {
        if(index && arr[index-1] == "'-d'"){
            destination = value
        }else if(index && arr[index-1] == "'-w'"){
            serverPWD = value
        }else if(arr[index] == "'-i'"){
            isInteractive = true
        }else if(arr[index] == "'-n'"){
            isInteractive = false
        }else if(value != "'-d'" && value != "'-w'" && value != "'-i'" && value != "'-n'"){
            source.push(value)
        }
    });
    debugLogger(source, destination, serverPWD)
    source.forEach((value, index, arr) => {
        value = value.trim("'")
        if (value[0] != "/"){
            arr[index] = "'" + path.join(serverPWD.trim("'"), value) + "'"
        }
    })
    debugLogger("isInteractive", isInteractive)
    if(isInteractive){
        notify("Choose path to receive")
        window.rpc.emit("scp-receive-select-path", {
            options: {
                defaultPath: cwd,
                title: "请选择保存路径",
                buttonLabel: "确定",
                filters: [],
                properties: ['openDirectory', 'showHiddenFiles', 'createDirectory'],
                message: "",
            },
            args: {
                server: SSHConnect[termID],
                source: source
            }
        })
    } else {
        if(destination==""){
            destination = "'" + cwd + "'"
        } else if (destination.trim("'")[0] != "/"){
            destination = "'" + path.join(cwd, destination.trim("'")) + "'"
        }
        debugLogger("source  ", source)
        debugLogger("destination  ", destination)
        scpToLocal(SSHConnect[termID], source, destination)
    }
}

if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

const scpToServer = (server, source, destination, handle) => {
    execSSH(server, `mkdir -p ${destination}`, (err, stdout, stderr) => {
        if (err) {
            notify("Create destination false", stdout)
            return;
        }
        execCMD(`scp -r -P ${server.port} ${source.join(' ')} ${server.user}@${server.host}:${destination}`, (err, stdout, stderr) => {
            if (err) {
                notify("Send file false", stdout)
            } else {
                notify("Send success")
            }
            handle && handle(err, stdout, stderr)
        });
    })
}

const scpToLocal = (server, source, destination, handle) => {
    execCMD(`mkdir -p ${destination}`, (err, stdout, stderr) => {
        if (err) {
            notify("Create destination false", stdout)
            return;
        }
        execCMD(`scp -r -P ${server.port} ${server.user}@${server.host}:"${source.join(' ')}" ${destination}`, (err, stdout, stderr) => {
            if (err) {
                notify("Receive file false", stdout)
            } else {
                notify("Receive success")
            }
            handle && handle(err, stdout, stderr)
        });
    })
}

String.prototype.trim = function (char, type) {
    if (char) {
        if (type == 'left') {
            return this.replace(new RegExp('^\\'+char+'+', 'g'), '');
        } else if (type == 'right') {
            return this.replace(new RegExp('\\'+char+'+$', 'g'), '');
        }
        return this.replace(new RegExp('^\\'+char+'+|\\'+char+'+$', 'g'), '');
    }
    return this.replace(/^\s+|\s+$/g, '');
};

const execSSH = (server, cmd, handle) => {
    cmd = Array.isArray(cmd) ? cmd : [cmd]
    let command = cmd.join(" && ")
    execCMD(`ssh -p ${server.port} ${server.user}@${server.host} "${command}"`, (err, stdout, stderr) => {
        handle && handle(err, stdout, stderr)
    });
}

const execCMD = (command, handle) => {
    debugLogger(command)
    exec(command, (err, stdout, stderr) => {
        debugLogger("error", err);
        debugLogger("stdout", stdout);
        debugLogger("stderr", stderr);
        handle && handle(err, stdout, stderr)
    });
}