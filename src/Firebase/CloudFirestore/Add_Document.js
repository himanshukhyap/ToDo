import { collection, addDoc, setDoc, doc, Timestamp } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../FirebaseConfig";
var moment = require('moment');
export const Add_Document = async (data,uid) => {
    try {
        const docRef = await addDoc(collection(db, "ToDo"), {
                         Complete: false,
                         Task: data.Task,
                         Date:Timestamp.fromDate(new Date()),
                         UserId:uid
                   });
                   if (docRef.id!=null) {
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'Your work has been saved',
                        showConfirmButton: false,
                        timer: 1500
                      })
                    
                   }
        // console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: e,
            footer: '<a href="">Why do I have this issue?</a>'
          })
        
    }
    // try {
    //     const docRef = await addDoc(collection(db, "cities"), {
    //         name: "San Francisco", state: "CA", country: "USA",
    //         capital: false, population: 860000,
    //         regions: ["west_coast", "norcal"]
    //     });
    //     console.log("Document written with ID: ", docRef);
    // } catch (e) {
    //     console.error("Error adding document: ", e);
    // }

//    try {
//         await setDoc(doc(db, "ToDo", uid), {
//             Complete: false,
//             Task: data.Task,
//             Date:Timestamp.fromDate(new Date()),
//         });
       
//     } catch (e) {
//         console.error("Error adding document: ", e);
//     }

}    
