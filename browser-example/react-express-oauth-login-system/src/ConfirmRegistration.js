import  React, { Component } from 'react';
//import {BrowserRouter as Router,Route,Link,Switch,Redirect} from 'react-router-dom'

export default  class ConfirmRegistration extends Component {
    
     
    render() {
        if (this.props.match.params.token) {
            this.props.loginByConfirm(this.props.match.params.token);
        }
        this.props.history.push("/");
        return '';
    };
}
