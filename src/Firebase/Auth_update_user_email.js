import { updateEmail } from "firebase/auth";
import { auth } from "./FirebaseConfig";

export const updateemailaddress=(user)=>{
    updateEmail(user, "user@example.com").then(() => {
 // Email updated!
  // ...
}).catch((error) => {
    // An error occurred
    // ...
  });
}
 