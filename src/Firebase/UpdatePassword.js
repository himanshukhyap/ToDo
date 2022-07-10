import {  updatePassword } from "firebase/auth";
import { auth } from "./FirebaseConfig";


// const newPassword = "Kashyap04"
export const updatepassword=(newpassword)=>{
    updatePassword(auth.currentUser, newpassword).then(() => {
       console.log("Update successful");
      }).catch((error) => {
        console.log(error);
      });
}
