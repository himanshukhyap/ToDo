import { signInWithEmailAndPassword } from "firebase/auth";
import Swal from "sweetalert2";
import { auth } from "./FirebaseConfig";

export     const LoginUser = async (data) => {
    try {
        const userlogin = await signInWithEmailAndPassword(auth, data.Email, data.Password)
         console.log(userlogin?.user.uid);
      if (userlogin?.user.uid!=null) {
        Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: "Login Success",
            showConfirmButton: false,
            timer: 3000
          })
      }
       
    } catch (error) {
      
        
            Swal.fire({
                position: 'top-end',
                icon: 'error',
                title: error.message,
                showConfirmButton: false,
                timer: 3000
              })
        
    }

}  