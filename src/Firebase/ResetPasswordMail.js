import {  sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./FirebaseConfig";

export const PasswordresetEmail=(email)=>{
    // console.log(email);
    sendPasswordResetEmail(auth, email)
    .then(() => {
      console.log("mailSend");
    })

    .catch((error) => {
    //   const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorMessage);
      // ..
    });
}
 