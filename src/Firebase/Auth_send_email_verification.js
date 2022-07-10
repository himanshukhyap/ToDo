import {  sendEmailVerification } from "firebase/auth";

export const emailverification=(currentUser)=>{
    sendEmailVerification(currentUser)
    .then(() => {
        
    console.log("send");
    })
}
