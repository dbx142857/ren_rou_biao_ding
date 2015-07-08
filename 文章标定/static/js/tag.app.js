/**
 * Created by john<dbx142857@gmail.com> on 03/27/15.
 *
 * Variable prefixes' meanings:
 * -------------------------------------------------------------------------
 * --- The prefix of a variable's name reveals the type of data it holds ---
 * -------------------------------------------------------------------------
 *
 * a: Array
 * a: Array
 * b: Boolean
 * d: DOM
 * f: Function
 * l: List(an array-like object)
 * n: Number
 * o: Object
 * r: Regular expression
 * s: String
 * x: More than one type
 *  : Special case or NOT my code
 *
 * *** These prefixes can be concatenated to indicate that the variable can
 *         hold the specified types of data ***
 */

(function($){
    'use strict';
    var APP_CONFIG={

        },
        TYPE_DESIGN=[
            //,
            {
                NAME:'img',
                CHINESE_NAME:"图片",
                SELECT_TYPE:2,//2为单击操作
                TYPE:'array',
                NOTE:'请单击你认为属于正文的图片,将在右侧显示，再次单击该图片将从右侧移除该图片',
                ITEM_ALREADY_EXIST:'亲，这张图片已经存在了哦',
                AUTO_FIND:function($context){
                    return ['http://static.bootcss.com/www/assets/img/codeguide.png'];
                },
                GET_TPL_BY_DATA:function(data){
                    var str='';
                    for(var i in data){
                        str+='<img class="result-area-item" width="160" height="90" src="'+data[i]+'"/>';
                    }
                    return str;
                },
                ON_ITEM_CLICK:function(){
                    return 'delete';
                }
            },
            {
                NAME:'title',
                CHINESE_NAME:"标题",
                SELECT_TYPE:1,//1为选取字符串
                TYPE:'string',
                NOTE:'请用鼠标选中文字，然后松开鼠标，作为标题的标定结果.标定结束后，请你再次确认标定结果是否正确(可以按下回车键确认正确)',
                AUTO_FIND:function($context){            //获取到的为原始数据，比如字符串或者是图片src的数组集合
                    return $context.find('title').eq(0).text();
                },
                GET_TPL_BY_DATA:function(data){//将获取到的原始数据转换为对应的模板
                    return "<p><b>"+data+"</b></p>";
                }
            },{
                NAME:'content',
                CHINESE_NAME:"正文",
                SELECT_TYPE:1,
                TYPE:'string',
                NOTE:'请用鼠标选中文字，然后松开鼠标，作为正文的标定结果.标定结束后，请你再次确认标定结果是否正确',
                AUTO_FIND:function($context){
                    return '<p>hello world</p><p>hello world</p>';
                },
                GET_TPL_BY_DATA:function(data){
                    var arr=data.split('\n'),str='';
                    for(var i in arr){
                        str+='<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+arr[i]+'</p>';
                    }
                    return str;
                }
            }
        ];

angular.module('tag.app',['ngSanitize','tag.api'])
    .factory('lib',lib)
    .directive('stripStyles',stripStyles)
    .directive('responseEnterAction',responseEnterAction)
    .directive('responseEscAction',responseEscAction)
    //.directive('responseKeyAction',responseKeyAction)
    .directive('responseSpaceAction',responseSpaceAction)
    .constant('APP_CONFIG',APP_CONFIG)
    .constant('TYPE_DESIGN',TYPE_DESIGN)
    .factory('articleSystem',articleSystem)
    .controller('UserTaskController',UserTaskController)







    //function responseKeyAction(){
    //    return {
    //        restrict: 'E',
    //        scope:{},
    //        controller:function($scope){
    //            this.addPane = function(pane){
    //                alert('hello');
    //            }
    //        }
    //    };
    //}
    function responseSpaceAction(){
        return {
            restrict: 'A',
            link: function (scope, el, attrs){
                var service=scope.lib.getActionByDirectiveValue(scope,attrs.responseSpaceAction);
                $(el).on('keydown',function(event){
                    if(event.keyCode===32){
                        service();
                    }

                })
            }
        };
    }
    function responseEnterAction(){
        return {
            restrict: 'A',
            link: function (scope, el, attrs){
                var service=scope.lib.getActionByDirectiveValue(scope,attrs.responseEnterAction);
                $(el).on('keydown',function(event){
                    if(event.keyCode===13){
                        service();
                    }

                })
            }
        };
    }

    function responseEscAction(){
        return {
            restrict: 'A',
            link: function (scope, el, attrs){
                var service=scope.lib.getActionByDirectiveValue(scope,attrs.responseEscAction);
                $(el).on('keydown',function(event){
                    if(event.keyCode===27){
                        service();
                    }

                })
            }
        };
    }


    function stripStyles(){
        return {
            restrict: 'A',
            scope: {
                div: '@'
            },
            link: function (scope, element, attrs) {
                scope.$watch('div', function (newValue, oldValue) {
                    $(element)
                        .find('.treeimg *')
                        .removeClass()
                        .attr('style', '');
                });
            }
        };
    }
    function lib(){
        return {
            getActionByDirectiveValue:function(scope,val){
                var str=val.split('.'),service=scope;
                for(var i=0;i<str.length;i++){
                    service=service[str[i]];
                }
                return service;
            },
            getSelectionText:function() {
                var text = "";
                if (window.getSelection) {
                    text = window.getSelection().toString();
                } else if (document.selection && document.selection.type != "Control") {
                    text = document.selection.createRange().text;
                }
                return text;
            },
            upDimension:function (oneDimensionArray) {
                var twoDemensionArray = [],
                    i, len;

                if (angular.isArray(oneDimensionArray)) {
                    len = oneDimensionArray.length;

                    for (i = 0; i < len; i += 1) {
                        twoDemensionArray.push([oneDimensionArray[i]]);
                    }
                }

                return twoDemensionArray;
            },
            stripImgSrcFromHTML:function (rawHTML) {
                var initResult = rawHTML.match(
                    /[http\:|https\:]*\/\/[a-zA-Z0-9\/\.\:\-\_]+/g);
                return initResult.length > 0 ? initResult[0] : '';
            }
        }
    }

    function articleSystem(){
        function returnFun($scope, $rootScope,$sce){
            var o={
                onEnterKeyPress:function(){
                    o.bIsCurrentTaskEnd===true?
                        o.submitCurrentTask(): o.enterNextSelecting();
                },
                sWinHeight:(function(){
                   $(window).resize(function(){
                       $scope.articleSystem.sWinHeight=document.documentElement.clientHeight+'px';
                       $scope.$apply();
                   })
                    return document.documentElement.clientHeight+'px';
                })(),
                jqAlertBox:$('#alertBox'),
                jqContext:$('#context'),
                jqResultArea:function(){
                    return $('#resultArea');
                },
                nCompleteTaskNum:0,
                nWizardIndex:0,
                oCurrentType:$scope.TYPE_DESIGN[0],
                currentTypeValue:null,
                bIsSelectingTime:false,
                bIsCurrentTaskEnd:false,
                result:{

                },
                enterNextSelecting:function(){
                    o.jqResultArea().removeClass('hightlight-result-area');
                    o.bIsSelectingTime=false;
                    o.hideAlert(function(){
                        if(o.nWizardIndex===$scope.TYPE_DESIGN.length-1){
                            o.bIsCurrentTaskEnd=true;
                            $scope.$apply();
                        }
                        else{
                            o.nWizardIndex+=1;
                            o.oCurrentType=$scope.TYPE_DESIGN[o.nWizardIndex];
                            o.setCurrentTypeValue();
                        }
                    })
                },
                highlightResultArea:function(){
                    o.jqResultArea().addClass('hightlight-result-area');
                    setTimeout(function(){
                        o.jqResultArea().removeClass('hightlight-result-area');
                    },200,function(){
                        setTimeout(function(){
                            o.jqResultArea().addClass('hightlight-result-area');
                        },200)
                    })
                },
                registerMouseUpEvent:function(){
                    o.jqContext.mouseup(function(e){
                        if(o.bIsSelectingTime){
                            var str=$scope.lib.getSelectionText();
                            if(o.oCurrentType.TYPE==='string'){
                                if(str.trim()!==''){
                                    o.highlightResultArea();
                                    o.setCurrentTypeValue(str);
                                }
                            }
                            else if(o.oCurrentType.TYPE==='array'){
                                o.setCurrentTypeValue(o.result[o.oCurrentType.NAME],e);
                            }

                        }
                        console.log('亲，看一下result吧：', o.result);7
                    })

                },
                initialResult:function(){
                    o.result={};
                  var D=$scope.TYPE_DESIGN;
                    for(var i in D){
                        var item=D[i];
                        if(item.TYPE==='string'){
                            if(!angular.isUndefined(item.AUTO_FIND)){
                                o.result[item.NAME]=item.AUTO_FIND(o.jqContext);
                            }
                            else{
                                o.result[item.NAME]='';
                            }
                        }
                        else if(item.TYPE==='array'){
                            if(!angular.isUndefined(item.AUTO_FIND)){
                                o.result[item.NAME]=item.AUTO_FIND(o.jqContext);
                            }
                            else{
                                o.result[item.NAME]=[];
                            }
                        }
                  }
                    o.setCurrentTypeValue();
                },
                setCurrentTypeValue:function(value,e){
                    var item= o.oCurrentType;
                    if(!angular.isUndefined(value)){
                        if(item.TYPE==='string'){
                            o.result[item.NAME]=value;
                        }
                        else if(item.TYPE==='array'){
                            var $tar=$(e.target);
                            if(e.target.nodeName.toLowerCase()==='img'){
                                var arr= o.result[o.oCurrentType.NAME];
                                var src=$tar.attr('src');
                                if($.inArray(src,arr)!==-1){
                                    o.notice(o.oCurrentType.ITEM_ALREADY_EXIST);
                                }
                                else{
                                    arr.push(src);
                                    var oft=$tar.offset(),
                                        resultAreaOft= o.jqResultArea().offset();
                                    var jqResultArea= o.jqResultArea();
                                    //jqResultArea.fadeOut(200,function(){
                                        var $obj=$tar.clone()
                                            .appendTo($('body').css({
                                                position:'relative'
                                            }))
                                            .css({
                                                position:'absolute',
                                                left:oft.left+'px',
                                                top:oft.top+'px',
                                                zIndex:'10000'
                                            })
                                            .animate({
                                                left:resultAreaOft.left+'px',
                                                top:resultAreaOft.top+'px',
                                                width:'160px',
                                                height:'160px',
                                                opacity:'0'
                                            },100,function(){
                                                $obj.remove();
                                                jqResultArea.fadeIn(200,function(){
                                                    jqResultArea.animate({ scrollTop: jqResultArea[0].scrollHeight}, 200);
                                                });
                                            })
                                    //})
                                }

                            }
                        }
                        //o.result[item.NAME]
                    }
                    o.currentTypeValue=item.GET_TPL_BY_DATA(o.result[item.NAME]);
                    o.refreshResultArea();
                    $scope.$apply();
                },
                refreshResultArea:function(){
                    $(o.currentTypeValue).appendTo(o.jqResultArea().html(''));
                },
                notice:function(content,variable,autoHide){
                    if(angular.isUndefined(autoHide)){
                        autoHide=true;
                    }
                    if(!angular.isUndefined(variable)){
                        $scope.articleSystem.notice(content,variable);
                    }
                    else{
                        o.jqAlertBox
                            .stop()
                            .animate({
                                top:'-52px'
                            },200,function(){
                                o.jqAlertBox
                                    .html(content)
                                    .animate({
                                        top:'0'
                                    },200);
                            })
                        if(autoHide){
                            setTimeout(function(){
                                o.hideAlert();
                            },2000);
                        }

                    }
                },
                showNoticeWhenNope:function(){
                    if(o.bIsCurrentTaskEnd===true){
                        return false;
                    }
                    o.bIsSelectingTime=true;
                    o.notice(o.oCurrentType.NOTE,undefined,false);
                },
                hideAlert:function(cb){
                    o.jqAlertBox
                        .stop()
                        .animate({
                            top:'-52px'
                        },300,function(){
                            if(!angular.isUndefined(cb)){
                                cb();
                            }
                            //if(o.bIsSelectingTime===true){
                            //    o.showNoticeWhenNope();
                            //}
                        })
                },
                login:function (user) {
                    if (!angular.isUndefined(user)&& !angular.isUndefined(user.username)) {
                        $scope.GeneralService.login(user.username, user.password || '')
                            .then(function (data) {
                                $scope.StatusChecker.check(data['status'], data)
                                    .pass(function (data) {
                                        console.log('it is pass!', data);
                                        $scope.user.realName = data['realname'];
                                        o.getTVC();
                                    })
                                    .invalidCredential(function (data) {
                                        $scope.loginError = true;
                                        console.log('invalid credential!', data);
                                    })

                            })
                            .catch(function (error) {
                                $scope.tagSystem.notice('Controller.login', error);
                            });
                    }
                },
                logout : function () {

                    $scope.GeneralService.logout()
                        .then(function (data) {
                            $scope.StatusChecker.check(data['status'], data)
                                .pass(function (data) {
                                    location.reload();
                                });
                        })
                        .catch(function (error) {
                            location.reload();
                        });

                },
                initialKeyVar:function(){
                    o.nWizardIndex=0;
                    o.oCurrentType=$scope.TYPE_DESIGN[0];
                },
                submitCurrentTask:function(){
                    o.nCompleteTaskNum+=1;
                    o.initialKeyVar();
                    o.getTVC();
                },
                getTVC:function(){
                    o.bIsCurrentTaskEnd=false;
                    o.notice('正在加载文章，请稍后...',undefined,false);
                    $.ajax({
                        type: "Get",
                        url: "./getArticle1.txt",
                        success: function (result) {
                                try
                                {

                                    result=result.replace('<script>','<a>');
                                    result=result.replace('</script>','</a>');
                                    var $res=$(result);
                                    $res.find('#goTop').remove();
                                    $res.find('.goTop').remove();
                                    $res.appendTo(o.jqContext);
                                    o.initialResult();
                                }
                                catch(e)
                                {
                                    o.initialResult();
                                }
                                setTimeout(function(){
                                    o.hideAlert(function(){
                                        if(o.nCompleteTaskNum===0){
                                            o.notice('亲，请根据右侧指示完成标定操作哦（按回车键执行下一步操作，空格键进入当前任务标定操作,esc键隐藏通知区域）',undefined,false);
                                        }
                                    });
                                },1000);
                        }
                    });


                },
                loadNextTask:function () {

                    if ($scope.tasks && angular.isArray($scope.tasks) && $scope.tasks.length > 0) {

                        //if this is not loading the first task,
                        //then remove the first item in task list
                        if ($scope.currentTask) {
                            $scope.tasks.shift();
                        }
                        //and assign current task to the new head
                        //if the last one just got removed, make another getTVC call.
                        if ($scope.tasks.length > 0) {
                            $scope.currentTask = $scope.tasks[0];
                            $scope.currentTask.startTime = (new Date()).getTime();
                        } else {
                            getTVC();
                        }
                    }

                },
                checkUserLoginStatus:function(){

                    $scope.GeneralService.userinfo()
                        .then(function (data) {

                            $scope.StatusChecker.check(data['status'], data)
                                .pass(function (data) {
                                    $scope.user = {};
                                    $scope.user.realName = data['realname'];
                                    o.getTVC();
                                })
                                .otherwise(function (data) {
                                    // $scope.logout();

                                })
                        });
                },
                init:function(){
                    o.checkUserLoginStatus();
                    o.registerMouseUpEvent();
                    $scope.$watch(function(){
                        return o.currentTypeValue;
                    },function(nv,ov){
                        setTimeout(function(){
                            var jqResultArea=o.jqResultArea(),
                                id=jqResultArea.attr('id');
                            jqResultArea
                                .off('click')
                                .on('click',function(e){
                                    var $tar=$(e.target),$item=$tar.closest('.result-area-item');
                                    if($item.size()){
                                        var cmd= o.oCurrentType.ON_ITEM_CLICK();
                                        if(cmd==='delete'){
                                            o.result[o.oCurrentType.NAME].splice($item.index(),1);
                                            $scope.$apply();
                                            $item.fadeOut('fast',function(){
                                                $item.remove();
                                            })
                                        }
                                    }
                                })
                        },500)
                    })

                }
            };
            o.init();
            return o;
        }
        return returnFun;
    }


    UserTaskController.$inject=['$scope', 'GeneralService', 'StatusChecker', 'CONFIG', '$rootScope','articleSystem','lib','APP_CONFIG','TYPE_DESIGN','$sce'];
    function UserTaskController($scope, GeneralService, StatusChecker, CONFIG, $rootScope,articleSystem,lib,APP_CONFIG,TYPE_DESIGN,$sce){
        $scope.GeneralService=GeneralService;
        $scope.StatusChecker=StatusChecker;
        $scope.CONFIG=CONFIG;
        $scope.TYPE_DESIGN=TYPE_DESIGN;
        $scope.lib=lib;
        $scope.articleSystem=articleSystem($scope,$rootScope,$sce);
        $scope.APP_CONFIG=APP_CONFIG;



        $scope.UILock = false;

        $scope.$on('lock', function (event, data) {
            $scope.UILock = true;
        });

        $scope.$on('unlock', function (event, data) {
            $scope.UILock = false;
        });
    }



})(jQuery)