var mcs_config = {
  "logLevel": "",
  "mobileBackends": {
    "BeverageMBE_DEV": {
      "authType": "basicAuth",
      "default": true,
      "baseUrl": "https://jebsenmobile1-a425498.mobileenv.us2.oraclecloud.com:443",
      "applicationKey": "ffcc6806-c491-4e01-9b91-00b454476ef1",
      "authorization": {
        "basicAuth": {
          "backendId": "c8d45708-8f23-4e1c-8290-85d9961016c1",
          "anonymousToken": "QTQyNTQ5OF9KRUJTRU5NT0JJTEUxX01PQklMRV9BTk9OWU1PVVNfQVBQSUQ6VGsybWhydm51d28uNmE="
        },
        "oAuth": {
          "clientId": "e7e1c3cc-cd75-4796-b122-dd3a9bb79641",
          "clientSecret": "wViXGPWFEfgpIwDBHft9",
          "tokenEndpoint": "https://a425498.identity.us.oraclecloud.com/oam/oauth2/tokens"
        },
        "facebookAuth":{
          "facebookAppId": "YOUR_FACEBOOK_APP_ID",
          "backendId": "YOUR_BACKEND_ID",
          "anonymousToken": "YOUR_BACKEND_ANONYMOUS_TOKEN"
        },
        "ssoAuth":{
          "clientId": "YOUR_CLIENT_ID",
          "clientSecret": "YOUR_ClIENT_SECRET",
          "tokenEndpoint": "YOUR_TOKEN_ENDPOINT"
        }
      }
    }
  }
};
