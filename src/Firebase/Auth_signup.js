import { createUserWithEmailAndPassword } from "firebase/auth";
import { emailverification } from "./Auth_send_email_verification";
import { auth } from "./FirebaseConfig";

export const createuser = async (data) => {
    try {
        const user = await createUserWithEmailAndPassword(auth, data.Email, data.Password)
        emailverification(auth.currentUser)
        console.log(user);
        
    }
    catch (error) {
        console.log(error.message);
    }

}