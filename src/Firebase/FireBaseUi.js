var firebase = require('firebase');
var firebaseui = require('firebaseui');
import React from 'react'

function FireBaseUi() {
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', {
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
      // Other config options...
    });
  return (
    <div>FireBaseUi</div>
  )
}

export default FireBaseUi