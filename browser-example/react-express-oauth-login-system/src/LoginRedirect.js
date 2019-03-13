import React from 'react';
//import {BrowserRouter as Router,Route,Link,Switch,Redirect} from 'react-router-dom'

        const LoginRedirect = function(props) {
           // console.log(['REDR',props.isLoggedIn()]);
            if (props.isLoggedIn()) {
               props.history.push("/login/profile");
            } else if (!props.isLoggedIn()) {
               props.history.push("/login/login");
            }
            return <b></b>;
        };
export default LoginRedirect;
