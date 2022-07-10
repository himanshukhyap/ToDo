import {  signInWithPopup } from 'firebase/auth';
import React from 'react'
import Swal from 'sweetalert2';
import { auth } from './FirebaseConfig';
import { provider } from './GoogleAuthProvider ';



  export   const  googleSingIn=()=>{
        signInWithPopup(auth, provider)
        .then((result) => {
          console.log(result);
          // This gives you a Google Access Token. You can use it to access the Google API.
        //   const credential = GoogleAuthProvider.credentialFromResult(result);
        //   const token = credential?.accessToken;
          // The signed-in user info.
        //   const user = result.user;
          // ...
        //   console.log(credential)
      
        //   console.log(user);

        if (result?.user.uid!=null) {
        
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: "Login Success",
            showConfirmButton: false,
            timer: 3000
          })
        }
        }).catch((error) => {
          Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: error,
            showConfirmButton: false,
            timer: 3000
          })
          console.log(error);
          // Handle Errors here.
        //   const errorCode = error.code;
      //     const errorMessage = error.message;
      // console.log(errorMessage);
          // The email of the user's account used.
        //   const email = error.customData.email;
          // The AuthCredential type that was used.
        //   const credential = GoogleAuthProvider.credentialFromError(error);
          // ...
        });
      }
        


