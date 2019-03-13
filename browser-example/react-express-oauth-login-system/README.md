# React Login System

This package provides an easy way to add user registration and login to a React web application. 

Add the routes to your express application and use the LoginSystem component in your client.

It integrates a complete oauth2 server implementation and uses that for local authentication and token generation in email links.

The delegated authentication provided by the oauth2 server is useful to allow third party web sites granular access to your application data.  For example, a public facing oauth server is required when developing apps for Google Home or Amazon Alexa that require user identification.


In the box
- React components to implement a login and registration system.
- Routes to support login, registration, password recovery and oauth login from various providers using passport.js
- Routes to implement an oauth2 server using the oauth library and the mongodb integration from https://github.com/slavab89/oauth2-server-example-mongodb




## Oauth Keys
https://github.com/settings/applications

https://developer.twitter.com/

https://www.instagram.com/developer/

https://developers.facebook.com/apps/

https://console.developers.google.com/
