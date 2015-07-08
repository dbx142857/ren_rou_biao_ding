String.prototype.replaceAll = function( token, newToken, ignoreCase ) {
    var _token;
    var str = this + "";
    var i = -1;

    if ( typeof token === "string" ) {

        if ( ignoreCase ) {

            _token = token.toLowerCase();

            while( (
                i = str.toLowerCase().indexOf(
                    token, i >= 0 ? i + newToken.length : 0
                ) ) !== -1
                ) {
                str = str.substring( 0, i ) +
                newToken +
                str.substring( i + token.length );
            }

        } else {
            return this.split( token ).join( newToken );
        }

    }
    return str;
};


(function(){
    'use strict';
    angular.module('tag.app',['ngSanitize','ngAnimate','tag.api'])
        .directive('responseEnterAction', responseEnterAction)
        .directive('responseEscAction', responseEscAction)
        .directive('responseKeyAction', responseKeyAction)
        .factory('ajaxService',ajaxService)
        .factory('mainService',mainService)
        .controller('taskController',taskController);

    function responseKeyAction() {
        return {
            restrict: 'EA',
            scope: {},
            controller: function ($scope) {
                this.registerKeyEvent = function (code, directiveValue, el) {
                    var scope = $scope.$parent;
                    var getActionByDirectiveValue=function (scope, val) {
                        var str = val.split('.'), service = scope;
                        for (var i = 0; i < str.length; i++) {
                            service = service[str[i]];
                        }
                        return service;
                    }
                    var service = getActionByDirectiveValue(scope, directiveValue);
                    $(el).on('keydown', function (event) {
                        if (event.keyCode === code) {
                            service();
                            event.stopImmediatePropagation();
                            return false;
                        }

                    })
                }
            }
        };
    }


    function responseEnterAction() {
        return {
            require: '^?responseKeyAction',
            link: function (scope, el, attrs, responseKeyActionController) {
                responseKeyActionController.registerKeyEvent(13, attrs.responseEnterAction, el);
            }
        };
    }

    function responseEscAction() {
        return {
            require: '^?responseKeyAction',
            link: function (scope, el, attrs, responseKeyActionController) {
                responseKeyActionController.registerKeyEvent(27, attrs.responseEscAction, el);
            }
        };
    }



    taskController.$inject=['$scope','$animate','$sce','$http','ajaxService','mainService','GeneralService','StatusChecker','CONFIG'];
    function taskController($scope,$animate,$sce,$http,ajaxService,mainService,GeneralService,StatusChecker,CONFIG){
        $scope.CONFIG=CONFIG;
        $scope.task_submitted=null;

        var urid=null;
        var gettvc_time=null;
        var $leftPanel=$('#leftPanel');
        
        var convert=function(str,links){
            var delIndexArr=[];

            for(var i= 0;i<$scope.linkStrs.length;i++){
                for(var j=0;j<$scope.linkStrs.length;j++){
                    if(i!==j){
                        var obj1=$scope.linkStrs[i],obj2=$scope.linkStrs[j];
                        //console.log('obj1,obj2,i,j',obj1,obj2,i,j);
                        if(obj1.indexOf(obj2)!==-1&&delIndexArr.indexOf(j)===-1){
                            delIndexArr.push(j);

                        }
                    }
                }
            }
            var count=0;
            for(var i in delIndexArr){
                var j=delIndexArr[i];
                $scope.linkStrs.splice(j-count,1);
                $scope.links.splice(j-count,1);
                count++;
            }
            //console.log('delIndexArr',delIndexArr)
            //console.log('$scope.linkStrs',$scope.linkStrs);
            //console.log('$scope.links',$scope.links);
            jQuery.each(links,function(k,v){
                str=str.replaceAll(v.str,"<a href='"+ v.link+"'>"+ v.str+"</a>");
            })
            return str;
        }
        $scope.editingLinks={
            str:null,
            link:null
        }

        $scope.mainService=mainService;

        $scope.links=[
        //    {
        //    str:'门前',
        //    link:'http://www.baidu.com/'
        //},{
        //    str:'游过',
        //    link:'http://www.baidu.com/'
        //},{
        //    str:'真呀真多',
        //    link:'http://www.baidu.com/'
        //},{
        //    str:'中国',
        //    link:'a.com'
        //},{
        //    str:'中国巨幕',
        //    link:'b.com'
        //},{
        //    str:'中国巨幕最牛逼',
        //    link:'c.com'
        //},{
        //    str:'中国巨幕最牛逼哄哄',
        //    link:'d.com'
        //}
        ];
        var setLinkStrs=function(){
            $scope.linkStrs=[];
            jQuery.each($scope.links,function(k,v){
                $scope.linkStrs.push(v.str);
            })
        }
        setLinkStrs();
        $scope.input="";
        //中国巨幕最牛逼哄哄中国巨幕最牛逼门前大桥下,游过一群鸭, 快来快来数一数,二四六七八 ,嘎嘎嘎嘎，真呀真多呀，数不清到底多少鸭，数不清到底多少鸭~~~赶鸭老爷爷，胡子白花花，唱呀唱着家乡戏，还会说笑话，小孩，小孩，快快上学校，别考个鸭蛋抱回家，别考个鸭蛋抱回家~~~

        $scope.convert=function(){
            $scope.output=convert($scope.input,$scope.links);
        }

        //$scope.$watch($scope.input,function(nv,ov){
        //    //$scope.output=convert($scope.input,$scope.links);
        //})
        $scope.handleSelection=function(e){
            if(mainService.isFocus){
                setTimeout(function(){
                    var str=mainService.getSelectionText(e).trim();
                    console.log('str issssssssss:',str);
                    if(str!==''){
                        mainService.selectedStr=str;
                    }
                    else{
                        mainService.selectedStr=null;
                    }

                    $scope.convert();
                    if(str!==''){
                        var $obj=$('#selected_str_textarea');
                        $obj.css({
                            borderColor:'red'
                        })
                        setTimeout(function(){
                            $obj.css({
                                borderColor:'#ccc'
                            })
                        },100);
                        //jQuery(e.target).blur();
                        //jQuery('#link_input').focus();
                    }


                    $scope.$apply();
                },100);
            }

            return false;
        }

        $scope.handleEsc=function(){
            mainService.selectedStr=null;
            $scope.$apply();

        }
        $scope.gettvc=function(){
            GeneralService.getTVC()
                .then(function(data){




                    StatusChecker.check(data['status'], data)
                        .pass(function (data) {
                            console.log('gettvc passssssssssss: ', data);












                            gettvc_time=new Date().getTime();
                            $scope.mainService.isLogined=true;
                            $scope.input=data.tvc[0].task_description.data;
                            urid=data.tvc[0].urid;
                            $scope.convert();
                            //$scope.$apply();
                        })
                        .noTask(function (data) {
                            layer.alert('暂时没有任务，请稍候再试');
                            if(data.status==='pass'){return false;}
                            console.log('no task yet!', data);
                        })
                        .not('error', function (data) {
                            if(data.status==='pass'){return false;}
                            layer.alert('暂时没有任务或者未知错误，如有问题，请联系系统管理员')
                        })
                        .otherwise(function (data) {
                            if(data.status==='pass'){return false;}
                            console.log('gettvc otherwise: ', data);
                            layer.alert('暂时没有任务或者未知错误，如有问题，请联系系统管理员')
                        });













                })
            //console.log('it is pass!', data);
            //$scope.user.realName = data['realname'];
            //o.getTVC();
        }
        $scope.submit=function(){

            GeneralService.login($scope.mainService.user.logname, $scope.mainService.user.logpwd || '')
                .then(function(data){
                    console.log('login e is:',data);
                    StatusChecker.check(data['status'], data)
                        .pass(function (data) {
                            //localStorage.setItem('user',JSON.stringify(data));
                            console.log('login data:',data);
                            $scope.gettvc();
                        })
                        .invalidCredential(function (data) {
                            //$scope.loginError = true;
                            console.log('invalid credential!', data);
                            layer.alert('用户名错误或未知错误，请联系管理员');
                        })
                    //if(e.status==='pass'){

                    //}
                })
                .catch(function (error) {
                    layer.alert(error);
                });
        }
        GeneralService.userinfo()
            .then(function (data) {

                StatusChecker.check(data['status'], data)
                    .pass(function (data) {

                        $scope.mainService.isLogined=true;
                        $scope.gettvc();
                        //$scope.user = {};
                        //$scope.user.realName = data['realname'];
                        //o.getTVC();
                    })
                    .otherwise(function (data) {
                        // $scope.logout();

                    })
            });
        //if(localStorage.getItem('user')){
        //    mainService.isLogined=true;
        //    $scope.gettvc();
        //}
        //$scope.testfun=function(){
        //    console.log('test')
        //}
        $scope.logout=function(){
            GeneralService.logout()
                .then(function (data) {
                    $scope.StatusChecker.check(data['status'], data)
                        .pass(function (data) {
                            //delete $scope.user;
                            location.reload();
                        });
                })
                .catch(function (error) {
                    //delete $scope.user;
                    location.reload();
                });
        }
        $scope.handleSubmit=function(){

            var links=[];
            for(var i in $scope.links){
                links.push({
                    "entity":$scope.links[i].str,
                    "linking":$scope.links[i].link
                })
            }
            //if(links.length===0){
            //    layer.alert('没有任何标定不能提交哦');
            //    return false;
            //}
            var data={
                urid:urid,
                ur_result:{
                    tags:links
                },
                time_used:(new Date().getTime()-gettvc_time)/1000
            };
            console.log('send data is:',data);
            GeneralService.submitTagTask(data)
                .then(function (data) {
                    StatusChecker.check(data['status'], data)
                        .pass(function (data) {

                            $scope.task_submitted=data.userstat.task_submitted;
                            //layer.alert('恭喜亲标定成功，现在进入下一个任务');

                            $scope.gettvc();
                            $scope.links=[];

                            mainService.selectedStr=null;
                            console.log('res data is:',data);
                            
                            
                            
                            
                            //o.completeTaskNum+=1;
                            //o.loadNextTask();
                        })
                        .invalidCredential(function (data) {
                            //$scope.loginError = true;
                            $scope.logout();
                        })
                        .reSubmitForbidden(function (data) {
                            layer.alert($scope.CONFIG.MESSAGE.RESUBMIT_FORBIDDEN);
                        })
                        .noAuth(function (data) {
                            layer.alert($scope.CONFIG.MESSAGE.NO_AUTH);
                        })
                        .not($scope.CONFIG.STATUS.ERROR, function (data) {
                            //$scope.userStat = data['userstat'];
                        })
                        .otherwise(function (data) {
                            layer.alert($scope.CONFIG.MESSAGE.ERROR);
                            console.log('submitTagTask otherwise: ', data);
                        });
                })
        }
        $scope.deleteCurrentLink=function(index){
            $scope.links.splice(index,1);
            $scope.convert();
        }
        $scope.saveCurrentLink=function(){
            if(mainService.selectedStrLink===null||mainService.selectedStrLink.trim()===''){
                layer.alert('链接不能为空');
                return false;
            }
            if(mainService.selectedStr===null||mainService.selectedStr.trim()===''){
                layer.alert('选中文字不能为空');
                return false;
            }

            var RegExp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
            var the_link=mainService.selectedStrLink.trim();
            if(!RegExp.test(the_link)){
                layer.alert('网址格式不合法');
                return false;
            }

            var link={
                str:mainService.selectedStr,
                link:the_link
            }
            ajaxService.saveTask(link)
                .then(function(e){
                    var isLinkExist=false;
                    for(var i= 0,len=$scope.links.length,items=$scope.links;i<len;i++){
                        var item=items[i];
                        if(item.str===link.str){
                            $scope.links[i]=link;
                            $scope.linkStrs[i]=link.str;
                            isLinkExist=true;
                        }
                    }

                    console.log('$scope.links:',$scope.links);
                    if(!isLinkExist){
                        $scope.links.push(link);
                        $scope.linkStrs.push(link.str);

                    }
                    mainService.selectedStrLink='';
                    $scope.convert();
                    $scope.$apply();
                    //else{
                    //    layer.alert('')
                    //}

                    //setLinkStrs();

                    //mainService.selectedStr=null;
                    //mainService.selectedStrLink=null;
                    //$scope.$apply();
                    //layer.alert('操作成功');
                })
        }
    }

    ajaxService.$inject=['$http'];
    function ajaxService($http){

        var urls={
            saveTask:null
        };
        return {
            saveTask:function(params){
                //return $http.post(urls.saveTask,{params:params});
                return {
                    then:function(cb){
                        cb();
                        mainService.selectedStr=null;
                    }
                }
            }
        }
    }

    mainService.$inject=['$animate'];
    function mainService($animate){
        var o={
            //isSelectingStr:false,
            isLogined:false,
            user:{
                logname:'',
                logpwd:''
            },
            selectedStr:null,
            selectedStrLink:null,
            isFocus:false,
            getSelectionText:function(e){

                if (window.getSelection) {
                    try {
                        var ta = $('#inputarea').get(0);
                        return ta.value.substring(ta.selectionStart, ta.selectionEnd);
                    } catch (e) {
                        console.log('Cant get selection text')
                    }
                }
                // For IE
                if (document.selection && document.selection.type != "Control") {
                    return document.selection.createRange().text;
                }
                //var text = "";
                //if (window.getSelection) {
                //    text = window.getSelection().toString();
                //} else if (document.selection && document.selection.type != "Control") {
                //    text = document.selection.createRange().text;
                //}
                //return text;

                //var selectTxt;
                //if(window.getSelection){
                //    //标准浏览器支持的方法
                //    selectTxt=window.getSelection().toString();
                //}else if(document.selection){
                //    //IE浏览器支持的方法
                //    selectTxt=document.selection.createRange().text;
                //}
                //return selectTxt;

                //if (window.getSelection) {
                //    // This technique is the most likely to be standardized.
                //    // getSelection() returns a Selection object, which we do not document.
                //    return window.getSelection().toString();
                //}
                //else if (document.getSelection) {
                //    // This is an older, simpler technique that returns a string
                //    return document.getSelection();
                //}
                //else if (document.selection) {
                //    // This is the IE-specific technique.
                //    // We do not document the IE selection property or TextRange objects.
                //    return document.selection.createRange().text;
                //}

                //try{
                //    if (window.getSelection) { //chrome,firefox,opera
                //        var range=window.getSelection().getRangeAt(0);
                //        var container = document_createElement_x_x_x_x('div');
                //        container.a(range.cloneContents());
                //        return container.innerText;
                //        //return window.getSelection(); //只复制文本
                //    }
                //    else if (document.getSelection) { //其他
                //        var range=window.getSelection().getRangeAt(0);
                //        var container = document_createElement_x_x_x_x('div');
                //        container.a(range.cloneContents());
                //        return container.innerText;
                //        //return document.getSelection(); //只复制文本
                //    }
                //    else if (document.selection) { //IE特有的
                //        return document.selection.createRange().htmlText;
                //        //return document.selection.createRange().text; //只复制文本
                //    }
                //}
                //catch(e){
                //    var text = "";
                //    if (window.getSelection) {
                //        text = window.getSelection().toString();
                //    } else if (document.selection && document.selection.type != "Control") {
                //        text = document.selection.createRange().text;
                //    }
                //    return text;
                //}


            }
            //,
            //getActionByDirectiveValue: function (scope, val) {
            //    var str = val.split('.'), service = scope;
            //    for (var i = 0; i < str.length; i++) {
            //        service = service[str[i]];
            //    }
            //    return service;
            //}
        }
        //setInterval(function(){
        //    console.log("is fosuc:", o.isFocus);
        //})
        return o;
    }
})();