// LOGIN TEMPLATE
module.exports.login =  `
            <div class="row" >
                <div class='col-12 warning-message'>{{warning_message}}</div>
                <div class="col-6 card">
                    <form method="POST" action="http://localhost:4000/oauth/token" class="form-group">
                      <h3 class="card-title">Sign In</h3>
                      <div class='col-12 warning-message'>{{signin_warning_message}}</div>
                
                        <label for="email_login" class="row">Email </label><input id="email_login" type='text' name='username'  value="{{email_login}}admin" />
                        <label for="password_login" class="row">Password </label><input id="password_login" type='text' name='password' value="admin" />
                        <br/><br/>
                       <button  class='btn btn-info'>Sign In</button>
                       <input type='hidden' name='grant_type' value='password' />
                        <input type='hidden' name='client_id' value='{{clientId}}' />
                        <input type='hidden' name='client_secret' value='{{clientSecret}}' />
                        <input type='hidden' name='grants' value='defaultscope' />
                    </form>
                </div>
                <div class="col-6  card">
                    <form method="POST" action="/oauth/signup" class="form-group" >
                      <h3 class="card-title">Sign Up</h3>
                      <div class='col-12 warning-message'>{{signup_warning_message}}</div>
                
                        <label for="name" class='row'>Name </label><input id="name" type='text' name='name' value="{{name}}">
                        <label for="email" class='row'>Email </label><input id="email" type='text' name='email' value="{{email}}">
                        <label for="password" class='row'>Password</label> <input id="password" type='text' name='password' />
                        <label for="password2" class='row'>Repeat Password</label><input id="password2" type='password' name='password2' />
                        <br/>
                        <br/>
                        <button  class='btn btn-info'>Sign Up</button>
                    </form>
                    <br/>
                </div>
            </div>
            
            `


// LAYOUT TEMPLATE

module.exports.layout =  `


<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script
  src="https://code.jquery.com/jquery-3.3.1.min.js"
  integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
  crossorigin="anonymous"></script>
  
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
  </head>
  <div id="root" class="root">
    <div class="mnemo">
    <br/><br/>
        <div class="container">
            {{&content}}
        </div>
      
  </body>
  
</html>
`
module.exports.layout =  `


<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <meta name="google-signin-client_id" content="1049709865001-vd3ddolmkf66rdo73624ocj16d6g5ueo.apps.googleusercontent.com">
    <script src="/res/foundation/js/vendor/jquery.js"></script>
    
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
    <link rel="shortcut icon" href="/res/favicon.ico">
    <title>AAA</title>
  </head>
  <body>
    <div id="root" class="root">
    <div class="mnemo">
    
           
        <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark" >
          <div class="navbar-brand"  style="width: 100%">
          <a  href="/" ><img alt="" src="" height="100%" data-toggle="collapse" data-target="#navbarCollapse"/></a>
          <div class='page-title'><h4>AAA</h4></div>
          </div>
          
          
        </nav>
        <br/><br/>
        <div class="container">
        {{&content}}
        </div>
     
  </body>
  
</html>



`
