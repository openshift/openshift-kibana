define(function (require) {
  var plugin = require('modules').get('plugins/openshift-kibana');
  var qs = require('utils/query_string');
  plugin.provider('AuthService', function () {
    this.$get = function ($location, UserStore) {
      return {
        stashToken: function (config) {
          // TODO just so other code kinda behaves the same
          var user = UserStore.getUser();
          if ('auth_token' in user) {
            UserStore.setToken(user.auth_token);
          } else if (config.headers.Authorization){
            var auth = config.headers.Authorization.split(' ');
            if(auth.length >= 2 && auth[0] === 'Bearer'){
              UserStore.setToken(auth[1]);
            }
          }
        },
        setAuthorization: function (config) {
          config.headers.Authorization = 'Bearer ' + UserStore.getToken();
        },
        hasAuthorization: function (config) {
          return config.headers.Authorization || false;
        }
      };
    };
  });
  plugin.factory('AuthInterceptor', ['AuthService', function (AuthService) {
    return {
      request: function (config) {
        AuthService.stashToken(config);
        if (!AuthService.hasAuthorization(config)) {
          AuthService.setAuthorization(config);
        }
        return config;
      }
    };
  }]);
  plugin.config(function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
  });
});
