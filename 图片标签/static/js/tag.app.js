(function(){


    'use strict';
var TAG_APP_CONFIG={
    MAX_GROUP_SIZE:16,
    MAX_TAG_NAME_LENGTH:12
}
var tagApp=angular.module('tag.app', ['tag.api', 'ui.sortable'])
    .controller('UserTaskController',UserTaskController)
    .factory('lib',lib)
    .directive('stripStyles',stripStyles)
    .directive('responseEnterAction',responseEnterAction)
    .directive('responseTabAction',responseTabAction)
    .constant('TAG_APP_CONFIG',TAG_APP_CONFIG)
    .factory('tagSystem',tagSystem);




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

    function responseTabAction(){
        return {
            restrict: 'A',
            link: function (scope, el, attrs){
                var service=scope.lib.getActionByDirectiveValue(scope,attrs.responseTabAction);
                $(el).on('keydown',function(event){
                    if(event.keyCode===9){
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



function tagSystem(){
  returnFun.$inject=['$scope', '$rootScope'];
  function returnFun($scope, $rootScope){
    var o={
        ifEditingTags:false,
        editingTagIndex:null,
        editingGroupIndex:null,
        currentEditingTagLastName:null,
        jqCurrentEditingTag:null,
        jqCurrentEditingText:null,
        jqAlertBox:$('#alertBox'),
        completeTaskNum:0,
        newTag:{
            name:''
        },
        notice:function(content,variable){
            if(!angular.isUndefined(variable)){
                $scope.tagSystem.notice(content,variable);
            }
            else{
                o.jqAlertBox
                    .html(content)
                    .stop()
                    .animate({
                        top:'0'
                    },300);
                setTimeout(function(){
                    o.hideAlert();
                },1000);
            }
        },
        hideAlert:function(){
            o.jqAlertBox
                .stop()
                .animate({
                    top:'-52px'
                },300)
        },
        clearNewTag:function(){
            o.newTag={name:''};
            $scope.$apply();
        },
        getTagsFromHTML:function(makeTagGroupObject) {
          var rawString = $('#panel-tags-list li span').text().trim(),
              tagGroupList = rawString.split('`').slice(0, -1),
              result = [],
              len = tagGroupList.length,
              i,
              tagGroup;

          console.log('rawString', rawString);
          console.log('rawString.split', rawString.split('`').slice(0, -1));
          for (i = 0; i < len; i += 1) {
              tagGroup = (tagGroupList[i] + '').trim().split(' ');
              result.push(makeTagGroupObject ? {
                  'tagGroup': tagGroup
              } : tagGroup);
          }

          return result;
      },
          submitCurrentTask : function () {
              if ($scope.currentTask) {
                  var userResponseId = $scope.currentTask['urid'],
                  // tagsAsString = $('#panel-tags-list li span').text().trim(),
                      tagsAsTagGroupArray = o.getTagsFromHTML(true),
                      seconds = Math.floor(((new Date()).getTime() - $scope.currentTask.startTime) / 1000);

                  $scope.GeneralService.submitTagTask(userResponseId, tagsAsTagGroupArray, seconds, $scope.currentTask.MAX_GROUP_SIZE)
                      .then(function (data) {
                          $scope.StatusChecker.check(data['status'], data)
                              .pass(function (data) {
                                  o.completeTaskNum+=1;
                                  o.loadNextTask();
                              })
                              .invalidCredential(function (data) {
                                  $scope.loginError = true;
                                  $scope.logout();
                              })
                              .reSubmitForbidden(function (data) {
                                  $scope.tagSystem.notice($scope.CONFIG.MESSAGE.RESUBMIT_FORBIDDEN);
                              })
                              .noAuth(function (data) {
                                  $scope.tagSystem.notice($scope.CONFIG.MESSAGE.NO_AUTH);
                              })
                              .not($scope.CONFIG.STATUS.ERROR, function (data) {
                                  $scope.userStat = data['userstat'];
                              })
                              .otherwise(function (data) {
                                  $scope.tagSystem.notice($scope.CONFIG.MESSAGE.ERROR);
                                  $scope.tagSystem.notice('submitTagTask otherwise: ', data);
                              });
                      })
              }

          },
        onTagNumReachMax:function(groupIndex){
            $scope.tagSystem.notice('第'+groupIndex+'组group的tag数量达到最大了哦亲');
        },
        onTagNameStringError:function(tagName){
            if(tagName==''){
                $scope.tagSystem.notice('标签名称不能为空');
            }
            else{
                $scope.tagSystem.notice('标签名称:<b> '+tagName+' </b>是不合法的哦');
            }

        },
        onTagNameLengthError:function(tagName){
            $scope.tagSystem.notice('标签名称:<b> '+tagName+' </b>的长度是不合法的，不能超过'+$scope.TAG_APP_CONFIG.MAX_GROUP_SIZE+'个字符哦');
        },
        onTagNameDuplicate:function(tagName){
            $scope.tagSystem.notice('标签名称:<b> '+tagName+' </b>已经存在了');
        },
        isTagNameDuplicate:function(tagName){
            //console.log('isTagNameDuplicate---tagName',tagName);
            var result=false;
            for(var i in $scope.tasks){
                var item=$scope.tasks[i].initTags;
                for(var j in item){
                    //console.log('item[j][0]',item[j][0]);
                    if(tagName==item[j][0]){
                        result=true;
                        break;
                    }
                }
            }
            return result;
        },
        isTagNameStringCorrect:function(tagName){
            var re=/^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g;
            return re.test(tagName);
        },
        isTagNameLengthCorrect:function(tagName){
            return tagName.length<TAG_APP_CONFIG.MAX_TAG_NAME_LENGTH;
        },
        isTagNumReachMax:function(groupIndex){
            groupIndex=groupIndex||0;
            return $scope.tasks[groupIndex].initTags.length>=TAG_APP_CONFIG.MAX_GROUP_SIZE;
        },
        isTagNameAvaliable:function(tagName){
            //console.log('tagName,o.currentEditingTagLastName,o.currentEditingTagLastName',tagName,o.currentEditingTagLastName,o.currentEditingTagLastName);
            if(((tagName!== o.currentEditingTagLastName) && (o.currentEditingTagLastName!==null))
            ||(o.currentEditingTagLastName===null)
            ){

                if(!o.isTagNameStringCorrect(tagName)){
                    o.onTagNameStringError(tagName);
                    return false;
                }
                if(!o.isTagNameLengthCorrect(tagName)){
                    o.onTagNameLengthError(tagName);
                    return false;
                }
                console.log('o.isTagNameDuplicate(tagName)',o.isTagNameDuplicate(tagName));
                if(o.isTagNameDuplicate(tagName)){
                    console.log('already exist');
                    o.onTagNameDuplicate(tagName);
                    return false;
                }
            }

            return true;
        },
        addTag : function (groupIndex) {
            var tagName= o.newTag.name.trim();
            groupIndex=groupIndex||0;
            if(o.isTagNumReachMax(groupIndex)){
                o.onTagNumReachMax(groupIndex);
                return false;
            }
            else{
                if(!o.isTagNameAvaliable(tagName)){
                    return false;
                }
                $scope.tasks[groupIndex].initTags.push([tagName]);
                $scope.$apply();
                o.clearNewTag();
            }
        },
        editTag:function(tagIndex,groupIndex,event){
            var val=o.currentEditingTagLastName=event.currentTarget.innerText;
            var $span=o.jqCurrentEditingTag=$(event.currentTarget);
            var $input=o.jqCurrentEditingText=$span.next().val(val);
            $input
                .css({
                    width:$span.outerWidth()+'px'
                })
            o.ifEditingTags=true;
            o.editingTagIndex=tagIndex;
            o.editingGroupIndex=groupIndex;
            setTimeout(function(){
                o.jqCurrentEditingTag.next().focus().select();
            },100);
        },
        cancelEdit:function(){
            if(o.isTagNameAvaliable(o.jqCurrentEditingText.val())){
                //o.jqCurrentEditingTag.find('b').first().html(o.currentEditingTagLastName);
                o.updateTagValue();
                o.ifEditingTags=false;
                o.editingTagIndex=null;
                o.editingGroupIndex=null;
                o.currentEditingTagLastName=null;
                o.jqCurrentEditingTag=null;
                //tasks[$index1].initTags[$index][0]


                $scope.$apply();
                //return false;
            }

        },
        updateTagValue:function(){
            $scope.tasks[o.editingGroupIndex].initTags[o.editingTagIndex][0]=o.jqCurrentEditingText.val();
            //o.editingTagIndex=tagIndex;
            //o.editingGroupIndex=groupIndex;
        },
        randomColor:function (index) {
          var colors = $scope.CONFIG.ColorPallete,
              len = colors.length,
              r;

          if (typeof index === 'number') {
            return colors[index % len];
          } else {
            return Math.floor(Math.random() * len) % len;
          }
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
                          //delete $scope.user;
                          location.reload();
                      });
              })
              .catch(function (error) {
                  //delete $scope.user;
                  location.reload();
              });

      },
      getTVC:function(){
        var tasks;
console.log('geting tvc')
        $scope.GeneralService.getTVC()
            .then(function (data) {
              $scope.StatusChecker.check(data['status'], data)
                  .pass(function (data) {
                    console.log('gettvc pass: ', data);
                    tasks = [];

                    angular.forEach(data['tvc'], function (t, index) {
                      var taskObj = {};

                      angular.extend(taskObj, t);

                      taskObj.initTags = $scope.lib.upDimension(t['task_description']['data']['tags']);
                      taskObj.MAX_GROUP_SIZE = t['task_description']['data']['max_group_size'];
                      taskObj.imgSrc = $scope.lib.stripImgSrcFromHTML(t['task_description']['div']);
                      taskObj.div = t['task_description']['div'];

                      tasks.push(taskObj);
                    });

                    $scope.tasks = tasks;
                    if ($scope.tasks.length > 0) {
                      o.loadNextTask();
                    }
                  })
                  .noTask(function (data) {
                    $scope.tagSystem.notice(Config.MESSAGE.NO_TASK);
                    console.log('no task yet!', data);
                  })
                  .not($scope.CONFIG.STATUS.ERROR, function (data) {
                    $scope.userStat = data['userstat'];
                  })
                  .otherwise(function (data) {
                    console.log('gettvc otherwise: ', data);
                  });
            })
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
      init:function(){
        o.checkUserLoginStatus();
          $(document).click(function(e){
              if(o.ifEditingTags && e.target!==o.jqCurrentEditingText.get(0)){
                  o.cancelEdit();
              }
          })
      }
    };
    o.init();
    return o;
  }
  return returnFun;
}

UserTaskController.$inject=['$scope', 'GeneralService', 'StatusChecker', 'CONFIG', '$rootScope','tagSystem','lib','TAG_APP_CONFIG'];
function UserTaskController($scope, GeneralService, StatusChecker, CONFIG, $rootScope,tagSystem,lib,TAG_APP_CONFIG){
  $scope.GeneralService=GeneralService;
  $scope.StatusChecker=StatusChecker;
  $scope.CONFIG=CONFIG;
  $scope.lib=lib;
  $scope.tagSystem=tagSystem($scope,$rootScope);
  $scope.TAG_APP_CONFIG=TAG_APP_CONFIG;

    $scope.tagSortableOptions={
        placeholder:'tag',
        connectWith:'.tag-list'
    };

    $scope.UILock = false;

    $scope.$on('lock', function (event, data) {
        $scope.UILock = true;
    });

    $scope.$on('unlock', function (event, data) {
        $scope.UILock = false;
    });
}

})()