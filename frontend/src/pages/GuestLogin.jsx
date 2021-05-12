import React, { Component } from 'react'
import MaterialNavBar from '../components/MaterialNavBar';

class GuestLogin extends Component {

    constructor(props) {
        super(props);
        this.state = {
            firstName: '',
            lastName: '',
            netid: '',
            problem: '',
        }
    }

    componentDidMount() {
        console.log('mounted guest login')
        window.location = "localhost:3000/canvas";
        //window.location = "https://https://innovators-canvas.herokuapp.com/canvas";
    }

    

    getLoginText() {
        return (
            <div>Logging in as guest.</div>
        )
    }

    render () {
        return (
            <div>
                <MaterialNavBar loggedIn={false} title='Guest Login'/>
                <br/><br/><br/><br/><br/>
                {this.getLoginText()}
            </div>
        )
    }
}

export default GuestLogin