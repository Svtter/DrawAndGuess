/**
 * Created by svtter on 2015/9/4.
 */

(function() {
    //定义画板对象
    var Painter = {
        //绑定的环境上下文
        ctx: null,
        //宽度
        w: 0,
        h: 0,
        status: 0,
        bColor: null,
        bWidth: null,

        init: function () {
            var can = $("#paintArea")[0];
            this.ctx = can.getContext("2d");
            this.w = can.width;
            this.h = can.height;
            this.setBGColor();
            this.setBrushColor();
            this.setBrushWidth();
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";
            this.initCanvas();
            this.initBrush();
            this.initEraser();
        },

        initBrush: function () {
            var bColor = ["#000000", "#999999", "#FFFFFF", "#FF0000", "FF9900", "#FFFF00",
                "#008000", "#00CCFF", "#0099FF", "#FF33CC", "#CC66FF", "#FFCCCC",
                "#6633FF", "#CCFFCC"];

            var bDiv = $("#ys"),
                self = this;

            for (var i = 0; i < bColor.length; i++) {
                var b = $("<div class='bys'></div>").css("background-color", bColor[i]);
                b.on("click", function () {
                    self.fire("onPaintUpdate", {"color": $(this).css("background-color")});
                });
                bDiv.append(b);
            }
            var bWidth = [2, 8, 16 , 24];
            var bcDiv = $("#bc");
            for (i = 0; i < bWidth.length; i++) {
                var bw = $("<div class='bwid' data-bidx='" + (i) + "'></div>");
                bw.css("background-image", "url(images/bc" + (i + 1) + ".png");
                bw.on("click", function () {
                    self.fire("onPaintUpdate", {"width": bWidth[this.getAttribute("data-bidx")]});
                });
                bcDiv.append(bw);
            }

        },

        initEraser: function () {
            var self = this;
            $("btnClear").click(function () {
                self.clear();
            });

            $("#btnRub").click(function () {
                self.setBrushColor("white");
                self.setBrushWidth(32);
            });
        },

        setBGColor: function (color) {
            this.ctx.fillStyle = color || "white";
            this.ctx.fillRect(0, 0, this.w, this.h);
        },

        setBrushColor: function (color) {
            this.bColor = color || "black";
            this.ctx.strokeStyle = this.bColor;
        },

        setBrushWidth: function(width) {
            this.bWidth = width ||1;
            this.ctx.lineWidth = this.bWidth;
        },

        initCanvas: function () {
            var can = $("#paintArea"),
                self = this;
            can.on("mousedown", function (e) {
                if (!Client.isOperUser()) {
                    return;
                }
                e.preventDefault();
                this.x = e.offsetX;
                this.y = e.offsetY;
                self.fire("onStartDraw", {"x": this.x, "y": this.y});
                // 绑定鼠标移动事件
                can.on("mousemove", function (e)
                {
                    var nx = event.offsetX, ny = event.offsetY;
                    self.fire("onDrawing", {"x": nx, "y": ny});
                    this.x = nx;
                    this.y = ny;
                });
            });

            can.on("mouseup", function () {
                can.off("mousemove");
                self.fire("onDrawEnd");
            });
        },

        clear: function () {
            this.ctx.clearRect(0, 0, this.w, this.h);
        },

        fire: function (eventName, param) {
            if (this[eventName]) {
                this[eventName](param);
            }
        },

        onStartDraw: function (data) {
            this.status = 0;
            this.ctx.beginPath();
            this.ctx.moveTo(data.x, data.y);
            if (Client.isOperUser()) {
                Client.emitStartDraw(data);
            }
        },

        onDrawing: function (data) {
            if (this.status == 0) {
                this.status = 1;
            }
            this.ctx.lineTo(data.x, data.y);
            this.ctx.stroke();
            if (Client.isOperUser()) {
                Client.emitDrawing(data);
            }
        },

        onDrawEnd: function () {
            this.status = -1;
        },

        onPaintUpdate: function (data) {
            var w = data.width || this.bWidth, c = data.color || this.bColor;
            var param = {"width": w, "color": c};
            this.setBrushWidth(w);
            this.setBrushColor(c);
            if (Client.isOperUser()) {
                Client.emitPaintUpdate(param);
            }
        }
    };

    Painter.init();
    window.Painter = Painter;
}());
