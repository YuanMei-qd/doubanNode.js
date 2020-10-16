var express = require('express');
var app = express();
var mysql = require('mysql');
//链接数据库
var connection = mysql.createConnection({ //创建连接对象
    host: 'localhost', //主机地址
    user: 'root',//用户名
    password: '123',//密码
    port: '3306',//端口号
    database: 'douban',//数据库名称
})
connection.connect()
//设置跨域访问
app.all('*', function (req, res, next) {
    res.header("X-Powered-By", ' 3.2.1')
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Content-Type", "application/json;charset=utf-8");
    res.header("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    next();
}); 

// router.all('*', function (req, res, next) { // '*'代表所有的访问者都能访问(解决跨域问题)

// });

//查找
app.get('/getSource', function (req, res) {
    connection.query('select * from allWorks', function (err, rows, fields) {
        if (err) throw err;
        rows.sort((a,b) => {
            return a.code - b.code
        })
        console.log(rows);
        res.send(
            {
                status: 200,
                data: rows
            }
        );
    });
});

//修改评分
app.post('/score/update', function (req, res) {
    console.log(req.query)
    connection.query(`update allWorks set score=${req.query.score} where code="${req.query.code}"`, function (err, result) {
        if (err) throw err;
        console.log(result);
        res.send("sucess")
    });
});

//添加作品
app.post('/source/add', function (req, res) {
    // console.log(req.query)
    req.on('data', function (data) {
        obj = JSON.parse(data);
        console.log(obj);
        connection.query('select * from allWorks', function (err, rows, fields) {
            rows.forEach(item => {
                if (Number(item.code) === obj.code) {
                    res.send({
                        status: 3001,
                        data: "数据错误"
                    });
                    return;
                }
            });

            connection.query(`insert into allWorks set ?`,obj,(err, result) => {
                if (err) {
                  console.log('[增加失败] - ', err.message);
                  return;
                } else{
                    console.log(result)
                }
                res.send('数据已接收')
            })
        });
      
    })

});

//删除作品
app.delete('/source/delete', function(req, res){
    console.log(req.query)
    connection.query(`delete from allWorks where code="${req.query.code}"`,function(err,rows){
        if(err){
            res.send("删除失败"+err);
        } else{
            res.send("删除成功")
        }
    });
});

//根据类型查找
// let type = ["2","1"]
app.get('/getSource/type', function (req, res) {
    // console.log(req.query.type);
    let type = req.query.type;
    if(type){
            // console.log(req.query.type);
        let selectString = `type=${type[0]}`;
        type.shift();
        type.forEach(item => {
            selectString = selectString +` or type=${item}`
        });
        console.log(selectString)
        connection.query(`select * from allWorks where ${selectString}`, function (err, rows, fields) {
            if (err) throw err;
            rows.sort((a,b) => {
                return a.code - b.code
            })
            console.log(rows);
            res.send(
                {
                    status: 200,
                    data: rows
                }
            );
        });
    } else{
        res.send(
            {
                status: 200,
                data: []
            }
        );
    }
   
});

//验证登录名密码
app.post('/login', function (req, res) {
    // console.log(req.query)
    connection.query(`select * from userMessage where userName="${req.query.userName}"`, function (err, result) {
        if (err) throw err;
        // console.log( "result",result[0]);
        if(result[0].password === req.query.password){
            // console.log( "result",result);
            if(Object.values(result[0])[0]){
                res.send({
                    sucess:true,
                    ...result[0]
                })
            } else{
                res.send({
                    sucess:false
                })
            }
        } else{
            res.send({
                sucess:false
            })
        }       
    });
});

//用户评价作品
app.post('/user/setScore', function (req, res) {
    // console.log(req.query)
    req.on('data', function (data) {
        obj = JSON.parse(data);
        console.log(obj);
        connection.query(`select workCode from user_work where userName = "${obj.userName}" and workCode = "${obj.workCode}"`, function (err, rows, fields) {
            console.log(rows);
            if(rows.length === 0){
                connection.query(`select id from user_work order by id desc`, function (err, rows, fields) {
                    obj.id = rows[0].id + 1;
                    connection.query(`insert into user_work set ?`,obj,(err, result) => {
                        if (err) {
                          console.log('[增加失败] - ', err.message);
                          return;
                        } else{
                            console.log(result)
                        }
                        res.send('数据已接收')
                    })
                })
            } else{
                connection.query(`update user_work set score=${obj.score} where userName="${obj.userName}" and workCode = "${obj.workCode}"`, function (err, result) {
                    if (err) throw err;
                    console.log(result);
                    res.send("sucess")
                });
            }
        });
      
    })

});

//根据用户名查找评价过的作品
app.get('/user/getSource', function (req, res) {
    console.log(req.query.userName)
    connection.query(`select * from allworks where code in (SELECT workCode from user_work where userName = ${req.query.userName})`, function (err, rows, fields) {
        if (err) throw err;
        console.log(rows);
        res.send(
            {
                status: 200,
                data: rows
            }
        );
    });
});

//根据用户名及作品号查找作品成绩
app.get('/userCode/getSource', function (req, res) {
    console.log(req.query.userName)
    connection.query(`select * from user_work where userName = ${req.query.userName} and workCode = ${req.query.workCode}`, function (err, rows, fields) {
        if (err) throw err;
        // console.log(rows[0].score);
        res.send(
            {
                status: 200,
                data:rows[0].score
            }
        );
    });
});

//配置服务端口
var server = app.listen(4000, function () {
    console.log(server.address().address)
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
})