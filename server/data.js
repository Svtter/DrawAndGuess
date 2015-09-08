/**
 * Created by svtter on 2015/9/4.
 */

(function() {
    var _gameConfig = {
        "time":60,
        "round":2,
        "qtype":["成语", "职业","动物","动漫人物"],
        "score":[3,2,1],
        "qdata":[
            ["天人合一", "五体投地", "亡羊补牢", "掩耳盗铃", "一寸光阴一寸金"],
            ["教师", "学生", "程序员", "歌手", "驯兽师", "模特", "演员"],
            ["老鼠", "老虎", "蟑螂", "蚂蚁", "老鹰", "蟒蛇", "兔子"],
            ["蜡笔小新","奥特曼", "蜡笔小新", "葫芦娃", "超人", "钢铁侠", "孙悟空", "铁臂阿童木"]
        ]
    };

    var _gameInfo = {
        "uIdx":-1,
        "user":null,
        "question":{"type":null, "data":null},
        "time":0,
        "round":0,
        "status":0,
        "rUserCount":0,
        "rUser":null
    };

    exports.gameData = function()
    {
        return {
            "cfg":_gameConfig,
            "info":_gameInfo
        };
    };
}());
