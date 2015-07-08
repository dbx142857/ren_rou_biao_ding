'use strict';
var COGTU_DEBUG_MODE=true;
var TAG_API_CONFIG={
    HOST_URL: 'http://139.219.13.2:5000',
    STATUS: {
        PASS: 'pass',
        INVALID_CREDENTIAL: 'invalid_credential',
        NO_TASK: 'no_task',
        NO_AUTH: 'no_auth',
        RESUBMIT_FORBIDDEN: 'resubmit_forbidden',
        ERROR: 'error'
    },
    MESSAGE: {
        INVALID_CREDENTIAL: '用户名或密码错误。',
        ERROR: '未知错误，如有问题，请联系系统管理员。',
        NO_TASK: '暂时没有任务，请稍候再试。',
        NO_AUTH: '您还没有登录，请登录后再次提交。',
        RESUBMIT_FORBIDDEN: '不能重复提交任务，请进行下一个任务。',
        TAG_INPUT_ERROR: '添加标签出错（空标签或重复标签？当前无任务？）'
    },
    ColorPallete: ['#f7c2ff', '#cbc2ff', '#c2cfff', '#c2e6ff',
        '#c2fbff', '#c2ffe2', '#e4ffc2', '#ffccc2'
    ]
};
angular.module('tag.api', ['ngSanitize'])
    .value('CONFIG',TAG_API_CONFIG)

/**
 * An Ajax call wrapper
 * @param {Object} options The whole options to for the ajax call
 * @param {string} options.method 'GET', 'POST', 'PUT', 'DELETE'
 * @param {string} options.path Full api path of the call, starts with '/'
 * @param {string} options.url Full url of the call, overriding options.api
 * @param {Object} options.data Data to be sent as the request message data.
 * @param {boolean} options.jsonSerialize if true, json serialize options.data
 * @param {boolean} options.withCredentials Whether to set the withCredentials flag on the XHR object.
 * @return {Promise} The promise returned - chainable with .then, .catch, and .finally call
 */
.factory('AjaxCall', ['CONFIG', '$http', '$q', 'UIState', function (CONFIG, $http, $q, UIState) {



    var callerJQ = function (options) {
        var def = $q.defer();

        var defaultOptions = {
            xhrFields: {
                withCredentials: true
            },
            jsonSerialize: true,
            crossDomain: true
        };

        options.type = options.method;

        for (var key in defaultOptions) {
            if (defaultOptions.hasOwnProperty(key) && typeof options[key] === 'undefined') {
                options[key] = defaultOptions[key];
            }
        }

        if (!options.url) {
            options.url = CONFIG.HOST_URL + options.path;
        }

        if (options.jsonSerialize === true) {
            options.data = JSON.stringify(options.data);
        }

        if (options.withCredentials) {
            options.xhrFields = {
                withCredentials: true
            };
        }

        console.log('ready to ajax', options, $.ajaxSettings);

        UIState.lock();

        $.ajax(options)
            .done(function (data) {
                def.resolve(data);
            })
            .fail(function (jqXHR) {
                def.reject(jqXHR);
            })
            .always(function () {
                UIState.unlock();
            });

        return def.promise;
    };

    return callerJQ;


}])

/*
 * use as StatusChecker.check(data.status, data)
 *                   .on('pass', callback)
 *                   .on('invalid', callback)
 *                   .on(...)...
 */
.factory('StatusChecker', ['CONFIG', function (CONFIG) {

    return {
        theStatus: 'somevaluethatwillneverbematched',
        theData: null,
        hittedStatus: [],

        check: function (status, data) {
            this.theStatus = status;
            this.theData = data;
            this.hittedStatus = [];
            return this;
        },

        on: function (status, callback) {
            //status match, 
            //and make sure the same staus cannot be included in two consecutive on() calls
            if (this.theStatus === status && this.hittedStatus.indexOf(status) === -1) {
                console.log('StatusChecker hit: ' + status, this.theData);

                this.hittedStatus.push(status);
                callback(this.theData);
            }



            return this;
        },

        not: function (status, callback) {
            if (this.theStatus !== status) {
                callback(this.theData);
            }

            return this;
        },

        all: function (callback) {
            callback(this.theData);

            return this;
        },

        otherwise: function (callback) {
            //.check(status)        suppose status === 'pass'  --> hittedStatus = ['pass']
            //.on('pass'...)        this will run
            //.on('invalid'...)     this will not run
            //.otherwise(...)       this will not run

            //.check(status)        suppose status === 'error'  --> hittedStatus = ['error']
            //.on('pass'...)        this will not run
            //.on('invalid'...)     this will not run
            //.otherwise(...)       this will run (only if none of the previous ones is called, i.e. hittedStatus is empty!)

            if (this.hittedStatus.length === 0) {
                callback(this.theData);
            }

            //do not return 'this', 
            //because otherwise() should be the tail of the chain
            return null;
        },

        pass: function (callback) {
            return this.on(CONFIG.STATUS.PASS, callback);
        },

        invalidCredential: function (callback) {
            return this.on(CONFIG.STATUS.INVALID_CREDENTIAL, callback);
        },

        noTask: function (callback) {
            return this.on(CONFIG.STATUS.NO_TASK, callback);
        },

        reSubmitForbidden: function (callback) {
            return this.on(CONFIG.STATUS.RESUBMIT_FORBIDDEN, callback);
        },

        noAuth: function (callback) {
            return this.on(CONFIG.STATUS.NO_AUTH, callback);
        },

        error: function (callback) {
            return this.on(CONFIG.STATUS.ERROR, callback);
        }
    };

}])

.service('UIState', ['$rootScope', function ($rootScope) {
    var that = this;
    // that.Calling = false;
    that.lock = function () {
        $rootScope.$broadcast('lock');
    };
    that.unlock = function () {
        $rootScope.$broadcast('unlock');
    };

}])

.service('GeneralService', ['AjaxCall', '$http', 'CONFIG', '$q',
    function (AjaxCall, $http, CONFIG, $q) {
        var that = this;



        var generalCall = function (method, path, data) {
            var def = $q.defer();

            AjaxCall({
                    method: method,
                    path: path,
                    data: data
                })
                .then(function (data) {
                    def.resolve(data);
                })
                .catch(function (error) {
                    // console.error('error', error); 
                    def.reject(error);
                });

            return def.promise;
        };

        that.login = function (username, password) {
            return generalCall('POST', '/api/login', {
                logname: username,
                logpwd: password
            });
        };

        that.logout = function () {
            return generalCall('GET', '/api/logout', null);
        };

        that.userinfo = function () {
            return generalCall('GET', '/api/userinfo', null);
        };

        that.getTVC = function () {
            return generalCall('GET', '/api/tags/gettvc', null);
        };

        //that.submitTagTask = function (userResponseId, tagsAsTagGroupArray, seconds, maxGroupSize) {
        //
        //    var body = {
        //        'urid': userResponseId,
        //        'ur_result': {
        //            'group_list': tagsAsTagGroupArray
        //        },
        //        'time_used': seconds,
        //        'max_group_size': maxGroupSize
        //    };
        //
        //    return generalCall('POST', '/api/tags/submitur', body);
        //};

        that.submitTagTask = function (data) {

            //var body = {
            //    'urid': userResponseId,
            //    'ur_result': {
            //        'group_list': tagsAsTagGroupArray
            //    },
            //    'time_used': seconds,
            //    'max_group_size': maxGroupSize
            //};

            return generalCall('POST', '/api/tags/submitur', data);
        };


    }
]);