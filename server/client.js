/**
 * Created by svtter on 2015/9/2.
 */

(function() {
    //定义客户端操作对象
    var Client = function(server, socket) {
        //绑定服务器
        this.srv = server;
        //绑定socket
        this.so = socket;
        //用户信息
        this.user = {"uname":null, "level":0, "score":0};
        this.bindEvent();
    };

    Client.prototype = {
        toString: function () {
            return "[uname:" + this.user.uname + ", sid:" + this.so.id + "]";
        },

        //绑定事件
        bindEvent: function () {
            if(this.so) {
                var self = this;
                this.so.on("disconnect", function () {
                    self.doDisconnect();
                });
                this.so.on("login", function (data, fn) {
                    self.doLogin(data, fn)
                });
                this.so.on("gameStart", function (data, fn) {
                    self.doGameStart(data, fn)
                });
                this.so.on("message", function (msg) {
                    self.doMsg(msg);
                });
                this.so.on("startDraw", function (data) {
                    self.broadcastStartDraw(data);
                });
                this.so.on("drawing", function (data) {
                    self.broadcastDrawing(data);
                });
                this.so.on("paintUpdate", function (data) {
                    self.broadcastPaintUpdate(data);
                });
                this.so.on("exit", function (data) {
                    self.doExit(data);
                });
            }
        },

        //处理断开连接
        doDisconnect: function () {
            this.srv.removeClientByID(this.so.id);
            this.srv.updateUserInfo();
        },

        //处理已经开始好游戏事件
        doGameStart: function (data, fn) {
            this.srv.startGameRound();
            fn();
        },

        //处理用户登录
        doLogin: function (data, fn) {
            if (data) {
                this.user.uname = data.uname;
                var isExists = this.srv.isUserExists(this);
                //通知客户端
                if (!isExists) {
                    fn(0);
                    this.srv.updateUserInfo();
                }
                else {
                    var result = 1;
                    if (this.srv.info.status != 0) {
                        result = 2;
                    }
                    fn(result);
                    this.so.disconnect("unauthorized");
                    this.srv.removeClientByID(this.so.id);
                }
            }
        },

        doMsg: function (msg)
        {
            var gInfo = this.srv.info, m = msg;
            if(gInfo.status == 1 && this.srv.isRightAnswer(m))
            {
                m = "*";
                var award = this.srv.getAward(this.user);
                if(award > 0)
                {
                    var awd = [];
                    this.user.score += award;
                    awd.push({"user":this.user, "awd":award});
                    if(this.srv.info.rUserCount == 1)
                    {
                        this.srv.info.user.score += 3;
                        awd.push({"user":this.srv.info.user, "awd":3});
                    }
                    this.srv.broadcastEvent("award", awd);
                }
            }
            this.srv.broadcastMsg("用户" + this.user.uname + "说：" + m);
        },

        broadcastStartDraw: function(data)
        {
            this.so.broadcast.emit("startDraw", data);
        },

        broadcastDrawing:function(data) {
            this.so.broadcast.emit("drawing", data);
        },


        broadcastPaintUpdate:function(data)
        {
            this.so.broadcast.emit("paintUpdate", data);
        },

        doExit:function()
        {
            console.log("exit.");
        }
    };

    exports.newClient = function(server, socket)
    {
        return new Client(server, socket);
    }

}());
