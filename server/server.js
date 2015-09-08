/**
 * Created by svtter on 2015/9/2.
 */

(function() {
    //导入客户端模块
    var cli = require("./client"),
        data = require("./data");
    var http = require("http");
//    定义服务器端
    var Server = function() {
//        绑定io对象
        this.io = null;
//        记录所有客户端
        this.clients = [];

        this.tHand = null;
        this.info = null;
        this.cfg = null;
    };

    Server.prototype = {
        listen:function(port)
        {
            var srv = http.createServer(function(req, rep){});
            this.io = require("socket.io")(srv);
            //DEBUG

            srv.listen(port);
            this.bindEvent();

            this.info = data.gameData().info;
            this.cfg = data.gameData().cfg;
        },

        bindEvent:function() {
            var self = this;
//            注册连接事件
            this.io.on("connection", function(socket) { self.doConnect(socket); });
        },

        doConnect:function(socket) {
            this.addClient(socket);
        },

        //添加一个客户端
        addClient:function(socket)
        {
            console.log("add new client:"+socket.id);
            this.clients.push(cli.newClient(this, socket));
        },

        //移出一个客户端
        removeClientByID:function(sID)
        {
            var idx = -1;
            for (var i = 0; i < this.clients.length; i++)
            {
                if(this.clients[i].so.id  == sID)
                {
                    idx = i;
                    break;
                }
            }

            if(idx != -1) {
                this.clients.splice(idx, 1);
            }

            if(this.info.status != this.clients.length == 0)
            {
                clearInterval(this.tHand);
                this.resetGameInfo();
            }
        },

        //判断用户是否存在
        isUserExists:function(client)
        {
            for(var i = 0; i < this.clients.length; i++)
            {
                if(client != this.clients[i] && this.clients[i].user.uname == client.user.uname)
                {
                    return true;
                }
            }
            return false;
        },

        getAllUser:function()
        {
            var p = [];
            for(var i = 0;i < this.clients.length; i++)
            {
                p.push(this.clients[i].user);
            }
            return p;
        },


        // 广播消息
        broadcastMsg:function(msg)
        {
            this.io.send(msg);
        },

        //广播事件
        broadcastEvent:function(eventName, data) {
            this.io.emit(eventName, data);
        },

        updateUserInfo:function()
        {
            var users = this.getAllUser();
            if(users.length != 0)
            {
                this.broadcastEvent("updateUserInfo", users);
            }
        },

        isRightAnswer:function(ans) {
            return ans == this.info.question.data;
        },

        getRandQuestion:function() {
//            console.log(this.cfg.qtype, this.cfg.qdata);
            var tidx = Math.random()*this.cfg.qtype.length | 0,
                didx = Math.random()*this.cfg.qdata[tidx].length | 0;
            var type = this.cfg.qtype[tidx],
                ques = this.cfg.qdata[tidx][didx];
            return {"type":type, "data":ques};
        },

        getNextUser:function() {
            if(this.clients.length != 0)
            {
                var idx = (++this.info.uIdx) % this.clients.length;
                this.info.uIdx = idx;
                return this.clients[idx].user;
            }
            else
            {
                return null;
            }
        },

        resetGameInfo:function() {
            var info = this.info;
            info.time = 0;
            info.round = 0;
            info.uIdx = -1;
            info.user = null;
            info.question = {"type": null, "data": null};
            info.status = 0;
            info.rUserCount = 0;
            info.rUser = null;
        },

        processQuestion:function() {
            if(this.isQuestionOver())
            {
                this.endQuestion();
            }
            else
            {
                this.broadcastEvent("processQuestion", {"time":this.cfg.time-this.info.time});
            }

            if(this.info.time == 8)
            {
                this.broadcastEvent("hint", this.info.question.data.length +"个字");
            }

            else if(this.info.time == 16)
            {
                this.broadcastEvent("hint", "类型："+this.info.question.type);
            }
        },

        startGameRound:function(){
//            var self = this;
            if(this.info.round == this.cfg.round)
            {
                console.log("use end");
                this.endGameRound();
                return;
            }
            else {
                console.log("gaming...");
            }

            this.info.status = 1;
            this.info.round ++;
            this.broadcastMsg("--第"+(this.info.round) +"回合开始--");
            this.startQuestion();
        },

        startQuestion:function() {
//            var self = this,
            var info = this.info;
            info.time = 0;
            info.status = 1;
            info.question = this.getRandQuestion();
            info.user = this.getNextUser();
            info.rUserCount = 0;
            info.rUser = null;
            this.broadcastEvent("startQuestion", [info, this.cfg.time, this.cfg.round]);
            this.doQuestionReady();
        },

        doQuestionReady:function(){
            var time = 5, self = this;
            this.io.emit("questionReady", time);
            this.tHand = setInterval(function () {
                if(time < 0)
                {
                    clearInterval(self.tHand);
                    self.tHand = setInterval(function() {
                        self.info.time++;
                        self.processQuestion();
                    }, 1000);
                }

                else
                {
                    self.io.emit("questionReady", --time);
                }
            }, 1000)
        },

        isQuestionOver:function() {
            return this.info.status == 1 && (this.isAllRight() || this.info.time == this.cfg.time);
        },

        endQuestion: function () {
            var self = this;
            clearInterval(this.tHand);
            this.info.status = 2;

            var t = 3;
            this.broadcastEvent("endquestion");
            self.tHand = setInterval(function() {
                t--;
                if(t == 0)
                {
                    if(self.info.uIdx != self.clients.length-1)
                    {
                        self.startQuestion();
                    }
                    else
                    {
                        self.startGameRound();
                    }
                }
            }, 1000);
        },

        endGameRound:function()
        {
//            console.log("end");
            clearInterval(this.tHand);
            this.resetGameInfo();
            this.broadcastEvent("gameover", this.getAllUser());
        },

        isAllRight:function()
        {
            return this.clients.length - 1 == this.info.rUserCount;
        },

        getAward:function(user) {
            var result = 0;
            if(user.uname != this.info.user.uname)
            {
                this.info.rUserCount ++;
                if(this.info.rUserCount == 1)
                {
                    result = 2;
                }
                else
                {
                    result = 1;
                }
            }

            return result;
        }
    };

    new Server().listen(9000);
}());