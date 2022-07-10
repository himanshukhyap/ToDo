import { signOut } from "firebase/auth"
import { auth } from "./FirebaseConfig"

export const LogOut = async () => {
    await signOut(auth).then(() => {
        console.log("Signout successful")
    }).catch((error) => { console.log(error) })
} 